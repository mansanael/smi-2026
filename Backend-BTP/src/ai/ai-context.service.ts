import { Injectable } from '@nestjs/common';
import { DashboardService } from '../dashboard/dashboard.service';
import { ProjetsService } from '../projets/projets.service';
import { BudgetService } from '../budget/budget.service';
import { PlanningService } from '../planning/planning.service';
import { SuiviChantierService } from '../suivi-chantier/suivi-chantier.service';
import { FacturationService } from '../facturation/facturation.service';
import { DocumentsService } from '../documents/documents.service';
import { ApprovisionnementsService } from '../approvisionnement/approvisionnements.service';
import { RessourcesService } from '../ressources/ressources.service';
import { UtilisateursService } from '../utilisateurs/utilisateurs.service';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';

interface JwtUser {
  id: string;
  email: string;
  role: RoleUtilisateur;
  nom: string;
  prenom: string;
}

const ROLES_BUDGET = new Set([
  RoleUtilisateur.DIRECTEUR_GENERAL,
  RoleUtilisateur.DIRECTEUR_TECHNIQUE,
  RoleUtilisateur.RESPONSABLE_ADMIN_FIN,
  RoleUtilisateur.CHEF_PROJET,
]);

const ROLES_FACTURATION = new Set([
  RoleUtilisateur.DIRECTEUR_GENERAL,
  RoleUtilisateur.DIRECTEUR_TECHNIQUE,
  RoleUtilisateur.RESPONSABLE_ADMIN_FIN,
]);

const ROLES_RH = new Set([
  RoleUtilisateur.DIRECTEUR_GENERAL,
  RoleUtilisateur.DIRECTEUR_TECHNIQUE,
  RoleUtilisateur.RESPONSABLE_ADMIN_FIN,
  RoleUtilisateur.CHEF_PROJET,
  RoleUtilisateur.CONDUCTEUR_TRAVAUX,
]);

@Injectable()
export class AiContextService {
  private readonly snapshotCache = new Map<string, { data: string; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 60_000; // 60 secondes

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly projetsService: ProjetsService,
    private readonly budgetService: BudgetService,
    private readonly planningService: PlanningService,
    private readonly suiviService: SuiviChantierService,
    private readonly facturationService: FacturationService,
    private readonly documentsService: DocumentsService,
    private readonly approService: ApprovisionnementsService,
    private readonly ressourcesService: RessourcesService,
    private readonly utilisateursService: UtilisateursService,
  ) {}

  getToolDefinitions() {
    return [
      // ─── PORTEFEUILLE ──────────────────────────────────────────────────────
      {
        type: 'function',
        function: {
          name: 'get_portfolio',
          description: 'Vue globale du portefeuille de projets (nombre, statuts, valeur totale, projets actifs).',
          parameters: { type: 'object', properties: {} },
        },
      },

      // ─── PROJET — SYNTHÈSE ─────────────────────────────────────────────────
      {
        type: 'function',
        function: {
          name: 'get_project_summary',
          description: 'KPIs synthétiques d\'un projet : avancement physique, financier, facturation, alertes.',
          parameters: {
            type: 'object',
            properties: {
              projetId: { type: 'string', description: 'UUID du projet' },
            },
            required: ['projetId'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_project_details',
          description: 'Fiche détaillée d\'un projet (référence, maître d\'ouvrage, dates, montant marché, commune, région…).',
          parameters: {
            type: 'object',
            properties: {
              projetId: { type: 'string', description: 'UUID du projet' },
            },
            required: ['projetId'],
          },
        },
      },

      // ─── BUDGET ───────────────────────────────────────────────────────────
      {
        type: 'function',
        function: {
          name: 'get_project_budget',
          description: 'KPIs budgétaires d\'un projet (budget révisé, dépenses réalisées, reste à dépenser, alertes) avec les 10 dernières dépenses.',
          parameters: {
            type: 'object',
            properties: {
              projetId: { type: 'string', description: 'UUID du projet' },
            },
            required: ['projetId'],
          },
        },
      },

      // ─── PLANNING ─────────────────────────────────────────────────────────
      {
        type: 'function',
        function: {
          name: 'get_project_tasks',
          description: 'Liste complète des tâches de planning d\'un projet (avancement %, statut, dates, responsable, lot).',
          parameters: {
            type: 'object',
            properties: {
              projetId: { type: 'string', description: 'UUID du projet' },
            },
            required: ['projetId'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_project_milestones',
          description: 'Jalons de planning d\'un projet (dates prévues, statuts, descriptions). Utile pour les dates clés contractuelles.',
          parameters: {
            type: 'object',
            properties: {
              projetId: { type: 'string', description: 'UUID du projet' },
            },
            required: ['projetId'],
          },
        },
      },

      // ─── SUIVI CHANTIER ───────────────────────────────────────────────────
      {
        type: 'function',
        function: {
          name: 'get_project_journals',
          description: 'Derniers journaux de chantier d\'un projet (météo, travaux réalisés, nombre d\'ouvriers présents).',
          parameters: {
            type: 'object',
            properties: {
              projetId: { type: 'string', description: 'UUID du projet' },
              limit: { type: 'number', description: 'Nombre max de journaux (défaut 5)' },
            },
            required: ['projetId'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_project_incidents',
          description: 'Incidents HSE enregistrés sur un projet (type, gravité, date, description, actions correctives).',
          parameters: {
            type: 'object',
            properties: {
              projetId: { type: 'string', description: 'UUID du projet' },
            },
            required: ['projetId'],
          },
        },
      },

      // ─── FACTURATION ──────────────────────────────────────────────────────
      {
        type: 'function',
        function: {
          name: 'get_project_billing',
          description: 'Récapitulatif facturation et encaissements d\'un projet (situations de travaux, net à payer, statuts de paiement).',
          parameters: {
            type: 'object',
            properties: {
              projetId: { type: 'string', description: 'UUID du projet' },
            },
            required: ['projetId'],
          },
        },
      },

      // ─── APPROVISIONNEMENT / STOCK ────────────────────────────────────────
      {
        type: 'function',
        function: {
          name: 'get_project_stock',
          description: 'Stock matériaux sur le chantier (quantités par matériau) et bons de commande récents.',
          parameters: {
            type: 'object',
            properties: {
              projetId: { type: 'string', description: 'UUID du projet' },
            },
            required: ['projetId'],
          },
        },
      },

      // ─── RESSOURCES HUMAINES ──────────────────────────────────────────────
      {
        type: 'function',
        function: {
          name: 'get_project_resources',
          description: 'Ressources affectées à un projet : personnel (ouvriers, chefs d\'équipe), engins mobilisés, sous-traitants. Répond aux questions "combien d\'ouvriers", "quels engins", "quel sous-traitant".',
          parameters: {
            type: 'object',
            properties: {
              projetId: { type: 'string', description: 'UUID du projet' },
            },
            required: ['projetId'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_project_payroll',
          description: 'Masse salariale et coût RH d\'un projet : total FCFA des pointages, nombre de jours travaillés. Utile pour analyser les coûts de main-d\'œuvre.',
          parameters: {
            type: 'object',
            properties: {
              projetId: { type: 'string', description: 'UUID du projet' },
            },
            required: ['projetId'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_all_personnel',
          description: 'Registre complet du personnel actif de l\'entreprise (tous projets confondus) : nom, poste, qualification, taux journalier. Utile pour "qui travaille chez nous", "liste des ouvriers".',
          parameters: { type: 'object', properties: {} },
        },
      },

      // ─── DOCUMENTS ────────────────────────────────────────────────────────
      {
        type: 'function',
        function: {
          name: 'get_expiring_documents',
          description: 'Documents expirant sous 30 jours (tous projets confondus) : assurances, agréments, permis.',
          parameters: { type: 'object', properties: {} },
        },
      },

      // ─── UTILISATEURS / ÉQUIPE APP ────────────────────────────────────────
      {
        type: 'function',
        function: {
          name: 'get_users_list',
          description: 'Liste des utilisateurs de l\'application BATIPME (équipe de gestion) : noms, rôles, postes. Répond aux questions "qui a accès à l\'application", "qui est le directeur technique".',
          parameters: { type: 'object', properties: {} },
        },
      },
    ];
  }

  invalidateCache(userId: string, projetId?: string): void {
    const key = `${userId}_${projetId || 'global'}`;
    this.snapshotCache.delete(key);
  }

  async buildSnapshot(user: JwtUser, projetId?: string): Promise<string> {
    const cacheKey = `${user.id}_${projetId || 'global'}`;
    const cached = this.snapshotCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const portfolio = await this.dashboardService.getDashboardGlobal();
    const snapshot: Record<string, unknown> = {
      utilisateur: {
        nom: `${user.prenom} ${user.nom}`.trim(),
        role: user.role,
        email: user.email,
      },
      portefeuille: {
        nombreProjetsTotal: portfolio.nombreProjetsTotal,
        nombreProjetsActifs: portfolio.nombreProjetsActifs,
        valeurPortefeuilleFCFA: portfolio.valeurPortefeuilleFCFA,
        repartitionParStatut: portfolio.repartitionParStatut,
        // Limiter à 5 projets pour réduire les tokens
        projetsActifs: (portfolio.projetsActifs || []).slice(0, 5).map((p: Record<string, unknown>) => ({
          id: p.id,
          reference: p.reference,
          intitule: p.intitule,
          statut: p.statut,
          montantMarche: p.montantMarche,
        })),
      },
    };

    if (projetId) {
      const [projet, dashboardProjet] = await Promise.all([
        this.projetsService.findOne(projetId).catch(() => null),
        this.dashboardService.getDashboardProjet(projetId),
      ]);

      if (projet && dashboardProjet) {
        snapshot.projetSelectionne = {
          id: projet.id,
          reference: projet.reference,
          intitule: projet.intitule,
          statut: projet.statut,
          region: projet.region,
          commune: projet.commune,
          montantMarche: projet.montantMarche,
          maitreOuvrage: projet.maitreOuvrage,
          maitreOeuvre: projet.maitreOeuvre,
          dateDemarrage: projet.dateDemarrage,
          dureeContractuelleJours: projet.dureeContractuelleJours,
          kpis: dashboardProjet,
        };

        // Charger toutes les données du projet en parallèle
        const [taches, jalons, journaux, incidents, personnel, engins, sousTraitants] = await Promise.all([
          this.planningService.findTachesProjet(projetId),
          this.planningService.findJalonsProjet(projetId).catch(() => []),
          this.suiviService.getJournaux(projetId),
          this.suiviService.getIncidents(projetId),
          this.ressourcesService.getPersonnelProjet(projetId).catch(() => []),
          this.ressourcesService.getEnginsProjet(projetId).catch(() => []),
          this.ressourcesService.getSousTraitantsProjet(projetId).catch(() => []),
        ]);

        (snapshot.projetSelectionne as Record<string, unknown>).tachesRecentes = taches.slice(0, 5).map(t => ({
          nom: t.nom,
          statut: t.statut,
          avancement: t.pourcentageAvancement,
          dateFinPrevue: t.dateFinPrevue,
        }));

        (snapshot.projetSelectionne as Record<string, unknown>).jalons = jalons.map(j => ({
          nom: j.nom,
          datePrevu: j.datePrevu,
          atteint: j.atteint,
          dateReel: j.dateReel,
          description: j.description,
          type: j.type,
        }));

        (snapshot.projetSelectionne as Record<string, unknown>).derniersJournaux = journaux.slice(0, 2).map(j => ({
          date: j.date,
          meteo: j.meteo,
          nombreOuvriers: j.nombreOuvriers,
          travauxRealises: j.travauxRealises ? String(j.travauxRealises).slice(0, 200) : null,
        }));

        (snapshot.projetSelectionne as Record<string, unknown>).incidentsRecents = incidents.slice(0, 3).map(i => ({
          date: i.date,
          type: i.type,
          gravite: i.gravite,
          description: String(i.description || '').slice(0, 150),
        }));

        (snapshot.projetSelectionne as Record<string, unknown>).ressourcesHumaines = {
          nombrePersonnelAffecte: personnel.length,
          nombreEnginsAffectes: engins.length,
          nombreSousTraitants: sousTraitants.length,
          personnel: personnel.slice(0, 10).map(p => ({
            nom: `${p.prenom} ${p.nom}`.trim(),
            poste: p.poste,
            categorie: p.categorie,
          })),
        };

        if (ROLES_BUDGET.has(user.role)) {
          const budget = await this.budgetService.getKpiBudget(projetId, Number(projet.montantMarche));
          (snapshot.projetSelectionne as Record<string, unknown>).budget = budget;
        }
      }
    }

    // Sérialiser sans indentation pour économiser des tokens
    const result = JSON.stringify(snapshot);
    this.snapshotCache.set(cacheKey, { data: result, expiresAt: Date.now() + this.CACHE_TTL_MS });
    return result;
  }

  async executeTool(name: string, args: Record<string, unknown>, user: JwtUser): Promise<string> {
    try {
      switch (name) {

        // ─── PORTEFEUILLE ────────────────────────────────────────────────────
        case 'get_portfolio':
          return JSON.stringify(await this.dashboardService.getDashboardGlobal());

        // ─── PROJET — SYNTHÈSE ───────────────────────────────────────────────
        case 'get_project_summary': {
          const projetId = String(args.projetId);
          const data = await this.dashboardService.getDashboardProjet(projetId);
          return data ? JSON.stringify(data) : JSON.stringify({ error: 'Projet introuvable' });
        }

        case 'get_project_details': {
          const projet = await this.projetsService.findOne(String(args.projetId));
          return JSON.stringify({
            id: projet.id,
            reference: projet.reference,
            intitule: projet.intitule,
            description: projet.description,
            typeMarche: projet.typeMarche,
            typeProjet: projet.typeProjet,
            region: projet.region,
            commune: projet.commune,
            maitreOuvrage: projet.maitreOuvrage,
            maitreOeuvre: projet.maitreOeuvre,
            montantMarche: projet.montantMarche,
            statut: projet.statut,
            dateNotification: projet.dateNotification,
            dateDemarrage: projet.dateDemarrage,
            dureeContractuelleJours: projet.dureeContractuelleJours,
          });
        }

        // ─── BUDGET ─────────────────────────────────────────────────────────
        case 'get_project_budget': {
          if (!ROLES_BUDGET.has(user.role)) {
            return JSON.stringify({ error: 'Accès budget non autorisé pour votre rôle.' });
          }
          const projetId = String(args.projetId);
          const projet = await this.projetsService.findOne(projetId);
          const budget = await this.budgetService.getKpiBudget(projetId, Number(projet.montantMarche));
          const depenses = await this.budgetService.getDepenses(projetId);
          return JSON.stringify({
            kpis: budget,
            dernieresDepenses: depenses.slice(0, 10).map(d => ({
              libelle: d.libelle,
              montant: d.montant,
              type: d.type,
              categorie: d.categorie,
              date: d.date,
            })),
          });
        }

        // ─── PLANNING — TÂCHES ───────────────────────────────────────────────
        case 'get_project_tasks': {
          const taches = await this.planningService.findTachesProjet(String(args.projetId));
          return JSON.stringify(taches.map(t => ({
            nom: t.nom,
            lot: t.lot,
            statut: t.statut,
            avancement: t.pourcentageAvancement,
            dateDebutPrevue: t.dateDebutPrevue,
            dateFinPrevue: t.dateFinPrevue,
            responsable: t.responsable,
          })));
        }

        // ─── PLANNING — JALONS ───────────────────────────────────────────────
        case 'get_project_milestones': {
          const jalons = await this.planningService.findJalonsProjet(String(args.projetId));
          return JSON.stringify(jalons.map(j => ({
            nom: j.nom,
            datePrevu: j.datePrevu,
            atteint: j.atteint,
            dateReel: j.dateReel,
            description: j.description,
            type: j.type,
          })));
        }

        // ─── SUIVI CHANTIER ──────────────────────────────────────────────────
        case 'get_project_journals': {
          const limit = Number(args.limit) || 5;
          const journaux = await this.suiviService.getJournaux(String(args.projetId));
          return JSON.stringify(journaux.slice(0, limit));
        }

        case 'get_project_incidents': {
          const incidents = await this.suiviService.getIncidents(String(args.projetId));
          return JSON.stringify(incidents);
        }

        // ─── FACTURATION ─────────────────────────────────────────────────────
        case 'get_project_billing': {
          if (!ROLES_FACTURATION.has(user.role)) {
            return JSON.stringify({ error: 'Accès facturation non autorisé pour votre rôle.' });
          }
          const projetId = String(args.projetId);
          const recap = await this.facturationService.getRecapitulatif(projetId);
          const situations = await this.facturationService.getSituations(projetId);
          return JSON.stringify({
            recapitulatif: recap,
            situations: situations.map(s => ({
              numero: s.numero,
              statut: s.statut,
              netAPayer: s.netAPayer,
              avancementPhysique: s.pourcentageAvancement,
            })),
          });
        }

        // ─── APPROVISIONNEMENT / STOCK ────────────────────────────────────────
        case 'get_project_stock': {
          const stock = await this.approService.getStockChantier(String(args.projetId));
          const bons = await this.approService.getBonsCommande(String(args.projetId));
          return JSON.stringify({
            stock,
            bonsCommandeRecents: bons.slice(0, 5).map(b => ({
              id: b.id,
              montantTotal: b.montantTotal,
              statut: b.statut,
              fournisseur: b.fournisseur?.nom,
            })),
          });
        }

        // ─── RESSOURCES HUMAINES ─────────────────────────────────────────────
        case 'get_project_resources': {
          if (!ROLES_RH.has(user.role)) {
            return JSON.stringify({ error: 'Accès ressources non autorisé pour votre rôle.' });
          }
          const projetId = String(args.projetId);
          const [personnel, engins, sousTraitants, pointages] = await Promise.all([
            this.ressourcesService.getPersonnelProjet(projetId),
            this.ressourcesService.getEnginsProjet(projetId),
            this.ressourcesService.getSousTraitantsProjet(projetId),
            this.ressourcesService.getPointagesProjet(projetId),
          ]);

          return JSON.stringify({
            personnel: personnel.map(p => ({
              nom: `${p.prenom} ${p.nom}`.trim(),
              poste: p.poste,
              categorie: p.categorie,
              tauxJournalier: p.tauxJournalier,
              telephone: p.telephone,
            })),
            nombrePersonnel: personnel.length,
            engins: engins.map(e => ({
              dateDebut: e.dateDebut,
              dateFin: e.dateFin,
              observations: e.observations,
            })),
            nombreEngins: engins.length,
            sousTraitants: sousTraitants.map(st => ({
              dateDebut: st.dateDebut,
              dateFin: st.dateFin,
              montantContrat: st.montantContrat,
              observations: st.observations,
            })),
            nombreSousTraitants: sousTraitants.length,
            nombrePointagesTotal: pointages.length,
          });
        }

        case 'get_project_payroll': {
          if (!ROLES_RH.has(user.role)) {
            return JSON.stringify({ error: 'Accès masse salariale non autorisé pour votre rôle.' });
          }
          const projetId = String(args.projetId);
          const pointages = await this.ressourcesService.getPointagesProjet(projetId);
          const totalFCFA = pointages.reduce((s, p) => s + Number(p.montantJournalier || 0), 0);
          const today = new Date().toISOString().split('T')[0];
          const debut = pointages.length > 0
            ? [...pointages].sort((a, b) => String(a.date).localeCompare(String(b.date)))[0].date
            : today;
          return JSON.stringify({
            projetId,
            totalMasseSalarialeFCFA: Math.round(totalFCFA),
            nombreJoursPointages: pointages.length,
            periodeDebut: debut,
            periodeFin: today,
            detailParPersonnel: pointages
              .reduce((acc: Record<string, { nom: string; totalFCFA: number; joursPointes: number }>, pt) => {
                const id = pt.personnel?.id || 'inconnu';
                if (!acc[id]) {
                  acc[id] = {
                    nom: pt.personnel ? `${pt.personnel.prenom} ${pt.personnel.nom}`.trim() : 'Inconnu',
                    totalFCFA: 0,
                    joursPointes: 0,
                  };
                }
                acc[id].totalFCFA += Number(pt.montantJournalier || 0);
                acc[id].joursPointes += 1;
                return acc;
              }, {}),
          });
        }

        case 'get_all_personnel': {
          if (!ROLES_RH.has(user.role)) {
            return JSON.stringify({ error: 'Accès personnel non autorisé pour votre rôle.' });
          }
          const personnel = await this.ressourcesService.findAllPersonnel();
          return JSON.stringify(personnel.map(p => ({
            id: p.id,
            nom: `${p.prenom} ${p.nom}`.trim(),
            poste: p.poste,
            categorie: p.categorie,
            tauxJournalier: p.tauxJournalier,
            telephone: p.telephone,
            actif: p.actif,
          })));
        }

        // ─── DOCUMENTS ───────────────────────────────────────────────────────
        case 'get_expiring_documents': {
          const docs = await this.documentsService.findExpiring();
          return JSON.stringify(docs.map(d => ({
            nom: d.nom,
            type: d.type,
            dateExpiration: d.dateExpiration,
          })));
        }

        // ─── UTILISATEURS APP ────────────────────────────────────────────────
        case 'get_users_list': {
          if (user.role !== RoleUtilisateur.DIRECTEUR_GENERAL && user.role !== RoleUtilisateur.RESPONSABLE_ADMIN_FIN) {
            return JSON.stringify({ error: 'Accès à la liste des utilisateurs réservé aux directeurs et responsables.' });
          }
          const utilisateurs = await this.utilisateursService.findAll();
          return JSON.stringify(utilisateurs.map(u => ({
            nom: `${u.prenom} ${u.nom}`.trim(),
            email: u.email,
            role: u.role,
            poste: u.poste,
            actif: u.actif,
          })));
        }

        default:
          return JSON.stringify({ error: `Outil inconnu : ${name}` });
      }
    } catch (err) {
      return JSON.stringify({ error: err?.message || 'Erreur lors de la récupération des données.' });
    }
  }
}
