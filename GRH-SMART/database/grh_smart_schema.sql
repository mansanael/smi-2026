-- =====================================================================
-- GRH-SMART v1.0 — Schéma de base de données MySQL
-- Application de Gestion des Ressources Humaines
-- Projet de fin d'année — Licence 3 Informatique de Gestion
-- Compatible MySQL 8.0+ / MySQL Workbench
-- =====================================================================

DROP DATABASE IF EXISTS grh_smart;
CREATE DATABASE grh_smart
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE grh_smart;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
-- 1. DEPARTEMENT
-- =====================================================================
CREATE TABLE departements (
    id_dept         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code_dept       VARCHAR(10)     NOT NULL UNIQUE,
    nom             VARCHAR(100)    NOT NULL,
    responsable     VARCHAR(150),
    centre_cout     VARCHAR(50),
    date_creation   DATE            NOT NULL DEFAULT (CURRENT_DATE),
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Départements de l''organisation';

-- =====================================================================
-- 2. POSTE (référentiel des postes/fonctions)
-- =====================================================================
CREATE TABLE postes (
    id_poste            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    intitule            VARCHAR(100)    NOT NULL,
    categorie_pro       ENUM('Ouvrier','Employé','Agent de maîtrise','Cadre','Cadre supérieur')
                                         NOT NULL,
    id_dept             INT UNSIGNED,
    salaire_min         DECIMAL(12,2)   NOT NULL DEFAULT 0,
    salaire_max         DECIMAL(12,2),
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_poste_dept FOREIGN KEY (id_dept)
        REFERENCES departements(id_dept)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Référentiel des postes';

-- =====================================================================
-- 3. UTILISATEUR (comptes applicatifs / authentification)
-- =====================================================================
CREATE TABLE utilisateurs (
    id_utilisateur   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email            VARCHAR(150)    NOT NULL UNIQUE,
    mot_de_passe     VARCHAR(255)    NOT NULL COMMENT 'Hash bcrypt',
    role             ENUM('ADMIN_SYS','RESPONSABLE_RH','RESPONSABLE_SERVICE','DIRECTION')
                                     NOT NULL,
    id_employe       VARCHAR(20)     NULL COMMENT 'FK vers employes.matricule, ajoutée après création de employes',
    mfa_active       TINYINT(1)      NOT NULL DEFAULT 0,
    mfa_secret       VARCHAR(255)    NULL,
    dernier_login    DATETIME        NULL,
    compte_actif     TINYINT(1)      NOT NULL DEFAULT 1,
    date_expiration_mdp DATE         NULL COMMENT 'Rotation mdp tous les 90 jours',
    created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                      ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Comptes utilisateurs et droits d''accès';

-- =====================================================================
-- 4. EMPLOYE
-- =====================================================================
CREATE TABLE employes (
    matricule        VARCHAR(20)     PRIMARY KEY
                                      COMMENT 'Format EMP-[DEPT]-[ANNEE]-[SEQUENCE]',
    nom              VARCHAR(100)    NOT NULL,
    prenom           VARCHAR(100)    NOT NULL,
    date_naissance   DATE            NOT NULL,
    nationalite      VARCHAR(60)     NOT NULL,
    genre            ENUM('M','F','Autre') NOT NULL,
    situation_matrimoniale ENUM('Célibataire','Marié(e)','Divorcé(e)','Veuf(ve)') NOT NULL,

    -- Contact
    telephone        VARCHAR(30)     NOT NULL,
    email_pro        VARCHAR(150)    NOT NULL UNIQUE,
    adresse          VARCHAR(255)    NOT NULL,

    -- Emploi
    id_poste         INT UNSIGNED    NOT NULL,
    id_dept          INT UNSIGNED    NOT NULL,
    date_embauche    DATE            NOT NULL,

    -- Rémunération
    salaire_brut     DECIMAL(12,2)   NOT NULL,
    mode_paiement    ENUM('Virement','Chèque','Espèces') NOT NULL DEFAULT 'Virement',

    -- Administratif (données sensibles — chiffrement applicatif recommandé AES-256)
    num_cin_passeport   VARCHAR(50)  NOT NULL,
    num_secu_sociale    VARCHAR(50)  NOT NULL,
    rib_bancaire        VARCHAR(50)  NOT NULL,

    -- Statut / cycle de vie
    statut           ENUM('Actif','Suspendu','Archivé') NOT NULL DEFAULT 'Actif',
    date_sortie      DATE            NULL,
    type_depart      ENUM('Démission','Licenciement','Retraite','Fin de contrat','Décès') NULL,
    motif_depart     TEXT            NULL,

    created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                      ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_employe_poste FOREIGN KEY (id_poste)
        REFERENCES postes(id_poste) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_employe_dept FOREIGN KEY (id_dept)
        REFERENCES departements(id_dept) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_salaire_positif CHECK (salaire_brut >= 0)
) ENGINE=InnoDB COMMENT='Dossier central de chaque employé (Module 1)';

-- Ajout de la FK utilisateurs -> employes maintenant que la table existe
ALTER TABLE utilisateurs
    ADD CONSTRAINT fk_utilisateur_employe FOREIGN KEY (id_employe)
        REFERENCES employes(matricule) ON DELETE SET NULL ON UPDATE CASCADE;

-- Table de rattachement Responsable de Service -> Employés de son équipe
CREATE TABLE responsable_equipe (
    id_utilisateur   INT UNSIGNED NOT NULL,
    matricule        VARCHAR(20)  NOT NULL,
    PRIMARY KEY (id_utilisateur, matricule),
    CONSTRAINT fk_re_utilisateur FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT fk_re_employe FOREIGN KEY (matricule)
        REFERENCES employes(matricule) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Périmètre d''équipe supervisée par un Responsable de Service';

-- =====================================================================
-- 5. CONTRAT
-- =====================================================================
CREATE TABLE contrats (
    id_contrat       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    matricule        VARCHAR(20)     NOT NULL,
    type_contrat     ENUM('CDI','CDD','Intérim','Alternance','Stage') NOT NULL,
    date_debut       DATE            NOT NULL,
    date_fin         DATE            NULL COMMENT 'NULL pour un CDI',
    periode_essai_fin DATE           NULL,
    salaire_brut     DECIMAL(12,2)   NOT NULL,
    id_poste         INT UNSIGNED    NOT NULL,
    statut           ENUM('Actif','Terminé','Rompu','Renouvelé') NOT NULL DEFAULT 'Actif',
    document_signe   TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Signature électronique effectuée',
    created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                      ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_contrat_employe FOREIGN KEY (matricule)
        REFERENCES employes(matricule) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_contrat_poste FOREIGN KEY (id_poste)
        REFERENCES postes(id_poste) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_dates_contrat CHECK (date_fin IS NULL OR date_fin >= date_debut)
) ENGINE=InnoDB COMMENT='Historique des contrats et avenants (Module 1 / 3)';

-- =====================================================================
-- 6. BULLETIN DE PAIE
-- =====================================================================
CREATE TABLE bulletins_paie (
    id_bulletin      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    matricule        VARCHAR(20)     NOT NULL,
    periode_mois     TINYINT UNSIGNED NOT NULL COMMENT '1-12',
    periode_annee    SMALLINT UNSIGNED NOT NULL,

    -- Cumuls
    salaire_brut     DECIMAL(12,2)   NOT NULL DEFAULT 0,
    total_cotisations_salariales DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_irpp       DECIMAL(12,2)   NOT NULL DEFAULT 0,
    total_cotisations_patronales DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_a_payer      DECIMAL(12,2)   NOT NULL DEFAULT 0,

    mode_paiement    ENUM('Virement','Chèque','Espèces') NOT NULL DEFAULT 'Virement',
    date_paiement    DATE            NULL,
    statut           ENUM('Brouillon','Validé','Transmis','Payé') NOT NULL DEFAULT 'Brouillon',
    valide_par       INT UNSIGNED    NULL COMMENT 'id_utilisateur du responsable paie',
    chemin_pdf       VARCHAR(255)    NULL COMMENT 'Emplacement du PDF/A archivé',

    created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                      ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_bulletin_employe FOREIGN KEY (matricule)
        REFERENCES employes(matricule) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_bulletin_validateur FOREIGN KEY (valide_par)
        REFERENCES utilisateurs(id_utilisateur) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT uq_bulletin_periode UNIQUE (matricule, periode_mois, periode_annee)
) ENGINE=InnoDB COMMENT='En-tête du bulletin de paie (Module 2)';

-- Lignes de rémunération du bulletin (rubriques 1000-3000 du CDC)
CREATE TABLE lignes_bulletin_paie (
    id_ligne         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_bulletin      INT UNSIGNED    NOT NULL,
    code_rubrique    VARCHAR(4)      NOT NULL COMMENT 'Ex: 1000, 1100, 2100...',
    designation      VARCHAR(100)    NOT NULL,
    base_calcul      VARCHAR(150)    NULL,
    montant          DECIMAL(12,2)   NOT NULL,
    type_ligne       ENUM('Gain','Cotisation','Impôt','Résultat') NOT NULL,
    CONSTRAINT fk_ligne_bulletin FOREIGN KEY (id_bulletin)
        REFERENCES bulletins_paie(id_bulletin) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Détail des rubriques d''un bulletin de paie';

-- =====================================================================
-- 7. DOCUMENT (dossier employé / GED)
-- =====================================================================
CREATE TABLE documents (
    id_doc           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    matricule        VARCHAR(20)     NOT NULL,
    section          ENUM('Identité & Civil','Recrutement','Contrats','Formation',
                           'Évaluations','Paie & Social','Disciplinaire',
                           'Santé & Sécurité','Congés & Absences') NOT NULL,
    type_doc         VARCHAR(100)    NOT NULL,
    nom_fichier      VARCHAR(255)    NOT NULL,
    chemin_fichier   VARCHAR(255)    NOT NULL,
    format_fichier   ENUM('PDF','DOCX','XLSX','JPEG','PNG') NOT NULL,
    taille_ko        INT UNSIGNED    NOT NULL COMMENT 'Max 10 Mo = 10240 Ko',
    version          INT UNSIGNED    NOT NULL DEFAULT 1,
    id_doc_precedent INT UNSIGNED    NULL COMMENT 'Chaînage des versions',
    date_depot       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_expiration_retention DATE   NULL COMMENT 'Calculée selon la durée légale de rétention',
    depose_par       INT UNSIGNED    NULL,

    CONSTRAINT fk_doc_employe FOREIGN KEY (matricule)
        REFERENCES employes(matricule) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_doc_precedent FOREIGN KEY (id_doc_precedent)
        REFERENCES documents(id_doc) ON DELETE SET NULL,
    CONSTRAINT fk_doc_utilisateur FOREIGN KEY (depose_par)
        REFERENCES utilisateurs(id_utilisateur) ON DELETE SET NULL,
    CONSTRAINT chk_taille_max CHECK (taille_ko <= 10240)
) ENGINE=InnoDB COMMENT='Gestion électronique des documents du dossier employé (Module 3)';

-- =====================================================================
-- 8. ABSENCE
-- =====================================================================
CREATE TABLE absences (
    id_absence       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    matricule        VARCHAR(20)     NOT NULL,
    type_absence     ENUM('Congé payé','Maladie','RTT','Sans solde','Maternité/Paternité',
                           'Accident de travail','Autre') NOT NULL,
    date_debut       DATE            NOT NULL,
    date_fin         DATE            NOT NULL,
    nb_jours         DECIMAL(5,1)    NOT NULL,
    motif            VARCHAR(255)    NULL,
    justificatif_doc INT UNSIGNED    NULL,
    statut_validation ENUM('En attente','Validée','Refusée') NOT NULL DEFAULT 'En attente',
    valide_par       INT UNSIGNED    NULL,
    created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_absence_employe FOREIGN KEY (matricule)
        REFERENCES employes(matricule) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_absence_doc FOREIGN KEY (justificatif_doc)
        REFERENCES documents(id_doc) ON DELETE SET NULL,
    CONSTRAINT fk_absence_validateur FOREIGN KEY (valide_par)
        REFERENCES utilisateurs(id_utilisateur) ON DELETE SET NULL,
    CONSTRAINT chk_dates_absence CHECK (date_fin >= date_debut)
) ENGINE=InnoDB COMMENT='Congés et absences (Module 1 / 5)';

-- =====================================================================
-- 9. AUDIT_LOG (traçabilité globale)
-- =====================================================================
CREATE TABLE audit_log (
    id_log           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur   INT UNSIGNED    NULL,
    action           ENUM('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT','CONSULTATION')
                                     NOT NULL,
    table_cible      VARCHAR(100)    NOT NULL,
    cle_cible        VARCHAR(50)     NULL COMMENT 'PK de l''enregistrement concerné',
    valeurs_avant    JSON            NULL,
    valeurs_apres    JSON            NULL,
    horodatage       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    adresse_ip       VARCHAR(45)     NULL COMMENT 'IPv4 ou IPv6',

    CONSTRAINT fk_log_utilisateur FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateurs(id_utilisateur) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Journal d''audit de toutes les actions sensibles';

-- =====================================================================
-- 10. RECHERCHE IA (Module 4 — historique des requêtes en langage naturel)
-- =====================================================================
CREATE TABLE recherches_ia (
    id_recherche     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur   INT UNSIGNED    NOT NULL,
    requete_texte    TEXT            NOT NULL,
    requete_interpretee JSON         NULL COMMENT 'Filtres structurés générés par le NLP',
    nb_resultats     INT UNSIGNED    NOT NULL DEFAULT 0,
    temps_reponse_ms INT UNSIGNED    NULL,
    horodatage       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_recherche_utilisateur FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Historique des recherches en langage naturel (limité aux 20 dernières par utilisateur côté applicatif)';

-- =====================================================================
-- 11. ALERTE (Module 5 — audit social / seuils configurables)
-- =====================================================================
CREATE TABLE alertes_configuration (
    id_alerte_config INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    indicateur       VARCHAR(100)    NOT NULL COMMENT 'Ex: Taux absentéisme, Écart salarial H/F',
    axe_audit        ENUM('Égalité professionnelle','Conditions de travail','Absentéisme',
                           'Turn-over','Formation','Conformité légale','Climat social')
                                     NOT NULL,
    seuil_valeur     DECIMAL(10,2)   NOT NULL,
    seuil_operateur  ENUM('>','>=','<','<=','=') NOT NULL DEFAULT '>',
    actif            TINYINT(1)      NOT NULL DEFAULT 1,
    created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Seuils configurables déclenchant les alertes du tableau de bord';

CREATE TABLE alertes_declenchees (
    id_alerte        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_alerte_config INT UNSIGNED    NOT NULL,
    id_dept          INT UNSIGNED    NULL,
    valeur_mesuree   DECIMAL(10,2)   NOT NULL,
    niveau_criticite ENUM('Rouge','Orange','Vert') NOT NULL,
    statut           ENUM('Active','Traitée','Ignorée') NOT NULL DEFAULT 'Active',
    action_corrective TEXT           NULL,
    date_declenchement DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_resolution  DATETIME        NULL,

    CONSTRAINT fk_alerte_config FOREIGN KEY (id_alerte_config)
        REFERENCES alertes_configuration(id_alerte_config) ON DELETE CASCADE,
    CONSTRAINT fk_alerte_dept FOREIGN KEY (id_dept)
        REFERENCES departements(id_dept) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Historique des alertes déclenchées';

-- =====================================================================
-- INDEX complémentaires pour la performance (Exigences non fonctionnelles §8.1)
-- =====================================================================
CREATE INDEX idx_employe_dept        ON employes(id_dept);
CREATE INDEX idx_employe_statut      ON employes(statut);
CREATE INDEX idx_employe_nom_prenom  ON employes(nom, prenom);
CREATE INDEX idx_contrat_employe     ON contrats(matricule);
CREATE INDEX idx_contrat_type_statut ON contrats(type_contrat, statut);
CREATE INDEX idx_bulletin_periode    ON bulletins_paie(periode_annee, periode_mois);
CREATE INDEX idx_document_employe    ON documents(matricule);
CREATE INDEX idx_document_section    ON documents(section);
CREATE INDEX idx_absence_employe     ON absences(matricule);
CREATE INDEX idx_absence_periode     ON absences(date_debut, date_fin);
CREATE INDEX idx_audit_table_cible   ON audit_log(table_cible, cle_cible);
CREATE INDEX idx_audit_horodatage    ON audit_log(horodatage);

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- DONNEES DE REFERENCE MINIMALES (pour tester le schéma dans Workbench)
-- =====================================================================
INSERT INTO departements (code_dept, nom, responsable, centre_cout) VALUES
('RH',  'Ressources Humaines', 'À définir', 'CC-RH-01'),
('COM', 'Commercial',          'À définir', 'CC-COM-01'),
('IT',  'Informatique',        'À définir', 'CC-IT-01'),
('FIN', 'Finance & Comptabilité', 'À définir', 'CC-FIN-01');

INSERT INTO postes (intitule, categorie_pro, id_dept, salaire_min, salaire_max) VALUES
('Chargé RH',            'Employé', 1, 300000, 600000),
('Commercial',           'Employé', 2, 250000, 700000),
('Développeur Backend',  'Cadre',   3, 500000, 1200000),
('Comptable',            'Employé', 4, 300000, 650000);

INSERT INTO utilisateurs (email, mot_de_passe, role, mfa_active, compte_actif) VALUES
('admin@grh-smart.local',    '$2y$10$hashDeDemoAAdmin', 'ADMIN_SYS',        1, 1),
('rh@grh-smart.local',       '$2y$10$hashDeDemoRH',      'RESPONSABLE_RH',   1, 1),
('direction@grh-smart.local','$2y$10$hashDeDemoDir',     'DIRECTION',        0, 1);

-- =====================================================================
-- FIN DU SCRIPT
-- =====================================================================
