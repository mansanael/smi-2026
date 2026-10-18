import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Projet, StatutProjet } from '../projets/entities/projet.entity';
import { Tache } from '../planning/entities/tache.entity';
import { Depense, TypeDepense } from '../budget/entities/depense.entity';
import { Incident } from '../suivi-chantier/entities/incident.entity';
import { SituationTravaux } from '../facturation/entities/situation-travaux.entity';
import { Echeance } from '../paiements/entities/echeance.entity';
import { Paiement } from '../paiements/entities/paiement.entity';
import { calculerSuivi } from '../paiements/paiements.service';

const jourDe = (d: Date | string | null) => (d ? String(d instanceof Date ? d.toISOString() : d).slice(0, 10) : null);

/**
 * Résumé d'un chantier pour la liste : avancement, retards et prochaine chose à faire.
 * Fonction pure (testée) ; aujourdhui au format AAAA-MM-JJ.
 */
export function resumerChantier(
  taches: Pick<Tache, 'nom' | 'statut' | 'pourcentageAvancement' | 'dateFinPrevue'>[],
  suivi: ReturnType<typeof calculerSuivi>,
  aujourdhui: string,
) {
  const avancement = taches.length > 0
    ? Math.round(taches.reduce((s, t) => s + Number(t.pourcentageAvancement || 0), 0) / taches.length)
    : 0;
  const nonTerminees = taches.filter((t) => t.statut !== 'terminee' && Number(t.pourcentageAvancement) < 100);
  const tachesEnRetard = nonTerminees.filter((t) => {
    const fin = jourDe(t.dateFinPrevue);
    return fin !== null && fin < aujourdhui;
  }).length;
  // Prochaine tâche : celle qui doit finir le plus tôt (les tâches sans date passent après)
  const prochaine = [...nonTerminees].sort((a, b) =>
    (jourDe(a.dateFinPrevue) ?? '9999').localeCompare(jourDe(b.dateFinPrevue) ?? '9999'))[0];

  const enRetard = suivi.echeances.filter((e) => e.statut === 'en_retard');
  const aVenir = suivi.echeances.find((e) => e.statut === 'a_venir' || e.statut === 'partielle');

  return {
    avancement,
    nombreTaches: taches.length,
    tachesEnRetard,
    prochaineTache: prochaine ? { nom: prochaine.nom, dateFinPrevue: jourDe(prochaine.dateFinPrevue) } : null,
    paiementEnRetard: enRetard.length > 0
      ? { montant: suivi.montantEnRetard, jours: Math.max(...enRetard.map((e) => e.joursRetard)) }
      : null,
    prochaineEcheance: aVenir ? { libelle: aVenir.libelle, dateLimite: aVenir.dateLimite, resteDu: aVenir.resteDu } : null,
  };
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Projet) private projetRepo: Repository<Projet>,
    @InjectRepository(Tache) private tacheRepo: Repository<Tache>,
    @InjectRepository(Depense) private depenseRepo: Repository<Depense>,
    @InjectRepository(Incident) private incidentRepo: Repository<Incident>,
    @InjectRepository(SituationTravaux) private situationRepo: Repository<SituationTravaux>,
    @InjectRepository(Echeance) private echeanceRepo: Repository<Echeance>,
    @InjectRepository(Paiement) private paiementRepo: Repository<Paiement>,
  ) {}

  // ─── APERÇU DE CHAQUE CHANTIER (liste des chantiers) ──────────────────────
  // projetIds : projets accessibles à l'utilisateur, null = tous les projets
  async apercuChantiers(projetIds: string[] | null = null) {
    const projets =
      projetIds === null ? await this.projetRepo.find()
        : projetIds.length === 0 ? []
          : await this.projetRepo.find({ where: { id: In(projetIds) } });
    if (projets.length === 0) return {};
    const ids = projets.map((p) => p.id);
    const [taches, echeances, paiements] = await Promise.all([
      this.tacheRepo.find({ where: { projet: { id: In(ids) } }, relations: { projet: true } }),
      this.echeanceRepo.find({ where: { projet: { id: In(ids) } }, relations: { projet: true } }),
      this.paiementRepo.find({ where: { projet: { id: In(ids) } }, relations: { projet: true } }),
    ]);
    const duProjet = <T extends { projet: Projet }>(liste: T[], id: string) => liste.filter((x) => x.projet?.id === id);
    const aujourdhui = new Date().toISOString().slice(0, 10); // Sénégal : UTC+0

    return Object.fromEntries(projets.map((p) => [
      p.id,
      resumerChantier(
        duProjet(taches, p.id),
        calculerSuivi(Number(p.montantMarche), duProjet(echeances, p.id), duProjet(paiements, p.id), aujourdhui),
        aujourdhui,
      ),
    ]));
  }

  // ─── TABLEAU DE BORD GLOBAL (CDC §11.1) ───────────────────────────────────
  // projetIds : projets accessibles à l'utilisateur, null = tous les projets
  async getDashboardGlobal(projetIds: string[] | null = null) {
    const projets =
      projetIds === null ? await this.projetRepo.find()
        : projetIds.length === 0 ? []
          : await this.projetRepo.find({ where: { id: In(projetIds) } });
    const projetsActifs = projets.filter(p => p.statut === StatutProjet.EN_COURS || p.statut === StatutProjet.EN_PREPARATION);
    const valeurTotale = projets.reduce((s, p) => s + Number(p.montantMarche || 0), 0);
    const repartitionStatut: Record<string, number> = {};
    projets.forEach(p => { repartitionStatut[p.statut] = (repartitionStatut[p.statut] || 0) + 1; });

    return {
      nombreProjetsTotal: projets.length,
      nombreProjetsActifs: projetsActifs.length,
      valeurPortefeuilleFCFA: valeurTotale,
      repartitionParStatut: repartitionStatut,
      projetsActifs: projetsActifs.map(p => ({
        id: p.id, reference: p.reference, intitule: p.intitule,
        region: p.region, statut: p.statut, montantMarche: p.montantMarche,
      })),
    };
  }

  // ─── KPIs PAR PROJET ──────────────────────────────────────────────────────
  async getDashboardProjet(projetId: string) {
    const projet = await this.projetRepo.findOneBy({ id: projetId });
    if (!projet) return null;

    const taches = await this.tacheRepo.find({ where: { projet: { id: projetId } } });
    const depenses = await this.depenseRepo.find({ where: { projet: { id: projetId } } });
    const incidents = await this.incidentRepo.find({ where: { projet: { id: projetId } } });
    const situations = await this.situationRepo.find({ where: { projet: { id: projetId } } });
    const [echeances, paiements] = await Promise.all([
      this.echeanceRepo.find({ where: { projet: { id: projetId } } }),
      this.paiementRepo.find({ where: { projet: { id: projetId } } }),
    ]);
    const aujourdhui = new Date().toISOString().slice(0, 10);
    const aSuivre = resumerChantier(
      taches, calculerSuivi(Number(projet.montantMarche), echeances, paiements, aujourdhui), aujourdhui,
    );

    // Avancement physique moyen pondéré
    const avancementPhysique = taches.length > 0
      ? taches.reduce((s, t) => s + Number(t.pourcentageAvancement), 0) / taches.length
      : 0;

    // Dépenses
    const depensesRealisees = depenses
      .filter(d => d.type === TypeDepense.REALISATION)
      .reduce((s, d) => s + Number(d.montant), 0);
    const montantMarche = Number(projet.montantMarche);
    const avancementFinancier = montantMarche > 0 ? (depensesRealisees / montantMarche) * 100 : 0;

    // Encaissements
    const totalEncaisse = situations
      .filter(s => s.statut === 'payee')
      .reduce((s, sit) => s + Number(sit.netAPayer), 0);

    // Alertes
    const alertes: string[] = [];
    if (avancementFinancier > avancementPhysique + 10) alertes.push('⚠️ Dépenses en avance sur l\'avancement physique');
    if (depensesRealisees > montantMarche) alertes.push('🔴 Dépassement budgétaire détecté');
    if (incidents.filter(i => i.gravite === 'grave' || i.gravite === 'critique').length > 0) alertes.push('🔴 Incidents graves en cours');

    return {
      projet: { id: projet.id, reference: projet.reference, intitule: projet.intitule, statut: projet.statut },
      avancement: {
        physique: Math.round(avancementPhysique * 100) / 100,
        financier: Math.round(avancementFinancier * 100) / 100,
        nombreTaches: taches.length,
        tachesTerminees: taches.filter(t => t.statut === 'terminee').length,
      },
      budget: {
        montantMarche, depensesRealisees,
        resteADepenser: montantMarche - depensesRealisees,
        tauxConsommation: Math.round(avancementFinancier * 100) / 100,
      },
      facturation: {
        nombreSituations: situations.length,
        totalEncaisse,
      },
      hse: { nombreIncidents: incidents.length },
      alertes,
      // Prochaine étape, retards et paiements : bloc « En ce moment sur le chantier »
      aSuivre,
    };
  }
}
