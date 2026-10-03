# BATIPME-SN : Guide Exhaustif des Modules, Interfaces et Données de l'Application

> **Plateforme de Gestion Intégrée (ERP) pour les PME du BTP au Sénégal 🇸🇳**  
> Version : 1.0.0 (SMI-2026)  
> Document généré le : 03 Octobre 2026  
> Auteur : Antigravity IDE / Architecture BTP

---

## Sommaire

1. [Présentation Générale & Spécificités Sénégalaises](#1-présentation-générale--spécificités-sénégalaises)
2. [Matrice des Rôles et Droits d'Accès (RBAC)](#2-matrice-des-rôles-et-droits-daccès-rbac)
3. [Composants Communs de Navigation (Layout, Sidebar, Topbar, Alertes)](#3-composants-communs-de-navigation)
4. [Module 1 : Gestion des Projets (`/projets`, `/projets/:id`)](#4-module-1--gestion-des-projets)
5. [Module 2 : Planning & Délais (`/planning`)](#5-module-2--planning--délais)
6. [Module 3 : Budget & Suivi Financier (`/budget`)](#6-module-3--budget--suivi-financier)
7. [Module 4 : Ressources Humaines, Matérielles & Sous-Traitance (`/ressources`)](#7-module-4--ressources-humaines-matérielles--sous-traitance)
8. [Module 5 : Suivi de Chantier & Terrain (`/suivi`)](#8-module-5--suivi-de-chantier--terrain)
9. [Module 6 : Gestion Électronique des Documents (`/documents`)](#9-module-6--gestion-électronique-des-documents)
10. [Module 7 : Approvisionnement & Stocks (`/approvisionnement`)](#10-module-7--approvisionnement--stocks)
11. [Module 8 : Facturation & Décomptes Mensuels (`/facturation`)](#11-module-8--facturation--décomptes-mensuels)
12. [Module 9 : Administration des Utilisateurs (`/admin/utilisateurs`)](#12-module-9--administration-des-utilisateurs)
13. [Module 10 : Profil & Paramètres du Compte (`/profil`, `/parametres`)](#13-module-10--profil--paramètres-du-compte)
14. [Module 11 : Assistant IA & Veille Proactive (`/assistant`, `AlertesBadge`)](#14-module-11--assistant-ia--veille-proactive)
15. [Dictionnaire Complet des Entités et de la Base de Données](#15-dictionnaire-complet-des-entités-et-de-la-base-de-données)

---

## 1. Présentation Générale & Spécificités Sénégalaises

**BATIPME-SN** est une plateforme intégrée de gestion de projets de construction et de travaux publics, spécialement dimensionnée pour les réalités opérationnelles, juridiques et économiques des PME du BTP au Sénégal.

### Spécificités Sénégalaises Intégrées Nativement :
* **Monnaie :** Franc CFA (XOF / FCFA), formats chiffrés avec séparateur d'espace (`150 000 000 FCFA`).
* **Fiscalité & Décomptes des Marchés Publics :**
  * Taux standard de TVA : **18 %**.
  * Taxe sur Contrats Spéciaux (TCS) : **1 %**.
  * Retenue de garantie contractuelle standard : **5 %** (avec restitution à la réception définitive).
  * Avance de démarrage légale : **20 %** déduite au prorata des situations.
* **Code du Travail & Rémunérations (2026) :**
  * SMIG réglementaire : **60 000 FCFA / mois** (taux journalier de base de **2 333 FCFA / jour**).
  * Numéros administratifs : **CNI** (Carte Nationale d'Identité), **IPRES** (retraite), **CSS** (Caisse de Sécurité Sociale - accidents du travail et maladies professionnelles).
  * Gestion des heures supplémentaires selon les paliers réglementaires (25% à 50%).
  * Typologies de main-d'œuvre locales : journaliers, tâcherons (forfait d'équipe), ouvriers qualifiés, manœuvres.
* **Cadre des Marchés Publics & Entreprises :**
  * Immatriculation fiscale nationale : **NINEA** (Numéro d'Identification Nationale des Entreprises et Associations).
  * Registre commercial : **RCCM** (Registre du Commerce et du Crédit Mobilier).
  * Référentiel des marchés : Code des marchés publics ARCOP (appels d'offres ouverts, restreints, entente directe).
* **Conditions Climatiques & Suivi Chantier :**
  * Météo adaptée au Sénégal : Ensoleillé, Nuageux, Pluie (hivernage), **Harmattan** (vents de sable secs), Orage.

---

## 2. Matrice des Rôles et Droits d'Accès (RBAC)

L'application implémente un contrôle d'accès basé sur 7 rôles précis :

| Code Rôle | Libellé Affiché | Périmètre & Accès Principaux |
| :--- | :--- | :--- |
| `directeur_general` | **Directeur Général** | Accès absolu : Dashboard, Projets, Planning, Budget, Ressources, Suivi, Documents, Approvisionnement, Facturation, Utilisateurs, IA, validation des bons de commande > 500k FCFA, suppression de données. |
| `directeur_technique` | **Directeur Technique** | Accès opérationnel complet : Supervision technique, validation plannings, gestion des utilisateurs, suivi des chantiers et approvisionnements. |
| `chef_projet` | **Chef de Projet** | Conduite de ses projets : Plannings, jalons, pointages, journaux, incidents, documents, bons de commande jusqu'à 500k FCFA. Accès restreint au budget global et à l'administration des utilisateurs. |
| `conducteur_travaux` | **Conducteur de Travaux** | Opérations de chantier : Suivi journalier, météo, ouvriers, photos du chantier, déclaration d'incidents HSE, pointage ouvriers. |
| `responsable_admin_fin` | **Resp. Admin & Finance** | Gestion financière : Budget, devis, dépenses, situations de travaux / facturation, documents administratifs (cautions, attestations fiscales), fournisseurs. |
| `magasinier` | **Magasinier** | Gestion de la logistique : Approvisionnements, réception de matériaux, bons de livraison, mouvements d'entrées et sorties de stock de chantier. |
| `maitre_ouvrage_externe`| **Maître d'Ouvrage** | Espace consultation client/bailleur : Visualisation de l'avancement physique et financier des projets concernés, validation des décomptes et rapports. |

---

## 3. Composants Communs de Navigation

### 3.1. Page Publique d'Accueil (Landing Page - `App.jsx`)
* **Accès :** URL `/` lorsque l'utilisateur n'est pas authentifié.
* **Éléments affichés :**
  * Logo emblématique BATIPME-SN avec icône bâtiment.
  * Titre : `BATIPME-SN - Logiciel de Gestion de Projets BTP`.
  * Sous-titre : `Adapté aux PME du Sénégal 🇸🇳`.
  * Bouton d'action principal : `Se Connecter` (redirige vers `/login`).
  * Bouton secondaire : `Découvrir`.
  * Indicateurs phares : `10+ Modules`, `100% Sécurisé`, `24/7 Support`.
  * Pied de page : `© 2026 BATIPME-SN. Tous droits réservés.`

### 3.2. Menu Latéral (Sidebar - `Sidebar.jsx`)
* **Éléments d'en-tête :** Logo stylisé BATIPME-SN, mention `Gestion BTP`.
* **Liste des rubriques dynamiques (filtrées selon le rôle connecté) :**
  1. `Dashboard` (Icône Tableau de bord) ➔ `/`
  2. `Projets` (Icône Dossier Kanban) ➔ `/projets`
  3. `Planning` (Icône Calendrier) ➔ `/planning`
  4. `Budget` (Icône Portefeuille) ➔ `/budget` *(DG, DT, RAF)*
  5. `Ressources` (Icône Utilisateurs) ➔ `/ressources`
  6. `Suivi Chantier` (Icône Bloc-notes vérifié) ➔ `/suivi`
  7. `Documents` (Icône Document) ➔ `/documents`
  8. `Approvisionnement` (Icône Camion) ➔ `/approvisionnement` *(DG, DT, RAF, Magasinier)*
  9. `Facturation` (Icône Reçu fiscal) ➔ `/facturation` *(DG, DT, RAF)*
  10. `Utilisateurs` (Icône Bouclier sécurité) ➔ `/admin/utilisateurs` *(DG, DT)*
  11. `Assistant IA` (Icône Robot) ➔ `/assistant`
* **Pied de page :** Copyright © 2026 BATIPME-SN et pastille de version `v1.0.0`.

### 3.3. Barre Supérieure (Topbar - `Topbar.jsx` & `AlertesBadge.jsx`)
* **Zone Gauche :**
  * Bouton bascule Hamburger (mobile).
  * Barre de recherche globale : Champ texte avec placeholder *"Rechercher projets, documents..."*.
* **Zone Droite :**
  * **Module d'Alertes Proactives IA (`AlertesBadge.jsx`) :**
    * Cloche de notification avec compteur dynamique rouge pulsé (ex: `3`).
    * Menu déroulant popover affichant les alertes non lues classées par gravité :
      * **Critique (Rouge)** : Risque financier majeur, retard critique, accident grave.
      * **Attention (Ambre)** : Dépenses en avance sur l'avancement physique, document arrivant à expiration sous 15 jours.
      * **Info (Bleu)** : Notification de livraison, validation de situation.
    * Référence du projet associé affichée sous forme d'étiquette.
    * Horodatage relatif (ex: *03/10 à 14:30*).
    * Bouton d'analyse instantanée : Rafraîchit et exécute immédiatement le diagnostic IA sur l'ensemble de la base.
    * Bouton `Tout marquer comme lu` et fermeture individuelle d'alerte par croix.
  * **Menu Utilisateur (User Dropdown) :**
    * Photo de profil de l'utilisateur ou pastille d'initiales colorées.
    * Nom et Prénom de l'utilisateur.
    * Libellé en clair du rôle (ex: *"Directeur Général"*).
    * Menu déroulant avec :
      * En-tête : Avatar agrandi, Nom complet, Adresse email.
      * Bouton `Mon Profil` ➔ redirection `/profil`.
      * Bouton `Paramètres` ➔ redirection `/parametres`.
      * Bouton `Déconnexion` (rouge) avec invalidation du token JWT et retour à `/login`.

---

## 4. Module 1 : Gestion des Projets

### 4.1. Interface : Liste des Projets (`/projets`)
* **Composant Frontend :** `ProjetsList.jsx`
* **Rôles autorisés :** Tous les utilisateurs connectés.
* **En-tête de la page :**
  * Titre : `Projets`.
  * Sous-titre : Compteur global (ex: *12 projet(s) au total*).
  * Bouton d'action : `+ Nouveau projet` (Ouvre la modale de création).
* **Barre de filtres par statut :**
  * Boutons filtres : `Tous`, `En étude`, `Soumissionné`, `Attribué`, `En préparation`, `En cours`, `Travaux terminés`, `En garantie`, `Clôturé`.
* **Tableau récapitulatif des projets :**
  * Colonnes :
    1. **Référence :** Code unique du projet (ex: `PRJ-2026-DKR-01`).
    2. **Intitulé :** Nom complet de l'ouvrage ou du chantier.
    3. **Région :** Avec icône de géolocalisation (ex: `Dakar`, `Thiès`, `Saint-Louis`).
    4. **Type marché :** Pastille colorée (`Public`, `Privé`, `PPP`).
    5. **Statut :** Badge dynamique coloré (Gris, Violet, Vert émeraude, Ambre, Bleu).
    6. **Montant marché :** Formaté en FCFA avec séparateurs de milliers.
* **Modale "Nouveau projet" :**
  * **Référence \*** (texte, ex: `PRJ-2026-001`).
  * **Type de marché \*** (Menu déroulant : `Public`, `Privé`, `PPP`).
  * **Intitulé \*** (texte, ex: `Construction du Lycée d'Excellence de Diamniadio`).
  * **Région \*** (texte, ex: `Dakar`).
  * **Commune \*** (texte, ex: `Diamniadio`).
  * **Maître d'ouvrage \*** (texte, ex: `Ministère de l'Éducation Nationale / AGETIP`).
  * **Montant marché (FCFA) \*** (nombre, ex: `450000000`).
  * **Source financement \*** (texte, ex: `Budget Consolidé d'Investissement BCI / BAFD`).
  * **Date démarrage** (date calendrier).
  * **Durée (jours)** (nombre de jours calendaires, ex: `365`).
  * Boutons : `Annuler` et `Créer le projet`.

---

### 4.2. Interface : Fiche Détail d'un Projet (`/projets/:id`)
* **Composant Frontend :** `ProjetDetail.jsx`
* **Rôles autorisés :** Tous les utilisateurs connectés.
* **Bandeau supérieur :**
  * Bouton retour (`<--`) vers `/projets`.
  * Intitulé du projet en grand titre `<h1>`.
  * Sous-titre : Référence du projet et Région.
  * **Sélecteur de statut en direct :** Menu déroulant permettant de faire progresser le statut du projet (`En étude` ➔ `Travaux terminés` ➔ `Clôturé`).
  * **Bouton Supprimer :** Icône corbeille rouge (avec boîte de dialogue de confirmation).
* **Grille des 4 Cartes KPI du projet :**
  1. **Avancement physique :** Valeur en pourcentage (ex: `65%`) calculée automatiquement à partir de la moyenne pondérée des tâches du planning, avec barre de progression bleue.
  2. **Montant marché (FCFA) :** Montant contractuel initial (ex: `250 000 000 FCFA`).
  3. **Jours contractuels :** Durée contractuelle totale allouée (ex: `180 jours`).
  4. **Localisation :** Commune et Région d'exécution (ex: `Mbour, Thiès`).
* **Bandeau d'alertes automatiques :**
  * Cadres rouges d'alertes générées si dépassement financier, retard ou incident bloquant.
* **Grille d'informations "Informations du projet" :**
  * **Type marché :** `Public` / `Privé` / `PPP`.
  * **Maître d'ouvrage :** Entité cliente / commanditaire.
  * **Maître d'œuvre :** Architecte / Ingénieur conseil chargé du suivi des travaux.
  * **Bureau d'études techniques (BET) :** Bureau d'ingénierie structure, VRD, fluides.
  * **Bureau de contrôle :** Contrôle technique et conformité décennale (ex: SOCOTEC, Veritas).
  * **Source de financement :** Bailleurs de fonds ou fonds propres.
  * **Date de démarrage :** Date effective ou prévisionnelle de début des travaux.
  * **N° marché :** Référence administrative du contrat public ou privé.
* **Grille des KPIs de performance :**
  * **Tâches terminées :** Ratio tâches achevées / nombre total de tâches (ex: `14 / 22`).
  * **Dépenses réalisées :** Cumul des décaissements et factures payées en FCFA.
  * **Reste à dépenser :** Différence entre montant marché et dépenses constatées.
  * **Situations facturées :** Nombre de décomptes mensuels émis.
  * **Incidents :** Nombre d'incidents de sécurité ou qualité déclarés sur le chantier.
* **Zone Description détaillée :** Texte libre précisant la consistance des travaux.

---

## 5. Module 2 : Planning & Délais

### 5.1. Interface : Planning des Tâches et Jalons (`/planning`)
* **Composant Frontend :** `Planning.jsx`
* **Rôles autorisés :** Tous les utilisateurs connectés.
* **En-tête de la page :**
  * Titre : `Planning & Délais`.
  * Sous-titre : `Pilotage des tâches, suivi de l'avancement physique et jalons contractuels`.
  * Boutons d'action : `+ Nouveau jalon` et `+ Nouvelle tâche` (visibles lorsqu'un projet est sélectionné).
* **Sélecteur de projet :** Menu déroulant listant tous les projets par Référence et Intitulé, avec compteurs rapides de tâches et de jalons.
* **Bandeau des 4 KPI d'Avancement Global :**
  1. **Avancement physique global :** Moyenne dynamique de l'avancement physique de l'ensemble des tâches du chantier avec barre de progression colorée.
  2. **Tâches terminées :** Ratio des tâches achevées (100%) sur le total.
  3. **Tâches en cours d'exécution :** Nombre de tâches actives sur le chantier.
  4. **Jalons contractuels atteints :** Ratio des jalons contractuels validés sur le total.
* **Tableau des Tâches du projet :**
  * Colonnes :
    1. **Indicateur de statut :** Icône verte cochée si terminée, bleue sablier si en cours, rouge alerte si en retard, grise si à faire.
    2. **Tâche :** Libellé de la tâche, description technique éventuelle et badge de statut.
    3. **Lot :** Lot WBS de rattachement avec pastille turquoise (`Terrassement`, `Fondations`, `Gros œuvre`, `Charpente`, `Menuiserie`, `Électricité`, `Plomberie`, `Peinture`, `Carrelage`, `VRD`, etc.).
    4. **Planning :** Dates prévisionnelles de démarrage et de fin, avec durée en jours calendaires.
    5. **Avancement physique (Interactif avec Boutons) :**
       * Barre de progression et pourcentage cliquables.
       * **Bouton rapide `-10%` :** Décrémente l'avancement de 10% en un clic.
       * **Bouton rapide `+10%` :** Incrémente l'avancement de 10% en un clic.
       * **Bouton rapide `✓ 100%` :** Passe instantanément la tâche à 100% et au statut "Terminée".
       * **Bouton `Régler` (curseur) :** Ouvre la modale de réglage précis de l'avancement (slider 0-100%, présélections rapides 0%, 25%, 50%, 75%, 100%, synchronisation automatique du statut).
    6. **Responsable :** Nom du conducteur ou chef de chantier en charge.
    7. **Actions :** Bouton Modifier (icône crayon) pour modifier tous les détails de la tâche, et Bouton Supprimer (icône corbeille).
* **Tableau des Jalons contractuels :**
  * Colonnes :
    1. **Jalon :** Libellé de l'étape clé (ex: *Hors d'eau*, *Réception provisoire*).
    2. **Type :** Type d'étape (pastille violette).
    3. **Date prévue :** Date butoir fixée.
    4. **Date réelle :** Date de réalisation effective.
    5. **Statut / Validation :** Bouton interactif pour valider un jalon (`Marquer atteint` ➔ `Atteint ✓`).
    6. **Actions :** Bouton Supprimer le jalon.
* **Modale "Nouvelle tâche" :**
  * **Intitulé \*** (texte).
  * **Description** (zone de texte).
  * **Lot WBS** (menu déroulant).
  * **Durée (jours)** (nombre).
  * **Date début et Date fin** (calendriers).
  * **Responsable** (texte).
  * **Avancement initial (%)** (nombre 0 à 100).
  * **Statut initial** (`À faire`, `En cours`, `Terminée`, etc.).
* **Modale "Régler l'avancement" :**
  * Grand affichage numérique du pourcentage.
  * Curseur interactif (Slider 0-100%).
  * Boutons de présélection instantanée : `0% (À faire)`, `25%`, `50%`, `75%`, `100% (Terminé)`.
  * Synchronisation intelligente du statut (`terminee`, `en_cours`, `a_faire`).
* **Modale "Nouveau jalon contractuel" :**
  * Nom de l'étape clé, Type de jalon, Date prévue et case à cocher si déjà atteint.

---

## 6. Module 3 : Budget & Suivi Financier

### 6.1. Interface : Suivi Budgétaire, Devis et Dépenses (`/budget`)
* **Composant Frontend :** `Budget.jsx`
* **Rôles autorisés :** `directeur_general`, `directeur_technique`, `responsable_admin_fin`.
* **En-tête de la page :**
  * Titre : `Budget`.
  * Sous-titre : `Suivi des devis, dépenses et avenants par projet`.
  * Sélecteur de projet : Liste déroulante des chantiers.
* **Grille des 4 Cartes KPI Budgétaires :**
  1. **Montant du marché :** Valeur contractuelle initiale en FCFA (carte bleue).
  2. **Total devisé :** Somme prévisionnelle détaillée des lignes du devis d'exécution (carte turquoise).
  3. **Total dépensé :** Cumul des dépenses effectivement engagées et payées (carte verte ou ambre si proche du seuil).
  4. **Solde restant / Dépassement :** Écart financier disponible ou montant du dépassement alerté (carte rouge/ambre si dépassement).
* **Navigation par onglets :**
  * Bouton `Devis`
  * Bouton `Dépenses`
  * Bouton d'action à droite : `+ Ligne de devis` ou `+ Dépense` (selon l'onglet actif).
* **Onglet 1 : Devis d'Exécution :**
  * Tableau récapitulatif :
    * **Désignation :** Description de l'ouvrage ou du poste (ex: *Béton armé dosé à 350 kg/m³ pour longrines*).
    * **Unité :** m³, ml, m², kg, sac, forfait, jour-homme.
    * **Quantité :** Quantité métrée.
    * **Prix unitaire :** Tarif en FCFA.
    * **Total :** Montant calculé automatiquement (`Quantité × PU`) en FCFA.
* **Modale "Nouvelle ligne de devis" :**
  * **Rubrique \*** : Choix parmi les 8 rubriques budgétaires standard :
    * *Main d'œuvre*, *Matériaux*, *Matériel / Engins*, *Sous-traitance*, *Frais de chantier*, *Frais généraux*, *Imprévus*, *Bénéfice*.
  * **Désignation \*** : Intitulé précis du poste de travail.
  * **Unité \*** : Unité de mesure (ex: `m³`, `tonne`, `forfait`).
  * **Quantité \*** : Valeur chiffrée.
  * **Prix unitaire (FCFA) \*** : Montant unitaire HT.
* **Onglet 2 : Dépenses Réelles du Chantier :**
  * Tableau récapitulatif :
    * **Libellé :** Description de l'achat ou du frais (ex: *Achat 200 sacs ciment Sococim 42.5*).
    * **Catégorie :** Pastille (`Main d'œuvre`, `Matériaux`, `Matériel`, `Sous-traitance`, `Frais généraux`, `Autre`).
    * **Montant :** Montant décaissé en FCFA.
* **Modale "Nouvelle dépense" :**
  * **Type \*** :
    * `Engagement (bon de commande)`
    * `Réalisation (facture payée)`
  * **Libellé \*** : Description de la dépense.
  * **Catégorie \*** : Sélection parmi Main d'œuvre, Matériaux, Matériel, Sous-traitance, Frais généraux, Autre.
  * **Montant (FCFA) \*** : Montant total décaissé.
  * **Date \*** : Date de la facture ou du paiement.

---

## 7. Module 4 : Ressources Humaines, Matérielles & Sous-Traitance

### 7.1. Interface : Ressources & Affectations (`/ressources`)
* **Composant Frontend :** `Ressources.jsx`
* **Rôles autorisés :** Tous les utilisateurs connectés.
* **En-tête de la page :**
  * Titre : `Ressources`.
  * Sous-titre : `Personnel, engins, sous-traitants et affectations par projet`.
  * Sélecteur de projet : Présent sur l'onglet "Affectations par projet".
* **Navigation par 4 Onglets :**
  1. `Personnel`
  2. `Engins`
  3. `Sous-traitants`
  4. `Affectations par projet` (Pointages)

#### Onglet 1 : Personnel & Main-d'œuvre
* **Tableau du personnel :**
  * Colonnes : Nom & Prénom, Poste (ex: *Ferrailleur, Grutier, Maçon*), Catégorie (pastille *Encadrement*, *Ouvrier qualifié*, *Manœuvre*, *Tâcheronnage*, *Saisonnier*), Type de contrat (*CDI, CDD, Journalier, Tâcheronnage*), Taux journalier (FCFA), Salaire mensuel (FCFA), Téléphone.
* **Modale "Nouvel Employé" :**
  * Nom, Prénom, Poste, Catégorie, Type de contrat, Taux journalier (FCFA/jour), Salaire mensuel (FCFA/mois), Numéro de téléphone.

#### Onglet 2 : Parc Engins & Équipements
* **Tableau des engins :**
  * Colonnes : Désignation (ex: *Pelle hydraulique CAT 320, Bétonnière 350L*), Immatriculation, Marque, Modèle, Type (*Propre* ou *Loué*), Statut (*Disponible* [vert], *En service* [bleu], *En maintenance* [ambre], *Hors service* [gris]), Taux journalier (FCFA).
* **Modale "Nouvel Engin" :**
  * Désignation, Immatriculation, Marque, Modèle, Type (Propre / Loué), Statut, Taux journalier (FCFA).

#### Onglet 3 : Annuaire des Sous-Traitants
* **Tableau des sous-traitants :**
  * Colonnes : Nom de l'entreprise (Raison sociale), Gérant, Spécialité (*Électricité, Plomberie, Menuiserie Alu, Menuiserie Bois, Peinture, Carrelage, Étanchéité, VRD, Terrassement, Gros œuvre, Autre*), Région d'intervention, Numéro de téléphone, Adresse email, Évaluation de performance.
* **Modale "Nouveau Sous-traitant" :**
  * Raison sociale, Nom du gérant, Spécialité, Région, Téléphone, Email.

#### Onglet 4 : Affectations & Pointages Quotidiens
* **Tableau des pointages de chantier :**
  * Colonnes : Employé concerné, Date de la journée, Statut de présence (*Présent* [vert], *Absent* [gris], *Demi-journée* [ambre], *Congé* [bleu], *Maladie* [rouge]), Heures supplémentaires (heures effectuées au-delà du temps légal), Montant jour calculé automatiquement (taux de base + majoration heures sup), Observations.
* **Modale "Nouveau Pointage" :**
  * Sélection de l'employé, Date, Statut de présence, Heures supplémentaires, Observations de journée.

---

## 8. Module 5 : Suivi de Chantier & Terrain

### 8.1. Interface : Suivi de Chantier, HSE & Galerie Photo (`/suivi`)
* **Composant Frontend :** `SuiviChantier.jsx`
* **Rôles autorisés :** Tous les utilisateurs connectés.
* **En-tête de la page :**
  * Titre : `Suivi Chantier`.
  * Sous-titre : `Journal de chantier, incidents et prises de photos par projet`.
  * Sélecteur de projet : Liste déroulante du chantier suivi.
* **Navigation par 3 Onglets :**
  1. `Journal de chantier`
  2. `Incidents`
  3. `Photos du chantier` (avec icône appareil photo)

#### Onglet 1 : Journal de Chantier
* **Tableau du journal quotidien :**
  * Colonnes :
    1. **Date :** Journée du rapport.
    2. **Météo :** Pictogramme et libellé (*Ensoleillé, Nuageux, Pluie, Harmattan, Orage*).
    3. **Ouvriers :** Effectif total présent sur le site.
    4. **Travaux réalisés :** Synthèse textuelle de la production du jour.
    5. **Rédigé par :** Nom de l'auteur (Chef de chantier ou Conducteur).
* **Modale "Nouveau rapport journalier" :**
  * Date du jour.
  * Météo (choix parmi les conditions locales).
  * Température constatée (°C).
  * Nombre d'ouvriers présents sur le site.
  * Travaux réalisés dans la journée.
  * Matériaux réceptionnés sur le site.
  * Visites du jour (Maître d'œuvre, bureau de contrôle, client...).
  * Observations particulières et aléas.
  * Rédigé par.

#### Onglet 2 : Gestion des Incidents & Sécurité (HSE)
* **Tableau des incidents :**
  * Colonnes : Date, Type (*Sécurité, Qualité, Matériel, Approvisionnement, Autre*), Gravité (*Faible, Moyen, Grave, Critique* avec pastille colorée), Description synthétique de l'événement, Actions correctives immédiates engagées, Déclaration CSS (*Coche Oui/Non si accident du travail déclaré à la Caisse de Sécurité Sociale*), Déclaré par.
* **Modale "Nouvel Incident" :**
  * Date, Type d'incident, Niveau de gravité, Description détaillée des faits, Actions correctives entreprises, Case à cocher "Déclaré à la CSS", Auteur du signalement.

#### Onglet 3 : Galerie & Photos de Chantier Géolocalisées
* **Fonctionnalités avancées intégrées :**
  * Prise de vue directe depuis l'appareil photo du smartphone ou téléversement de fichier.
  * **Algorithme de compression terrain automatique côté navigateur :** Redimensionnement dynamique à un maximum de 1600×1600 pixels avec encodage JPEG qualité 82% pour économiser la bande passante 3G/4G sur les chantiers isolés.
  * Filtre de galerie par catégorie : *Toutes, Avancement, Gros œuvre, Second œuvre, Sécurité, Réception, Autre*.
* **Affichage sous forme de cartes visuelles :**
  * Photo haute résolution avec zoom modal en plein écran au clic.
  * Badge de catégorie couleur.
  * Titre de la prise de vue.
  * Zone du chantier (ex: *Bâtiment B - Coulage dalle R+2*).
  * Date de prise et auteur de la photo.
  * Actions : Téléchargement du cliché ou suppression.
* **Modale "Prendre / Ajouter une photo" :**
  * Boutons de capture directe caméra ou sélection de fichier dans la galerie.
  * Prévisualisation instantanée de l'image compressée.
  * Titre du cliché.
  * Description / détails techniques.
  * Catégorie d'avancement.
  * Zone du chantier.
  * Date de prise de vue et nom de l'opérateur.

---

## 9. Module 6 : Gestion Électronique des Documents

### 9.1. Interface : Documents du Projet (`/documents`)
* **Composant Frontend :** `Documents.jsx`
* **Rôles autorisés :** Tous les utilisateurs connectés.
* **En-tête de la page :**
  * Titre : `Documents`.
  * Sous-titre : `Plans, PV, contrats et pièces administratives par projet`.
  * Sélecteur de projet : Liste déroulante.
* **Bandeau d'alerte des expirations :**
  * Alerte visuelle ambrée affichant le nombre de pièces administratives expirant sous peu (cautions de soumission, cautions de bonne fin, attestations fiscales de régularité DGPU/DGID).
* **Bouton d'action :** `+ Document`.
* **Tableau du coffre-fort documentaire :**
  * Colonnes :
    1. **Nom :** Titre de la pièce avec icône de fichier (ex: *Plan de ferraillage semelles v2*).
    2. **Type :** Classification officielle du document :
       * *DAO, Offre technique, Offre financière, Marché signé, CCAP, CCTP, Bordereau de prix, PGSS (Plan Général de Sécurité et Santé), PV installation, Planning, Journal chantier, PV réunion, Ordre de service (OS), Avenant, PV réception provisoire, PV réception définitive, Caution, Attestation fiscale, Plan, Photo, Autre*.
    3. **Phase :** Phase du cycle de vie du marché :
       * *Appel d'offres, Contractualisation, Préparation, Exécution, Réception, Clôture*.
    4. **Version :** Indice de révision (ex: `v1`, `v2`).
    5. **Expiration :** Date d'échéance de validité le cas échéant.
    6. **Déposé par :** Utilisateur ayant enregistré le fichier.
* **Modale "Nouveau document" :**
  * Nom du document.
  * Type de pièce (liste déroulante).
  * Phase du marché.
  * Chemin / Fichier.
  * Date d'expiration (obligatoire pour cautions et attestations fiscales).
  * Auteur du dépôt.

---

## 10. Module 7 : Approvisionnement & Stocks

### 10.1. Interface : Gestion des Fournisseurs, Commandes et Stocks (`/approvisionnement`)
* **Composant Frontend :** `Approvisionnement.jsx`
* **Rôles autorisés :** `directeur_general`, `directeur_technique`, `responsable_admin_fin`, `magasinier`.
* **En-tête de la page :**
  * Titre : `Approvisionnement`.
  * Sous-titre : `Fournisseurs, bons de commande et stock de chantier`.
  * Sélecteur de projet : Actif sur les commandes et les stocks.
* **Navigation par 3 Onglets :**
  1. `Fournisseurs`
  2. `Bons de commande`
  3. `Stock chantier`

#### Onglet 1 : Annuaire des Fournisseurs Agréés
* **Tableau des fournisseurs :**
  * Colonnes : Nom / Raison sociale, Spécialité (*Ciment, Fer à béton, Granulats, Bois, Quincaillerie, Location d'engins, Électricité, Plomberie, Peinture, Carburant, Matériel divers*), Région, Téléphone, Contact principal.
* **Modale "Nouveau Fournisseur" :**
  * Raison sociale, Spécialité, Région, Téléphone, Email, Contact commercial.

#### Onglet 2 : Bons de Commande (Workflow de Validation)
* **Tableau des bons de commande :**
  * Colonnes : Numéro de commande, Fournisseur destinataire, Date d'émission, Montant total en FCFA, Date de livraison prévue, Statut (*Demandé* [gris], *Validé* [bleu], *En livraison* [ambre], *Réceptionné* [vert], *Annulé* [rouge]), Observations.
* **Règle de validation intégrée (Cahier des charges §9.1) :**
  * Commande **< 500 000 FCFA** : Validable par le Chef de Projet.
  * Commande **≥ 500 000 FCFA** : Validation exclusive requise par la Direction Générale.
* **Modale "Nouveau Bon de Commande" :**
  * Sélection du fournisseur, Date, Montant total prévisionnel (FCFA), Date limite de livraison souhaitée, Observations.

#### Onglet 3 : Gestion des Mouvements et Stocks de Chantier
* **Tableau d'inventaire et mouvements :**
  * Colonnes : Type de mouvement (*Entrée en stock* [vert] ou *Sortie vers lot de travail* [ambre]), Matériau concerné (*Ciment Dangote/Sococim, Fer HA FeE500, Sable de dune, Gravier 8/15, Parpaings de 15*), Unité de comptage, Quantité mouvementée, Prix unitaire, Date, Référence du bon de livraison (BL), Magasinier responsable, Lot WBS de destination.
* **Modale "Nouveau Mouvement de Stock" :**
  * Type (Entrée / Sortie), Matériau, Unité (Sac, Tonne, m³, ml, Unité), Quantité, Prix unitaire, Date, N° de Bon de Livraison (BL), Nom du magasinier réceptionnaire, Lot de destination (si sortie).

---

## 11. Module 8 : Facturation & Décomptes Mensuels

### 11.1. Interface : Situations de Travaux (`/facturation`)
* **Composant Frontend :** `Facturation.jsx`
* **Rôles autorisés :** `directeur_general`, `directeur_technique`, `responsable_admin_fin`.
* **En-tête de la page :**
  * Titre : `Facturation`.
  * Sous-titre : `Situations de travaux (décomptes mensuels)`.
  * Sélecteur de projet.
* **Grille des 4 Cartes KPI Financières du Projet :**
  1. **Situations émises :** Nombre de décomptes générés à ce jour.
  2. **Total net à payer :** Cumul des montants nets exigibles auprès du client (FCFA).
  3. **Total encaissé :** Cumul des règlements effectivement reçus sur le compte bancaire de l'entreprise.
  4. **Restant à encaisser :** Créances clients restant dues.
* **Tableau des Décomptes Mensuels :**
  * Colonnes détaillées :
    1. **N° :** Numéro séquentiel de la situation (ex: `1`, `2`, `3`).
    2. **Mois :** Période couverte (format mois/année, ex: *Septembre 2026*).
    3. **Montant HT (situation) :** Valeur HT des travaux exécutés au cours du mois écoulé.
    4. **Avancement :** Pourcentage global d'avancement physique cumulé à cette date.
    5. **Retenue de garantie :** Déduction légale contractuelle de **5 %** calculée automatiquement.
    6. **TVA :** Taxe sur la valeur ajoutée sénégalaise de **18 %** calculée automatiquement.
    7. **Net à payer :** Montant final dû à l'entreprise :
       $$\text{Net à payer} = \text{Montant HT} - \text{Avance déduite} - \text{Retenue garantie (5\%)} + \text{TVA (18\%)} + \text{TCS (1\%)}$$
    8. **Statut :** Badge de statut (*Brouillon*, *Soumise*, *Validée*, *Payée*, *Rejetée*).
* **Modale "Nouvelle situation de travaux" :**
  * Numéro d'ordre de la situation.
  * Mois concerné (YYYY-MM).
  * Montant HT cumulé depuis l'ouverture du chantier.
  * Montant HT nouveau (travaux réalisés sur la période mensuelle).
  * Pourcentage d'avancement global certifié (%).

---

## 12. Module 9 : Administration des Utilisateurs

### 12.1. Interface : Gestion des Comptes et Rôles (`/admin/utilisateurs`)
* **Composant Frontend :** `Utilisateurs.jsx`
* **Rôles autorisés :** Strictement réservé au `directeur_general` et au `directeur_technique`.
* **En-tête de la page :**
  * Titre : `Utilisateurs`.
  * Sous-titre : `Gestion des comptes et des rôles d'accès à BATIPME-SN`.
  * Bouton d'action : `+ Nouvel utilisateur`.
* **Tableau de gestion des accès :**
  * Colonnes :
    1. **Nom & Prénom :** Identité complète du collaborateur.
    2. **Email :** Identifiant unique de connexion.
    3. **Rôle :** Badge coloré associé au rôle RBAC.
    4. **Poste :** Fonction officielle au sein de l'entreprise.
    5. **Téléphone :** Numéro de contact.
    6. **Statut :** Badge `Actif` (vert) ou `Désactivé` (rouge).
    7. **Action de désactivation :** Bouton corbeille réservé exclusivement au Directeur Général pour suspendre un accès sans détruire l'historique d'audit.
* **Modale "Nouvel utilisateur" :**
  * **Nom \*** & **Prénom \***.
  * **Email professionnel \***.
  * **Mot de passe temporaire \*** (au moins 8 caractères).
  * **Rôle dans l'application \*** :
    * *Directeur Général*, *Directeur Technique*, *Chef de Projet*, *Conducteur de Travaux*, *Responsable Admin. & Fin.*, *Magasinier*, *Maître d'Ouvrage (externe)*.
  * **Poste officiel**.
  * **Numéro de téléphone**.

---

## 13. Module 10 : Profil & Paramètres du Compte

### 13.1. Interface : Mon Profil (`/profil`)
* **Composant Frontend :** `Profil.jsx`
* **Rôles autorisés :** Tous les utilisateurs connectés.
* **Éléments de l'interface :**
  * **Gestion de la photo de profil :**
    * Clic sur l'avatar pour téléverser une photo.
    * Recadrage carré automatique au centre (300×300 pixels).
    * Compression JPEG en base64 pour un affichage instantané dans la Topbar.
    * Bouton corbeille pour supprimer la photo et revenir aux initiales colorées.
  * **Formulaire d'informations personnelles :**
    * Prénom & Nom.
    * Numéro de téléphone.
    * Poste occupé.
  * **Informations de sécurité (lecture seule) :**
    * Adresse email associée au compte.
    * Rôle officiel attribué par la direction.
  * Bouton `Enregistrer les modifications` avec notification toast de confirmation.

### 13.2. Interface : Paramètres de Sécurité (`/parametres`)
* **Composant Frontend :** `Parametres.jsx`
* **Rôles autorisés :** Tous les utilisateurs connectés.
* **Formulaire de changement de mot de passe :**
  * Champ `Mot de passe actuel *` (vérification bcrypt).
  * Champ `Nouveau mot de passe *` (sécurité renforcée, 8 caractères minimum).
  * Champ `Confirmer le nouveau mot de passe *` (vérification de correspondance).
  * Bouton `Changer le mot de passe` avec gestion des erreurs et validation instantanée.

---

## 14. Module 11 : Assistant IA & Veille Proactive

### 14.1. Interface : Assistant Conversationnel BTP (`/assistant`)
* **Composant Frontend :** `AssistantIA.jsx`
* **Rôles autorisés :** Tous les utilisateurs connectés.
* **Bandeau de contexte supérieur :**
  * Avatar robot animé.
  * **Sélecteur de contexte de données :** Permet de basculer l'IA entre :
    * `Tout le portefeuille` : L'IA analyse globalement l'ensemble des chantiers de l'entreprise.
    * `Un projet spécifique` : L'IA injecte les données détaillées du chantier sélectionné (tâches en retard, budget consommé, stock, incidents, météo).
  * Bouton `Effacer la conversation` pour réinitialiser le fil de discussion.
* **Bandeau indicateur :** Indique en temps réel la base de connaissances active fournie à l'IA.
* **Suggestions pré-configurées en un clic :**
  * *En contexte global :* "Vue portefeuille", "Documents à renouveler", "Réglementation BTP au Sénégal", "Modèle PV de réunion de chantier".
  * *En contexte projet :* "État d'avancement du projet", "Tâches en retard", "Rapport de chantier du jour", "Incidents HSE", "État des stocks matériaux", "Situation budgétaire et facturation".
* **Moteur d'Intelligence Artificielle Backend :**
  * Cascade de modèles LLM ultra-rapides (Groq API avec basculement automatique).
  * Règles d'or métier appliquées : Réponses toujours en français, chiffrées en FCFA, structurées en sections claires, orientées vers des recommandations concrètes d'ingénieurs travaux.

---

## 15. Dictionnaire Complet des Entités et de la Base de Données

| Table PostgreSQL | Entité TypeORM | Description Métier | Champs Clés & Types |
| :--- | :--- | :--- | :--- |
| `utilisateurs` | `Utilisateur` | Comptes des collaborateurs et rôles d'accès | `id`, `nom`, `prenom`, `email`, `motDePasse` (hash bcrypt), `role` (enum 7 rôles), `actif`, `telephone`, `poste`, `photo` (base64). |
| `projets` | `Projet` | Fiche d'identité contractuelle et technique des chantiers | `id`, `reference`, `intitule`, `description`, `typeMarche`, `typeProjet`, `region`, `commune`, `maitreOuvrage`, `maitreOeuvre`, `bureauEtudesTechniques`, `bureauControle`, `montantMarche` (decimal), `sourceFinancement`, `dateDemarrage`, `dureeContractuelleJours`, `statut` (enum). |
| `taches` | `Tache` | Découpage WBS et planning des opérations | `id`, `projet_id` (FK), `nom`, `description`, `lot` (enum WBS), `dateDebutPrevue`, `dateFinPrevue`, `dureeJours`, `pourcentageAvancement`, `statut`, `responsable`. |
| `jalons` | `Jalon` | Événements contractuels majeurs | `id`, `projet_id` (FK), `nom`, `type`, `datePrevu`, `atteint` (boolean). |
| `lignes_devis` | `LigneDevis` | Détail estimatif et sous-détail de prix | `id`, `projet_id` (FK), `rubrique` (enum 8 rubriques), `designation`, `unite`, `quantite`, `prixUnitaire`, `montantHT`. |
| `depenses` | `Depense` | Dépenses réelles et engagements financiers | `id`, `projet_id` (FK), `type` (engagement / réalisation), `categorie`, `montant`, `libelle`, `date`, `fournisseur`, `referenceFacture`. |
| `avenants` | `Avenant` | Modifications contractuelles de coût et délai | `id`, `projet_id` (FK), `numero`, `motif`, `montant`, `prolongationJours`, `statut`, `dateSignature`. |
| `personnel` | `Personnel` | Référentiel de la main-d'œuvre et ouvriers | `id`, `nom`, `prenom`, `poste`, `categorie`, `typeContrat`, `tauxJournalier`, `salaireMensuel`, `telephone`, `numeroCNI`, `numeroIPRES`, `numeroCSS`, `actif`. |
| `engins` | `Engin` | Parc de matériel et engins lourds | `id`, `designation`, `immatriculation`, `marque`, `modele`, `type` (propre/loué), `statut`, `tauxJournalier`, `kilometrage`. |
| `sous_traitants` | `SousTraitant` | Partenaires sous-traitants qualifiés | `id`, `nom`, `nomGerant`, `NINEA`, `RCCM`, `specialite`, `region`, `telephone`, `email`, `evaluation` (note /10). |
| `pointages` | `Pointage` | Suivi quotidien des présences sur site | `id`, `personnel_id` (FK), `projet_id` (FK), `date`, `statut` (présence), `heuresSupplementaires`, `montantJournalier`, `observations`. |
| `journaux_chantier` | `JournalChantier` | Rapport journalier officiel du chantier | `id`, `projet_id` (FK), `date`, `meteo` (enum), `temperature`, `nombreOuvriers`, `travauxRealises`, `materiaux_receptionnes`, `visitesDuJour`, `redige_par`. |
| `incidents` | `Incident` | Registre de sécurité et aléas HSE | `id`, `projet_id` (FK), `date`, `type`, `gravite` (faible à critique), `description`, `actionsCorrectives`, `declareCss` (booléen). |
| `photos_chantier` | `PhotoChantier` | Clichés géolocalisés de l'avancement | `id`, `projet_id` (FK), `titre`, `description`, `photoUrl` (base64 optimisée), `datePrise`, `categorie`, `zone`, `prisPar`. |
| `documents` | `Document` | Coffre-fort numérique des pièces du marché | `id`, `projet_id` (FK), `nom`, `type` (enum pièces BTP), `phase` (enum marché), `cheminFichier`, `version`, `dateExpiration`. |
| `fournisseurs` | `Fournisseur` | Référentiel des marchands de matériaux | `id`, `nom`, `NINEA`, `RCCM`, `specialite`, `region`, `telephone`, `email`, `contactPrincipal`. |
| `bons_commande` | `BonCommande` | Commandes d'achats et fournitures | `id`, `projet_id` (FK), `fournisseur_id` (FK), `date`, `montantTotal`, `statut`, `validePar`, `dateLivraisonPrevue`. |
| `mouvements_stock` | `MouvementStock` | Entrées et sorties de matériaux sur site | `id`, `projet_id` (FK), `type` (entree/sortie), `materiau`, `unite`, `quantite`, `prixUnitaire`, `date`, `referenceBonLivraison`, `responsable`, `lot`. |
| `situations_travaux` | `SituationTravaux` | Décomptes mensuels certifiés | `id`, `projet_id` (FK), `numero`, `mois`, `montantHTNouveau`, `montantHTCumul`, `retenueGarantie` (5%), `montantTVA` (18%), `netAPayer`, `statut`. |
| `ai_alertes` | `Alerte` | Alertes de diagnostic préventif générées par l'IA | `id`, `type`, `gravite`, `projetId`, `projetReference`, `message`, `lu` (booléen), `creeLe`. |
| `ai_conversations` | `Conversation` | Historique de mémoire de l'assistant IA | `id`, `userId`, `projetId`, `role` (user/assistant), `content`, `creeLe`. |

---
*Ce document est la référence technique et fonctionnelle officielle de la solution BATIPME-SN. Il peut être téléchargé, converti en PDF ou imprimé pour accompagner la formation des équipes de maîtrise d'œuvre et de direction de travaux.*
