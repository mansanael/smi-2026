// Calcul du devis estimatif : surface × prix au m² de chaque lot, puis imprévus, part de l'entreprise et TVA.
// Aucun prix ne vient de l'IA : tout vient de la table de l'entreprise.

export type Finition = 'economique' | 'standard' | 'haut_standing';
export const FINITIONS: Finition[] = ['economique', 'standard', 'haut_standing'];

export interface RatioLot {
  code: string;
  libelle: string;
  ordre: number;
  prixEconomique: number;
  prixStandard: number;
  prixHautStanding: number;
}

export interface Taux {
  tauxImprevus: number; // %
  tauxPartEntreprise: number; // % : frais généraux et bénéfice
  tauxTva: number; // %
}

export interface Estimation {
  surfaceM2: number;
  finition: Finition;
  lots: { code: string; libelle: string; prixM2: number; montant: number }[];
  prixM2Travaux: number;
  coutTravaux: number;
  imprevus: number;
  partEntreprise: number;
  totalHT: number;
  tva: number;
  totalTTC: number;
  // Une estimation par ratios n'est pas un métré : on donne une fourchette de ±10 %
  fourchetteTTC: { min: number; max: number };
  taux: Taux;
}

// Valeurs livrées avec l'application, à remplacer par celles de l'entreprise
export const RATIOS_PAR_DEFAUT: RatioLot[] = [
  { code: 'fondations', libelle: 'Terrassement et fondations', ordre: 1, prixEconomique: 25000, prixStandard: 30000, prixHautStanding: 40000 },
  { code: 'gros_oeuvre', libelle: 'Gros œuvre (poteaux, dalles, murs)', ordre: 2, prixEconomique: 90000, prixStandard: 110000, prixHautStanding: 150000 },
  { code: 'etancheite', libelle: 'Étanchéité', ordre: 3, prixEconomique: 8000, prixStandard: 10000, prixHautStanding: 15000 },
  { code: 'menuiseries', libelle: 'Menuiseries (portes, fenêtres)', ordre: 4, prixEconomique: 20000, prixStandard: 30000, prixHautStanding: 60000 },
  { code: 'plomberie', libelle: 'Plomberie et sanitaires', ordre: 5, prixEconomique: 15000, prixStandard: 20000, prixHautStanding: 40000 },
  { code: 'electricite', libelle: 'Électricité', ordre: 6, prixEconomique: 15000, prixStandard: 20000, prixHautStanding: 35000 },
  { code: 'revetements', libelle: 'Carrelage et revêtements', ordre: 7, prixEconomique: 20000, prixStandard: 30000, prixHautStanding: 60000 },
  { code: 'peinture', libelle: 'Peinture', ordre: 8, prixEconomique: 7000, prixStandard: 10000, prixHautStanding: 20000 },
];

export const TAUX_PAR_DEFAUT: Taux = { tauxImprevus: 5, tauxPartEntreprise: 15, tauxTva: 18 };

const prixDuLot = (r: RatioLot, f: Finition) =>
  f === 'economique' ? r.prixEconomique : f === 'haut_standing' ? r.prixHautStanding : r.prixStandard;

export function calculerEstimation(ratios: RatioLot[], taux: Taux, surfaceM2: number, finition: Finition): Estimation {
  const lots = [...ratios]
    .sort((a, b) => a.ordre - b.ordre)
    .map((r) => ({ code: r.code, libelle: r.libelle, prixM2: prixDuLot(r, finition), montant: Math.round(surfaceM2 * prixDuLot(r, finition)) }));
  const coutTravaux = lots.reduce((s, l) => s + l.montant, 0);
  const imprevus = Math.round((coutTravaux * taux.tauxImprevus) / 100);
  const partEntreprise = Math.round((coutTravaux * taux.tauxPartEntreprise) / 100);
  const totalHT = coutTravaux + imprevus + partEntreprise;
  const tva = Math.round((totalHT * taux.tauxTva) / 100);
  const totalTTC = totalHT + tva;
  return {
    surfaceM2,
    finition,
    lots,
    prixM2Travaux: lots.reduce((s, l) => s + l.prixM2, 0),
    coutTravaux,
    imprevus,
    partEntreprise,
    totalHT,
    tva,
    totalTTC,
    fourchetteTTC: { min: Math.round(totalTTC * 0.9), max: Math.round(totalTTC * 1.1) },
    taux,
  };
}
