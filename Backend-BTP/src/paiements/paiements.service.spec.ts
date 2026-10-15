import { calculerSuivi } from './paiements.service';

// Exemple du retour reçu : chantier de 10 M FCFA, échéancier 30 / 40 / 30 %
const echeances = [
  { id: 'e3', libelle: 'Livraison', montant: '3000000.00', dateLimite: '2026-12-15' },
  { id: 'e1', libelle: 'Signature', montant: '3000000.00', dateLimite: '2026-09-01' },
  { id: 'e2', libelle: 'Gros œuvre', montant: '4000000.00', dateLimite: '2026-10-01' },
] as any[];
const versement = (date: string, montant: number) => ({ id: date, date, montant: String(montant) }) as any;
const AUJOURDHUI = '2026-10-15';

describe('calculerSuivi', () => {
  it('sans versement : tout reste à payer, les échéances passées sont en retard', () => {
    const s = calculerSuivi(10_000_000, echeances, [], AUJOURDHUI);
    expect(s.totalRecu).toBe(0);
    expect(s.resteAPayer).toBe(10_000_000);
    expect(s.echeances.map(e => e.statut)).toEqual(['en_retard', 'en_retard', 'a_venir']);
    expect(s.montantEnRetard).toBe(7_000_000);
    expect(s.nombreEcheancesEnRetard).toBe(2);
  });

  it('trie les échéances par date limite', () => {
    const s = calculerSuivi(10_000_000, echeances, [], AUJOURDHUI);
    expect(s.echeances.map(e => e.libelle)).toEqual(['Signature', 'Gros œuvre', 'Livraison']);
  });

  it('le client verse 2 M : la première échéance est partiellement réglée', () => {
    const s = calculerSuivi(10_000_000, echeances, [versement('2026-09-01', 2_000_000)], AUJOURDHUI);
    const [signature, grosOeuvre] = s.echeances;
    expect(signature.montantRegle).toBe(2_000_000);
    expect(signature.resteDu).toBe(1_000_000);
    expect(signature.statut).toBe('en_retard'); // échue et pas entièrement payée
    expect(grosOeuvre.montantRegle).toBe(0);
    expect(s.resteAPayer).toBe(8_000_000);
    expect(s.tauxEncaissement).toBe(20);
  });

  it('les versements couvrent les échéances dans l’ordre', () => {
    const s = calculerSuivi(10_000_000, echeances, [versement('2026-09-01', 3_000_000), versement('2026-10-10', 5_000_000)], AUJOURDHUI);
    expect(s.echeances.map(e => e.statut)).toEqual(['payee', 'payee', 'partielle']);
    expect(s.echeances[2].montantRegle).toBe(1_000_000);
    expect(s.nombreEcheancesEnRetard).toBe(0);
  });

  it('calcule les jours de retard', () => {
    const s = calculerSuivi(10_000_000, echeances, [], AUJOURDHUI);
    expect(s.echeances[0].joursRetard).toBe(44); // du 1er septembre au 15 octobre
    expect(s.echeances[2].joursRetard).toBe(0);
  });

  it('une échéance qui tombe aujourd’hui n’est pas encore en retard', () => {
    const s = calculerSuivi(1000, [{ id: 'x', libelle: 'Aujourd’hui', montant: '1000', dateLimite: AUJOURDHUI }] as any[], [], AUJOURDHUI);
    expect(s.echeances[0].statut).toBe('a_venir');
  });

  it('un trop-perçu ne rend pas le reste à payer négatif', () => {
    const s = calculerSuivi(10_000_000, echeances, [versement('2026-10-01', 12_000_000)], AUJOURDHUI);
    expect(s.resteAPayer).toBe(0);
    expect(s.echeances.every(e => e.statut === 'payee')).toBe(true);
  });

  it('les versements les plus récents viennent en premier', () => {
    const s = calculerSuivi(10_000_000, echeances, [versement('2026-09-01', 1), versement('2026-10-10', 1)], AUJOURDHUI);
    expect(s.paiements.map(p => p.date)).toEqual(['2026-10-10', '2026-09-01']);
  });
});
