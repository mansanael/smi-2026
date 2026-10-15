import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';

// Groupes de rôles partagés par les contrôleurs et l'assistant IA

/** Voient tous les projets de l'entreprise, sans être membres */
export const ROLES_TOUS_PROJETS: RoleUtilisateur[] = [
  RoleUtilisateur.DIRECTEUR_GENERAL,
  RoleUtilisateur.DIRECTEUR_TECHNIQUE,
  RoleUtilisateur.RESPONSABLE_ADMIN_FIN,
];

/** Personnel de l'entreprise (tout le monde sauf le client) */
export const ROLES_INTERNES: RoleUtilisateur[] = Object.values(RoleUtilisateur).filter(
  (r) => r !== RoleUtilisateur.MAITRE_OUVRAGE_EXTERNE,
);

export const ROLES_BUDGET: RoleUtilisateur[] = [
  RoleUtilisateur.DIRECTEUR_GENERAL,
  RoleUtilisateur.DIRECTEUR_TECHNIQUE,
  RoleUtilisateur.RESPONSABLE_ADMIN_FIN,
  RoleUtilisateur.CHEF_PROJET,
];

export const ROLES_FACTURATION: RoleUtilisateur[] = [
  RoleUtilisateur.DIRECTEUR_GENERAL,
  RoleUtilisateur.DIRECTEUR_TECHNIQUE,
  RoleUtilisateur.RESPONSABLE_ADMIN_FIN,
];

export const ROLES_RH: RoleUtilisateur[] = [
  RoleUtilisateur.DIRECTEUR_GENERAL,
  RoleUtilisateur.DIRECTEUR_TECHNIQUE,
  RoleUtilisateur.RESPONSABLE_ADMIN_FIN,
  RoleUtilisateur.CHEF_PROJET,
  RoleUtilisateur.CONDUCTEUR_TRAVAUX,
];

/** Peuvent créer et modifier un projet */
export const ROLES_GESTION_PROJET: RoleUtilisateur[] = [
  RoleUtilisateur.DIRECTEUR_GENERAL,
  RoleUtilisateur.DIRECTEUR_TECHNIQUE,
  RoleUtilisateur.CHEF_PROJET,
];

/** Choisissent qui fait partie de l'équipe d'un projet */
export const ROLES_GESTION_MEMBRES: RoleUtilisateur[] = [
  RoleUtilisateur.DIRECTEUR_GENERAL,
  RoleUtilisateur.DIRECTEUR_TECHNIQUE,
];
