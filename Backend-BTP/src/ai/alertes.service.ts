import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Alerte, GraviteAlerte, TypeAlerte } from './alerte.entity';
import { DashboardService } from '../dashboard/dashboard.service';
import { ProjetsService } from '../projets/projets.service';
import { PlanningService } from '../planning/planning.service';
import { DocumentsService } from '../documents/documents.service';
import { SuiviChantierService } from '../suivi-chantier/suivi-chantier.service';
import { GraviteIncident } from '../suivi-chantier/entities/incident.entity';
import { BudgetService } from '../budget/budget.service';
import { PaiementsService } from '../paiements/paiements.service';
import { ParametresService } from '../parametres/parametres.service';

@Injectable()
export class AlertesService {
  private readonly logger = new Logger(AlertesService.name);

  constructor(
    @InjectRepository(Alerte)
    private readonly alerteRepo: Repository<Alerte>,
    private readonly dashboardService: DashboardService,
    private readonly projetsService: ProjetsService,
    private readonly planningService: PlanningService,
    private readonly documentsService: DocumentsService,
    private readonly suiviService: SuiviChantierService,
    private readonly budgetService: BudgetService,
    private readonly paiementsService: PaiementsService,
    private readonly parametres: ParametresService,
  ) {}

  // ─── Cron : analyse chaque matin à 7h ─────────────────────────────────────
  // Sur Render gratuit, le serveur dort à 7 h : un service de réveil appelle aussi /api/cron/alertes.
  // Les deux peuvent coexister : l'analyse n'a lieu qu'une fois par jour.
  @Cron('0 7 * * *')
  async analyseDuMatin(): Promise<void> {
    await this.analyserUneFoisParJour();
  }

  async analyserUneFoisParJour(): Promise<{ lancee: boolean }> {
    if (!(await this.parametres.reserverAnalyseDuJour())) {
      this.logger.log('Analyse des alertes déjà faite aujourd’hui.');
      return { lancee: false };
    }
    await this.analyserEtGenererAlertes();
    return { lancee: true };
  }

  async analyserEtGenererAlertes(): Promise<void> {
    this.logger.log('🔔 Analyse proactive des alertes BATIPME...');
    try {
      // Supprimer les anciennes alertes non lues de plus de 7 jours
      await this.alerteRepo
        .createQueryBuilder()
        .delete()
        .where('creeLe < :date', { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) })
        .execute();

      const portfolio = await this.dashboardService.getDashboardGlobal();
      const alertesACreer: Partial<Alerte>[] = [];

      // ── Documents expirant dans < 15 jours ──────────────────────────────
      const docs = await this.documentsService.findExpiring();
      const docsUrgents = docs.filter(d => {
        if (!d.dateExpiration) return false;
        const daysLeft = Math.ceil((new Date(d.dateExpiration).getTime() - Date.now()) / 86400000);
        return daysLeft <= 15;
      });

      if (docsUrgents.length > 0) {
        alertesACreer.push({
          type: TypeAlerte.DOCUMENT_EXPIRE,
          gravite: GraviteAlerte.DANGER,
          message: `📄 ${docsUrgents.length} document(s) expirent dans moins de 15 jours : ${docsUrgents.map(d => d.nom).join(', ')}.`,
        });
      }

      // ── Analyse par projet ───────────────────────────────────────────────
      for (const p of portfolio.projetsActifs) {
        const [dashboard, taches, incidents, paiements] = await Promise.all([
          this.dashboardService.getDashboardProjet(p.id),
          this.planningService.findTachesProjet(p.id),
          this.suiviService.getIncidents(p.id),
          this.paiementsService.getSuivi(p.id),
        ]);

        if (!dashboard) continue;

        const ref = p.reference;

        // Budget dépassé
        if (dashboard.budget.resteADepenser < 0) {
          alertesACreer.push({
            type: TypeAlerte.BUDGET_DEPASSE,
            gravite: GraviteAlerte.DANGER,
            projetId: p.id,
            projetReference: ref,
            message: `🔴 [${ref}] Dépassement budgétaire détecté : dépenses supérieures au montant marché de ${Math.abs(dashboard.budget.resteADepenser).toLocaleString('fr-FR')} FCFA.`,
          });
        } else if (dashboard.budget.tauxConsommation > 90) {
          alertesACreer.push({
            type: TypeAlerte.BUDGET_DEPASSE,
            gravite: GraviteAlerte.WARNING,
            projetId: p.id,
            projetReference: ref,
            message: `⚠️ [${ref}] Budget à ${Math.round(dashboard.budget.tauxConsommation)}% — moins de 10% restant. Surveiller les dépenses.`,
          });
        }

        // Tâches en retard
        const aujourd = new Date();
        const tachesEnRetard = taches.filter(t =>
          t.statut !== 'terminee' &&
          t.dateFinPrevue &&
          new Date(t.dateFinPrevue) < aujourd,
        );
        if (tachesEnRetard.length > 0) {
          alertesACreer.push({
            type: TypeAlerte.TACHE_EN_RETARD,
            gravite: tachesEnRetard.length >= 3 ? GraviteAlerte.DANGER : GraviteAlerte.WARNING,
            projetId: p.id,
            projetReference: ref,
            message: `⏰ [${ref}] ${tachesEnRetard.length} tâche(s) en retard : ${tachesEnRetard.slice(0, 3).map(t => t.nom).join(', ')}${tachesEnRetard.length > 3 ? '...' : ''}.`,
          });
        }

        // Avancement physique faible vs financier
        if (
          dashboard.avancement.financier > dashboard.avancement.physique + 15 &&
          dashboard.avancement.physique > 0
        ) {
          alertesACreer.push({
            type: TypeAlerte.AVANCEMENT_FAIBLE,
            gravite: GraviteAlerte.WARNING,
            projetId: p.id,
            projetReference: ref,
            message: `📊 [${ref}] Déséquilibre : avancement financier (${Math.round(dashboard.avancement.financier)}%) dépasse l'avancement physique (${Math.round(dashboard.avancement.physique)}%) de plus de 15 points.`,
          });
        }

        // Échéances de paiement du client dépassées (impact direct sur la trésorerie)
        if (paiements.nombreEcheancesEnRetard > 0) {
          const plusAncienne = paiements.echeances.find(e => e.statut === 'en_retard');
          alertesACreer.push({
            type: TypeAlerte.PAIEMENT_EN_RETARD,
            gravite: GraviteAlerte.DANGER,
            projetId: p.id,
            projetReference: ref,
            message: `💰 [${ref}] ${paiements.nombreEcheancesEnRetard} échéance(s) client impayée(s) : ${paiements.montantEnRetard.toLocaleString('fr-FR')} FCFA en retard${plusAncienne ? ` (« ${plusAncienne.libelle} », ${plusAncienne.joursRetard} j de retard)` : ''}.`,
          });
        }

        // Incidents HSE graves non déclarés à la CSS
        const incidentsGraves = incidents.filter(i =>
          (i.gravite === GraviteIncident.GRAVE || i.gravite === GraviteIncident.CRITIQUE) && !i.declareCss,
        );
        if (incidentsGraves.length > 0) {
          alertesACreer.push({
            type: TypeAlerte.INCIDENT_HSE,
            gravite: GraviteAlerte.DANGER,
            projetId: p.id,
            projetReference: ref,
            message: `🔴 [${ref}] ${incidentsGraves.length} incident(s) HSE grave(s) non clôturé(s). Action immédiate requise.`,
          });
        }
      }

      // Sauvegarder toutes les alertes en BDD
      if (alertesACreer.length > 0) {
        await this.alerteRepo.save(alertesACreer.map(a => this.alerteRepo.create(a)));
        this.logger.log(`✅ ${alertesACreer.length} alertes générées.`);
      } else {
        this.logger.log('✅ Aucune alerte détectée. Tout est OK.');
      }
    } catch (err) {
      this.logger.error('Erreur lors de l\'analyse des alertes:', err);
    }
  }

  // ─── API : récupérer les alertes ──────────────────────────────────────────
  // projetIds : projets accessibles à l'utilisateur, null = toutes les alertes
  // (les alertes sans projet, comme les documents, ne sont visibles qu'avec null)
  private filtre(projetIds: string[] | null, lu?: boolean): FindOptionsWhere<Alerte> {
    return {
      ...(lu !== undefined ? { lu } : {}),
      ...(projetIds !== null ? { projetId: In(projetIds) } : {}),
    };
  }

  async getAlertes(projetIds: string[] | null, lu?: boolean): Promise<Alerte[]> {
    if (projetIds?.length === 0) return [];
    return this.alerteRepo.find({
      where: this.filtre(projetIds, lu),
      order: { creeLe: 'DESC' },
      take: 50,
    });
  }

  async getNombreNonLues(projetIds: string[] | null): Promise<number> {
    if (projetIds?.length === 0) return 0;
    return this.alerteRepo.count({ where: this.filtre(projetIds, false) });
  }

  async marquerCommeLu(id: string, projetIds: string[] | null): Promise<void> {
    if (projetIds?.length === 0) return;
    await this.alerteRepo.update({ id, ...this.filtre(projetIds) }, { lu: true });
  }

  async marquerToutCommeLu(projetIds: string[] | null): Promise<void> {
    if (projetIds?.length === 0) return;
    await this.alerteRepo.update(this.filtre(projetIds, false), { lu: true });
  }

  async toutEffacer(): Promise<void> {
    await this.alerteRepo.clear();
  }

  // Déclencher manuellement (pour tester sans attendre 7h)
  async analyserMaintenant(): Promise<{ alertesCreees: number }> {
    await this.analyserEtGenererAlertes();
    const count = await this.alerteRepo.count();
    return { alertesCreees: count };
  }
}
