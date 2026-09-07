import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiContextService } from './ai-context.service';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

interface JwtUser {
  id: string;
  email: string;
  role: RoleUtilisateur;
  nom: string;
  prenom: string;
}

const RESPONSE_FORMAT_RULES = `
Identité (OBLIGATOIRE) :
- Tu es l'Assistant IA de BATIPME-SN, et uniquement cela. Ne mentionne jamais ChatGPT, GPT, OpenAI, Llama, Meta ou tout autre nom de modèle ou entreprise.
- Si on te demande qui tu es, réponds : "Je suis l'assistant IA de BATIPME-SN, conçu pour vous aider à gérer vos projets BTP."

Format de réponse (OBLIGATOIRE) :
1. Commence par un **résumé en 1-2 phrases** directement utile.
2. Ensuite, organise le contenu en **sections avec titres ##** (ex. : "## Situation actuelle", "## Points d'attention", "## Recommandations").
3. Utilise des **listes à puces** pour les données chiffrées ou les actions.
4. Cite les **valeurs réelles** issues des données BATIPME (montants FCFA, %, dates, références projet) quand elles sont disponibles.
5. Termine par une section **## Prochaines étapes** avec 2-4 actions concrètes.
6. Ne invente jamais de chiffres : si une donnée manque, dis-le clairement et propose d'utiliser les outils disponibles.
7. Réponds toujours en français, ton professionnel BTP.`;

@Injectable()
export class AiService {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  // Cascade de modèles : si l'un est en rate limit, on passe au suivant
  private readonly modelChain = [
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
    'qwen/qwen3.6-27b',
    'qwen/qwen3.8-27b',
  ];
  private readonly maxToolRounds = 4;

  constructor(
    private readonly config: ConfigService,
    private readonly contextService: AiContextService,
  ) {
    this.apiKey = this.config.get<string>('GROQ_API_KEY', '');
    if (!this.apiKey) {
      console.warn(
        '⚠️  GROQ_API_KEY non définie dans .env — le module AI ne fonctionnera pas.',
      );
    }
  }

  private buildSystemPrompt(snapshot: string, projetId?: string): string {
    const focus = projetId
      ? "Un projet est sélectionné dans l'interface : priorise ses données pour les questions du portefeuille."
      : 'Aucun projet sélectionné : réponds au niveau portefeuille ou demande quel projet cibler si nécessaire.';

    return `Tu es l'assistant IA de BATIPME-SN, logiciel de gestion de projets BTP pour les PME du Sénégal.

Tu as accès aux **données réelles** de l'application via un snapshot JSON et des outils (tools) pour interroger projets, budget, planning, suivi chantier, stock, facturation et documents.

${focus}

Tu es expert en gestion de chantiers, réglementation BTP sénégalaise, planification, budgétisation, ressources, approvisionnement, facturation (TVA 18%) et sécurité chantier.

Données actuelles de l'application (snapshot) :
\`\`\`json
${snapshot}
\`\`\`

Utilise les outils disponibles pour compléter ou actualiser les données si la question le nécessite.
${RESPONSE_FORMAT_RULES}`;
  }

  async chat(
    messages: ChatMessage[],
    user: JwtUser,
    projetId?: string,
  ): Promise<{ reply: string; model: string }> {
    if (!this.apiKey) {
      throw new HttpException(
        'Clé API Groq non configurée. Ajoutez GROQ_API_KEY dans le fichier .env du backend.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const snapshot = await this.contextService.buildSnapshot(user, projetId);
    const systemPrompt = this.buildSystemPrompt(snapshot, projetId);

    const apiMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.filter((m) => m.role === 'user' || m.role === 'assistant'),
    ];

    const tools = this.contextService.getToolDefinitions();

    try {
      let round = 0;
      while (round < this.maxToolRounds) {
        round++;
        const response = await this.callGroq(apiMessages, tools);
        const choice = (
          response as {
            choices?: {
              message?: { content?: string; tool_calls?: ToolCall[] };
            }[];
          }
        ).choices?.[0];
        const assistantMessage = choice?.message;

        if (!assistantMessage) {
          throw new HttpException('Réponse IA vide.', HttpStatus.BAD_GATEWAY);
        }

        const toolCalls: ToolCall[] = assistantMessage.tool_calls ?? [];

        if (toolCalls.length === 0) {
          const raw =
            assistantMessage.content?.trim() || 'Aucune réponse générée.';
          // Supprimer les balises <think>...</think> du mode reasoning (Qwen, etc.)
          const reply =
            raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim() ||
            'Aucune réponse générée.';
          return { reply, model: this.modelChain[0] };
        }

        apiMessages.push({
          role: 'assistant',
          content: assistantMessage.content || '',
          tool_calls: toolCalls,
        });

        for (const call of toolCalls) {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(call.function.arguments || '{}');
          } catch {
            args = {};
          }

          if (
            projetId &&
            !args.projetId &&
            call.function.name.startsWith('get_project_')
          ) {
            args.projetId = projetId;
          }

          const result = await this.contextService.executeTool(
            call.function.name,
            args,
            user,
          );
          apiMessages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: result,
          });
        }
      }

      throw new HttpException(
        "L'assistant a atteint la limite d'analyse. Reformulez votre question.",
        HttpStatus.BAD_GATEWAY,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;

      console.error('AI Service error:', error);
      throw new HttpException(
        'Impossible de contacter le service IA. Vérifiez votre connexion.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async callGroq(
    messages: ChatMessage[],
    tools?: unknown[],
    modelIndex = 0,
    retries = 2,
  ): Promise<unknown> {
    const modelToUse =
      this.modelChain[modelIndex] ??
      this.modelChain[this.modelChain.length - 1];
    const body: Record<string, unknown> = {
      model: modelToUse,
      messages,
      temperature: 0.6,
      max_tokens: 900,
    };

    if (tools?.length) {
      body.tools = tools;
      body.tool_choice = 'auto';
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Groq API error [${modelToUse}]:`,
        response.status,
        errorBody,
      );

      if (response.status === 429) {
        let retryAfterMs = 1000;
        try {
          const parsed = JSON.parse(errorBody);
          const msg: string = parsed?.error?.message || '';
          const match = msg.match(/try again in ([\d.]+)ms/i);
          if (match) retryAfterMs = Math.ceil(parseFloat(match[1])) + 100;
          else {
            const secMatch = msg.match(/try again in ([\d.]+)s/i);
            if (secMatch)
              retryAfterMs = Math.ceil(parseFloat(secMatch[1]) * 1000) + 100;
          }
        } catch {
          /* ignore */
        }

        if (retries > 0) {
          const wait = Math.min(retryAfterMs, 5000);
          console.warn(
            `⏳ Rate limit [${modelToUse}] — retry dans ${wait}ms (${retries} restants)`,
          );
          await new Promise((r) => setTimeout(r, wait));
          return this.callGroq(messages, tools, modelIndex, retries - 1);
        }

        const nextIndex = modelIndex + 1;
        if (nextIndex < this.modelChain.length) {
          console.warn(`🔄 Cascade → ${this.modelChain[nextIndex]}`);
          return this.callGroq(messages, tools, nextIndex, 2);
        }

        throw new HttpException(
          'Tous les modèles IA sont temporairement saturés. Réessayez dans 30 secondes.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new HttpException(
        'Erreur lors de la communication avec le service IA.',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return response.json();
  }
}
