// Groupes de rôles : doivent rester alignés avec Backend-BTP/src/auth/roles.ts
// (le backend fait foi ; ici on cache seulement les boutons inutilisables)

export const ROLES_GESTION_PROJET = ['directeur_general', 'directeur_technique', 'chef_projet'];
export const ROLES_GESTION_MEMBRES = ['directeur_general', 'directeur_technique'];
export const ROLES_BUDGET = ['directeur_general', 'directeur_technique', 'responsable_admin_fin', 'chef_projet'];
// Le chef de projet consulte le budget mais ne saisit ni devis ni dépense
export const ROLES_SAISIE_BUDGET = ['directeur_general', 'directeur_technique', 'responsable_admin_fin'];
export const ROLES_INTERNES = [
  'directeur_general', 'directeur_technique', 'chef_projet', 'conducteur_travaux',
  'responsable_admin_fin', 'magasinier',
];

export const roleLabels = {
  directeur_general: 'Directeur Général',
  directeur_technique: 'Directeur Technique',
  chef_projet: 'Chef de Projet',
  conducteur_travaux: 'Conducteur de Travaux',
  responsable_admin_fin: 'Responsable Admin. & Fin.',
  magasinier: 'Magasinier',
  maitre_ouvrage_externe: "Maître d'Ouvrage (client)",
};
