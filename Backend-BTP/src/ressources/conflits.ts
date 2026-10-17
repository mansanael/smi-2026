// Règles de conflit d'affectation (demande de Mme Aminata Sarr : répartir les ressources sans conflits)

/** Part de journée occupée par un pointage : présent = 1, demi-journée = 0,5, absent / congé / maladie = 0 */
export const chargeDuPointage = (statut?: string | null): number =>
  statut === 'present' || !statut ? 1 : statut === 'demi_journee' ? 0.5 : 0;

export interface PointageExistant {
  statut: string;
  projetId: string;
  projetReference?: string;
}

/**
 * Pointages du même ouvrier le même jour : au plus une journée en tout (deux demi-journées sur deux chantiers
 * sont permises) et un seul pointage par chantier (sinon il serait payé deux fois).
 * Renvoie le message du conflit, ou null.
 */
export function conflitPointage(nouveau: { statut?: string; projetId: string }, existants: PointageExistant[]): string | null {
  if (existants.some((p) => p.projetId === nouveau.projetId)) return 'il est déjà pointé ce jour-là sur ce chantier';
  const charge = chargeDuPointage(nouveau.statut);
  if (charge === 0) return null;
  const occupes = existants.filter((p) => chargeDuPointage(p.statut) > 0);
  const total = occupes.reduce((s, p) => s + chargeDuPointage(p.statut), charge);
  if (total <= 1) return null;
  return `il est déjà pointé ce jour-là sur ${occupes.map((p) => p.projetReference || 'un autre chantier').join(', ')}`;
}

/** Deux périodes [début, fin] se chevauchent ; une fin absente = affectation sans date de fin */
export function periodesSeChevauchent(
  a: { dateDebut: string | Date; dateFin?: string | Date | null },
  b: { dateDebut: string | Date; dateFin?: string | Date | null },
): boolean {
  const jour = (d: string | Date | null | undefined) => (d ? String(d instanceof Date ? d.toISOString() : d).slice(0, 10) : null);
  const finA = jour(a.dateFin) ?? '9999-12-31';
  const finB = jour(b.dateFin) ?? '9999-12-31';
  return (jour(a.dateDebut) as string) <= finB && (jour(b.dateDebut) as string) <= finA;
}

const formatJour = (d?: string | Date | null) =>
  d ? new Date(String(d).slice(0, 10)).toLocaleDateString('fr-FR', { timeZone: 'UTC' }) : 'sans date de fin';

export const decrirePeriode = (dateDebut: string | Date, dateFin?: string | Date | null) =>
  `du ${formatJour(dateDebut)} ${dateFin ? `au ${formatJour(dateFin)}` : '(sans date de fin)'}`;
