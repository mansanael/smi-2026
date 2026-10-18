import { resumerChantier } from './dashboard.service';
import { calculerSuivi } from '../paiements/paiements.service';
import { StatutTache } from '../planning/entities/tache.entity';

const tache = (nom: string, statut: string, pourcentageAvancement: number, dateFinPrevue: string | null) =>
  ({ nom, statut: statut as StatutTache, pourcentageAvancement, dateFinPrevue: dateFinPrevue as unknown as Date });

describe('resumerChantier', () => {
  const aujourdhui = '2026-10-17';

  it('calcule l’avancement moyen, les tâches en retard et la prochaine tâche', () => {
    const taches = [
      tache('Fondations', 'terminee', 100, '2026-09-01'),
      tache('Poteaux R+1', 'en_cours', 40, '2026-10-10'), // en retard
      tache('Dalle R+1', 'a_faire', 0, '2026-11-05'),
      tache('Peinture', 'a_faire', 0, null),
    ];
    const r = resumerChantier(taches, calculerSuivi(1000, [], [], aujourdhui), aujourdhui);
    expect(r.avancement).toBe(35);
    expect(r.tachesEnRetard).toBe(1);
    expect(r.prochaineTache).toEqual({ nom: 'Poteaux R+1', dateFinPrevue: '2026-10-10' });
    expect(r.paiementEnRetard).toBeNull();
  });

  it('signale le paiement en retard et la prochaine échéance', () => {
    const echeances = [
      { libelle: 'Signature', montant: 300, dateLimite: '2026-09-01' },
      { libelle: 'Fondations', montant: 200, dateLimite: '2026-09-27' },
      { libelle: 'Dalle', montant: 500, dateLimite: '2026-12-01' },
    ] as any[];
    const paiements = [{ montant: 300, date: '2026-09-01' }] as any[];
    const r = resumerChantier([], calculerSuivi(1000, echeances, paiements, aujourdhui), aujourdhui);
    expect(r.paiementEnRetard).toEqual({ montant: 200, jours: 20 });
    expect(r.prochaineEcheance).toEqual({ libelle: 'Dalle', dateLimite: '2026-12-01', resteDu: 500 });
    expect(r.avancement).toBe(0);
    expect(r.prochaineTache).toBeNull();
  });
});
