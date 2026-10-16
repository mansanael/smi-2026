import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeteoChantier } from '../suivi-chantier/entities/journal-chantier.entity';
import { GraviteIncident, TypeIncident } from '../suivi-chantier/entities/incident.entity';
import { GraviteAlerte } from '../ai/alerte.entity';

export interface ProblemeDetecte {
  probleme: boolean;
  gravite: GraviteAlerte.WARNING | GraviteAlerte.DANGER;
  resume: string;
}

export interface IncidentPropose {
  type: TypeIncident;
  gravite: GraviteIncident;
  description: string;
}

// Proposition de rapport journalier : l'utilisateur la relit et la corrige avant de l'enregistrer
export interface CompteRenduPropose {
  date: string;
  meteo: MeteoChantier | null;
  nombreOuvriers: number | null;
  travauxRealises: string;
  resteAFaire: string;
  problemes: string;
  materiaux_receptionnes: string;
  visitesDuJour: string;
  observations: string;
  incidents: IncidentPropose[];
  nombreNotes: number;
}

export interface NotePourCompteRendu {
  texte: string;
  auteurNom: string;
  enregistreeLe: Date;
}

const PROMPT_PROBLEME = `Tu lis une note dictée par un membre de l'équipe sur un chantier BTP au Sénégal.
Dis si elle signale un PROBLÈME qui demande l'attention du chef de projet ou de la direction :
accident ou blessure, danger, vol, manque ou rupture de matériaux, panne d'engin, retard,
malfaçon, arrêt des travaux, conflit avec un sous-traitant ou un voisin, intempérie qui bloque le travail.
Un simple avancement normal ("le carrelage est terminé", "il reste la peinture") n'est PAS un problème.
Gravité : "danger" pour un accident, une blessure, un danger pour les personnes ou un arrêt du chantier ;
"warning" pour le reste.
Réponds uniquement en JSON : {"probleme": true|false, "gravite": "warning"|"danger", "resume": "une phrase courte"}.
Le résumé décrit le problème en français correct avec les accents, sans inventer, et reste vide s'il n'y a pas de problème.`;

const PROMPT_COMPTE_RENDU = `Tu es conducteur de travaux sur un chantier BTP au Sénégal. À partir des notes vocales
dictées dans la journée (transcriptions, parfois imparfaites), rédige le rapport journalier du chantier.
Règles :
- N'utilise QUE les faits des notes. N'invente rien. Si une information n'est pas dite, laisse le champ vide ("") ou null.
- Corrige les erreurs évidentes de transcription et le vocabulaire de chantier, en restant fidèle au sens.
- Écris un français correct, AVEC les accents (é, è, à, ç, œ…).
- Les champs texte sont des listes courtes, une ligne par point, chaque ligne commence par "- ".
- travauxRealises : ce qui a été fait aujourd'hui. resteAFaire : ce qui reste à faire ou est prévu.
- problemes : manques, pannes, retards, accidents, difficultés. materiaux_receptionnes : livraisons reçues.
- visitesDuJour : visiteurs (client, bureau de contrôle, maître d'œuvre…). observations : le reste d'utile.
- nombreOuvriers : nombre entier seulement s'il est dit, sinon null.
- meteo : "ensoleille", "nuageux", "pluie", "harmattan" ou "orage" seulement si elle est mentionnée, sinon null.
- incidents : seulement les vrais incidents (accident, blessure, casse, vol, malfaçon, rupture d'approvisionnement),
  avec type parmi "securite", "qualite", "materiel", "approvisionnement", "autre"
  et gravite parmi "faible", "moyen", "grave", "critique". Liste vide s'il n'y en a pas.
Réponds uniquement en JSON avec exactement ces clés :
{"travauxRealises": "", "resteAFaire": "", "problemes": "", "materiaux_receptionnes": "", "visitesDuJour": "",
 "observations": "", "nombreOuvriers": null, "meteo": null, "incidents": [{"type": "", "gravite": "", "description": ""}]}`;

const texte = (v: unknown, max = 4000): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : Array.isArray(v) ? texte(v.filter((x) => typeof x === 'string').map((x) => `- ${x}`).join('\n'), max) : '';

const valeurDe = <T extends string>(valeurs: T[], v: unknown): T | null =>
  valeurs.includes(v as T) ? (v as T) : null;

/** Contrôle la réponse de l'IA : rien d'autre que les champs attendus, avec des valeurs permises */
export function normaliserCompteRendu(brut: unknown, date: string, nombreNotes: number): CompteRenduPropose {
  const r = (brut && typeof brut === 'object' ? brut : {}) as Record<string, unknown>;
  const ouvriers = typeof r.nombreOuvriers === 'number' ? r.nombreOuvriers
    : typeof r.nombreOuvriers === 'string' && r.nombreOuvriers.trim() ? Number(r.nombreOuvriers) : NaN;
  const incidents = Array.isArray(r.incidents) ? r.incidents : [];
  return {
    date,
    meteo: valeurDe(Object.values(MeteoChantier), r.meteo),
    nombreOuvriers: Number.isInteger(ouvriers) && ouvriers >= 0 && ouvriers < 10000 ? ouvriers : null,
    travauxRealises: texte(r.travauxRealises),
    resteAFaire: texte(r.resteAFaire),
    problemes: texte(r.problemes),
    materiaux_receptionnes: texte(r.materiaux_receptionnes),
    visitesDuJour: texte(r.visitesDuJour, 500),
    observations: texte(r.observations),
    incidents: incidents
      .map((i) => (i && typeof i === 'object' ? (i as Record<string, unknown>) : {}))
      .map((i) => ({
        type: valeurDe(Object.values(TypeIncident), i.type) ?? TypeIncident.AUTRE,
        gravite: valeurDe(Object.values(GraviteIncident), i.gravite) ?? GraviteIncident.MOYEN,
        description: texte(i.description, 255),
      }))
      .filter((i) => i.description)
      .slice(0, 5),
    nombreNotes,
  };
}

export function normaliserProbleme(brut: unknown): ProblemeDetecte {
  const r = (brut && typeof brut === 'object' ? brut : {}) as Record<string, unknown>;
  const resume = texte(r.resume, 250);
  return {
    probleme: r.probleme === true && resume.length > 0,
    gravite: r.gravite === GraviteAlerte.DANGER ? GraviteAlerte.DANGER : GraviteAlerte.WARNING,
    resume,
  };
}

// Le modèle entoure parfois le JSON de texte : on garde le premier objet
export function extraireJson(contenu: string): unknown {
  const sansReflexion = contenu.replace(/<think>[\s\S]*?<\/think>/gi, '');
  const debut = sansReflexion.indexOf('{');
  const fin = sansReflexion.lastIndexOf('}');
  if (debut < 0 || fin <= debut) throw new Error('Pas de JSON dans la réponse');
  return JSON.parse(sansReflexion.slice(debut, fin + 1));
}

const heure = (d: Date) =>
  new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Dakar' });

/** Lecture des notes vocales par l'IA (modèles de texte de Groq) */
@Injectable()
export class AnalyseChantierService {
  private readonly logger = new Logger(AnalyseChantierService.name);
  private readonly apiKey: string;
  private readonly url = 'https://api.groq.com/openai/v1/chat/completions';
  // Secours en cascade si un modèle atteint sa limite
  private readonly modeles = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.3-70b-versatile'];

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('GROQ_API_KEY', '');
  }

  /** Repère un problème dans une note. En cas d'échec de l'IA : pas de problème signalé (la note est gardée). */
  async detecterProbleme(texteNote: string): Promise<ProblemeDetecte> {
    const aucun: ProblemeDetecte = { probleme: false, gravite: GraviteAlerte.WARNING, resume: '' };
    if (!this.apiKey || texteNote.trim().length < 8) return aucun;
    try {
      return normaliserProbleme(await this.demanderJson(PROMPT_PROBLEME, texteNote, 300, 8000));
    } catch (err) {
      this.logger.warn(`Analyse de la note impossible : ${(err as Error).message}`);
      return aucun;
    }
  }

  async preparerCompteRendu(notes: NotePourCompteRendu[], date: string): Promise<CompteRenduPropose> {
    const transcriptions = notes
      .map((n) => `[${heure(n.enregistreeLe)} — ${n.auteurNom}] ${n.texte}`)
      .join('\n');
    try {
      const brut = await this.demanderJson(
        PROMPT_COMPTE_RENDU,
        `Date du rapport : ${date}\nNotes vocales de la journée :\n${transcriptions}`,
        1500,
        25000,
      );
      return normaliserCompteRendu(brut, date, notes.length);
    } catch (err) {
      this.logger.error(`Compte rendu impossible : ${(err as Error).message}`);
      throw new ServiceUnavailableException("L'IA n'a pas pu préparer le compte rendu. Réessayez dans un instant.");
    }
  }

  private async demanderJson(consigne: string, contenu: string, maxTokens: number, delaiMs: number): Promise<unknown> {
    if (!this.apiKey) throw new Error('Clé GROQ_API_KEY absente');
    let derniereErreur = 'aucun modèle disponible';
    for (const modele of this.modeles) {
      let res: Response;
      try {
        res = await fetch(this.url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modele,
            messages: [
              { role: 'system', content: consigne },
              { role: 'user', content: contenu },
            ],
            temperature: 0.2,
            max_tokens: maxTokens,
            response_format: { type: 'json_object' },
            ...(modele.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {}),
          }),
          signal: AbortSignal.timeout(delaiMs),
        });
      } catch (err) {
        derniereErreur = (err as Error).message;
        break; // réseau coupé ou délai dépassé : inutile d'essayer les autres modèles
      }
      if (res.ok) {
        const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        return extraireJson(data.choices?.[0]?.message?.content ?? '');
      }
      derniereErreur = `Groq ${res.status} sur ${modele} : ${(await res.text()).slice(0, 300)}`;
      if (res.status === 401 || res.status === 403) break; // clé refusée : même résultat partout
      this.logger.warn(derniereErreur);
    }
    throw new Error(derniereErreur);
  }
}
