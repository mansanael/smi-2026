// Couleur d'une tâche du planning (demande de Mme Aminata Sarr : rouge / jaune / vert)
//  - vert   : terminée, ou avancement conforme à ce qui était prévu à cette date
//  - orange : en retard sur l'avancement prévu (écart de plus de 15 points), mais la date de fin n'est pas passée
//  - rouge  : date de fin dépassée sans être terminée
//  - gris   : pas encore commencée et prévue plus tard, ou sans dates

const JOUR = 24 * 3600 * 1000;
const ECART_TOLERE = 15; // points d'avancement

export const ETATS_TACHE = {
  en_retard: { label: 'En retard', couleur: '#ef4444', badge: 'badge-red', ordre: 0 },
  a_surveiller: { label: 'À surveiller', couleur: '#f59e0b', badge: 'badge-amber', ordre: 1 },
  a_temps: { label: 'Dans les temps', couleur: '#10b981', badge: 'badge-green', ordre: 2 },
  termine: { label: 'Terminée', couleur: '#10b981', badge: 'badge-green', ordre: 3 },
  a_venir: { label: 'À venir', couleur: '#64748b', badge: 'badge-gray', ordre: 4 },
  sans_dates: { label: 'Sans dates', couleur: '#64748b', badge: 'badge-gray', ordre: 5 },
};

const jour = (d) => (d ? new Date(`${String(d).slice(0, 10)}T00:00:00Z`).getTime() : null);
const formatJour = (d) => new Date(`${String(d).slice(0, 10)}T00:00:00Z`).toLocaleDateString('fr-FR', { timeZone: 'UTC' });

/** État d'une tâche à une date donnée (aujourd'hui par défaut) */
export function etatTache(t, aujourdhui = new Date().toISOString().slice(0, 10)) {
  const avancement = Number(t.pourcentageAvancement) || 0;
  const maintenant = jour(aujourdhui);
  const debut = jour(t.dateDebutPrevue);
  const fin = jour(t.dateFinPrevue);
  const etat = (niveau, explication, avancementAttendu = null) => ({ niveau, ...ETATS_TACHE[niveau], explication, avancementAttendu });

  if (t.statut === 'terminee' || avancement >= 100) return etat('termine', 'Tâche terminée.');
  if (fin !== null && fin < maintenant) {
    const jours = Math.round((maintenant - fin) / JOUR);
    return etat('en_retard', `Devait être finie le ${formatJour(t.dateFinPrevue)} (${jours} j de retard), avancement ${avancement} %.`);
  }
  if (t.statut === 'en_retard') return etat('en_retard', 'Signalée en retard par l’équipe.');
  // Sans dates prévues, impossible de dire si la tâche est dans les temps
  if (debut === null || fin === null) return etat('sans_dates', 'Dates prévues non renseignées : impossible de suivre le délai.');
  if (debut > maintenant && avancement === 0) return etat('a_venir', `Commence le ${formatJour(t.dateDebutPrevue)}.`);

  const attendu = Math.round(Math.min(100, Math.max(0, ((maintenant - debut) / Math.max(fin - debut, JOUR)) * 100)));
  if (attendu - avancement > ECART_TOLERE) {
    return etat('a_surveiller', `À cette date, environ ${attendu} % devraient être faits ; ${avancement} % le sont.`, attendu);
  }
  return etat('a_temps', `Prévu à cette date : environ ${attendu} % ; réalisé : ${avancement} %.`, attendu);
}

/** Nombre de tâches par état, pour la légende */
export function compterEtats(taches, aujourdhui) {
  const compte = { en_retard: 0, a_surveiller: 0, a_temps: 0, termine: 0, a_venir: 0, sans_dates: 0 };
  for (const t of taches) compte[etatTache(t, aujourdhui).niveau] += 1;
  return compte;
}
