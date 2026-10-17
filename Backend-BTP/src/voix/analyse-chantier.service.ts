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

const PROMPT_RESUME_CLIENT = `Tu écris au client (maître d'ouvrage) d'un chantier BTP au Sénégal, souvent un particulier
qui fait construire et ne connaît pas le vocabulaire du bâtiment. À partir du rapport journalier VALIDÉ par l'équipe,
rédige un court message sur la journée.
Règles :
- N'utilise QUE les informations du rapport. N'invente rien, ne promets aucune date ni aucun délai.
- Français simple et chaleureux, vouvoiement, sans nom ni civilité (pas de « M. » ni « Mme »). Commence par « Aujourd'hui sur votre chantier ».
- Explique en quelques mots les termes techniques (ex. « la dalle, c'est-à-dire le plancher du 1er étage »).
- 4 à 8 lignes : ce qui a été fait, puis la prochaine étape s'il y en a une.
- Si des difficultés ou retards sont signalés, mentionne-les en une phrase calme et factuelle, sans dramatiser.
- Ne parle JAMAIS de blessures, d'accidents ni de personnes, ni des quantités de matériaux, ni du nombre d'ouvriers.
- Pas de Markdown, pas d'émoji, pas de liste à puces.
Réponds uniquement en JSON : {"resume": "le message"}.`;

const PROMPT_PARAMETRES_DEVIS = `Tu aides une entreprise BTP au Sénégal à chiffrer un projet. On te décrit un projet en une phrase
(souvent dictée). Extrais UNIQUEMENT les paramètres dits, sans rien inventer ni chiffrer.
- typeOuvrage : nature courte du projet (ex. "villa", "immeuble", "magasin", "école"), ou null.
- niveaux : nombre total de niveaux construits. R+0 ou plain-pied = 1, R+1 = 2, R+2 = 3, etc. null si non dit.
- surfaceM2 : surface en m² telle que dite (nombre), null si non dite.
- surfaceParNiveau : true seulement si la phrase dit que la surface est PAR niveau ou par étage (ex. "150 m² par étage").
- localisation : ville ou quartier, ou null.
- finition : "economique", "standard" ou "haut_standing" ; "normal", "moyen", "simple mais propre" = "standard" ;
  "luxe", "haut de gamme", "très bonne finition" = "haut_standing" ; "économique", "social", "bas prix" = "economique" ; null si non dit.
Réponds uniquement en JSON : {"typeOuvrage": null, "niveaux": null, "surfaceM2": null, "surfaceParNiveau": false, "localisation": null, "finition": null}`;

export interface ParametresDevis {
  typeOuvrage: string | null;
  niveaux: number | null;
  surfaceM2: number | null; // surface totale construite
  localisation: string | null;
  finition: 'economique' | 'standard' | 'haut_standing' | null;
}

/** Contrôle la réponse de l'IA ; une surface « par niveau » est multipliée par le nombre de niveaux */
export function normaliserParametresDevis(brut: unknown): ParametresDevis {
  const r = (brut && typeof brut === 'object' ? brut : {}) as Record<string, unknown>;
  const nombre = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v.replace(',', '.')) : NaN);
  const niveaux = Math.round(nombre(r.niveaux));
  const niveauxOk = Number.isFinite(niveaux) && niveaux >= 1 && niveaux <= 60 ? niveaux : null;
  let surface = nombre(r.surfaceM2);
  if (Number.isFinite(surface) && r.surfaceParNiveau === true && niveauxOk) surface *= niveauxOk;
  return {
    typeOuvrage: texte(r.typeOuvrage, 80) || null,
    niveaux: niveauxOk,
    surfaceM2: Number.isFinite(surface) && surface > 0 && surface < 1_000_000 ? Math.round(surface) : null,
    localisation: texte(r.localisation, 80) || null,
    finition: valeurDe(['economique', 'standard', 'haut_standing'], r.finition),
  };
}

export interface RapportPourClient {
  date: string;
  travauxRealises?: string | null;
  resteAFaire?: string | null;
  problemes?: string | null;
  visitesDuJour?: string | null;
  observations?: string | null;
}

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

  /** Message simple pour le client tiré du rapport validé ; null si l'IA ne répond pas (le client verra le rapport complet) */
  async resumerPourClient(rapport: RapportPourClient): Promise<string | null> {
    const contenu = [
      `Date : ${rapport.date}`,
      `Travaux réalisés :\n${rapport.travauxRealises || '—'}`,
      `Reste à faire :\n${rapport.resteAFaire || '—'}`,
      `Difficultés :\n${rapport.problemes || '—'}`,
      `Visites :\n${rapport.visitesDuJour || '—'}`,
      `Observations :\n${rapport.observations || '—'}`,
    ].join('\n\n');
    if (!this.apiKey || !(rapport.travauxRealises || rapport.resteAFaire)) return null;
    try {
      const brut = (await this.demanderJson(PROMPT_RESUME_CLIENT, contenu, 600, 15000)) as { resume?: unknown };
      return texte(brut?.resume, 1500) || null;
    } catch (err) {
      this.logger.warn(`Résumé client impossible : ${(err as Error).message}`);
      return null;
    }
  }

  /** Paramètres d'un projet décrit en une phrase (« villa R+2 de 300 m² à Mbao ») ; les prix ne viennent pas de l'IA */
  async extraireParametresDevis(description: string): Promise<ParametresDevis> {
    try {
      return normaliserParametresDevis(await this.demanderJson(PROMPT_PARAMETRES_DEVIS, description, 300, 15000));
    } catch (err) {
      this.logger.error(`Lecture de la description impossible : ${(err as Error).message}`);
      throw new ServiceUnavailableException("L'IA n'a pas pu lire la description. Réessayez, ou saisissez la surface à la main.");
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
