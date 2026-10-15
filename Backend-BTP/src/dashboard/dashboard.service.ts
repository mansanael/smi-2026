import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Projet, StatutProjet } from '../projets/entities/projet.entity';
import { Tache } from '../planning/entities/tache.entity';
import { Depense, TypeDepense } from '../budget/entities/depense.entity';
import { Incident } from '../suivi-chantier/entities/incident.entity';
import { SituationTravaux } from '../facturation/entities/situation-travaux.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Projet) private projetRepo: Repository<Projet>,
    @InjectRepository(Tache) private tacheRepo: Repository<Tache>,
    @InjectRepository(Depense) private depenseRepo: Repository<Depense>,
    @InjectRepository(Incident) private incidentRepo: Repository<Incident>,
    @InjectRepository(SituationTravaux) private situationRepo: Repository<SituationTravaux>,
  ) {}

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
    };
  }
}
