# Démonstration BATIPME-SN

Données inventées (entreprise, personnes, chantiers) pour la soutenance.

## 1. Charger la démo dans la version en ligne

À faire **la veille de la soutenance** : les dates (retards, échéances, rapports) sont calculées à partir du jour du chargement.

1. Attendre que le backend soit à jour sur Render (dernier déploiement terminé).
2. Dans le terminal de VS Code :

   ```
   cd Backend-BTP
   node scripts/demo/charger-demo.mjs
   ```

3. Répondre aux questions :
   - adresse du serveur : appuyer sur Entrée (`https://smi-2026.onrender.com/api`) ;
   - e-mail et mot de passe du **Directeur général** en ligne (le mot de passe ne s'affiche pas) ;
   - « Supprimer ces chantiers de test ? » : `oui` pour ne garder que la démo.

Le chargement prend 2 à 3 minutes (le serveur se réveille, l'IA rédige les messages des clients et transcrit
deux notes vocales). Il peut être relancé : les chantiers de démo précédents sont remplacés, les comptes sont gardés.
Les notes vocales utilisent la voix française de Windows ; sur un autre système, elles sont ignorées.

## 2. Comptes

Mot de passe de tous les comptes de démo : **Demo2026!**

| Compte | Personne | Rôle | Voit |
|---|---|---|---|
| votre compte DG | — | Directeur général | tout |
| dt@btpdemo.sn | Ibrahima Faye | Directeur technique | tout |
| raf@btpdemo.sn | Fatou Sow | Responsable administratif et financier | tout (finances) |
| cp@btpdemo.sn | Cheikh Ndiaye | Chef de projet | les 3 chantiers |
| ct@btpdemo.sn | Awa Diop | Conductrice de travaux | villa et immeuble |
| mag@btpdemo.sn | Ousseynou Ba | Magasinier | villa |
| client@btpdemo.sn | Mamadou Kane | Client (propriétaire de la villa) | sa villa seulement |

## 3. Ce qui est chargé

- **DEMO-VIL-014 — Villa R+2, Famille Kane (Mbao)**, en cours, 110 448 000 FCFA :
  12 tâches (vertes, orange, une rouge), 4 jalons, devis estimé par l'IA (300 m² standard), 5 dépenses,
  4 échéances dont une **en retard de 7 089 600 FCFA**, 6 documents (4 partagés avec le client, 2 internes,
  une caution qui expire dans 10 jours), 6 ouvriers pointés, 3 rapports validés avec leur message client,
  **2 notes vocales du jour** (la 2e signale une panne de bétonnière → alerte), rapport du jour **pas encore validé**.
- **DEMO-IMM-009 — Immeuble de bureaux R+4 (Plateau)**, en cours, 420 000 000 FCFA.
- **DEMO-ECO-003 — École de 6 classes (Thiès)**, marché public, en préparation, 95 000 000 FCFA.
- Engins : bétonnière (villa), pelle mécanique, camion benne (immeuble), grue en maintenance.

## 4. Déroulé de la démonstration (10 minutes)

Astuce : le rapport du jour n'est visible par le client qu'à partir de l'heure de publication (18:00).
Pour le montrer pendant une soutenance en journée, mettre l'heure à 08:00 dans **Administration** avant de commencer.

| # | Durée | Compte | Ce qu'on montre | Ce qu'on dit |
|---|---|---|---|---|
| 1 | 1 min | **ct@** sur téléphone | Accueil → **Parler** sur la villa : onglet voix, les 2 notes du jour, la 2e en rouge | « La conductrice ne tape rien : elle parle. L'IA a repéré un problème et a prévenu le chef de projet et la direction. » |
| 2 | 1 min | ct@ | Toucher le micro, dicter : « Le coffrage de la dalle est terminé, il reste le ferraillage. » | La note apparaît, transcrite. |
| 3 | 2 min | ct@ | **Rédiger le rapport** → l'IA remplit travaux / reste à faire / problèmes → corriger un champ → **Valider** | « L'IA propose, l'humain valide. Rien ne part au client sans relecture. » |
| 4 | 1 min | **DG** | Accueil : bloc **À traiter** (bétonnière, impayé, caution, retard) → clic sur l'alerte de la bétonnière | « La direction est prévenue sans appeler personne. » |
| 5 | 1 min | DG | Villa → **Planning** : rouge, orange, vert, avec l'explication | Réponse à la demande d'un planning en couleurs. |
| 6 | 1 min | DG | **Assistant IA** → **Mode vocal** → micro : « Quels problèmes ont été signalés aujourd'hui sur la villa ? » | La réponse est lue à voix haute. |
| 7 | 1 min | DG | Villa → **Budget** → **Estimer avec l'IA** : « Villa R+1 de 200 m² à Saly, haut standing » | « L'IA comprend la phrase ; les prix sont ceux de l'entreprise (Administration). » |
| 8 | 1 min | DG | Immeuble → **Équipe & ressources** → Pointage de **Moussa Sarr** aujourd'hui | Conflit : il est déjà pointé sur la villa. |
| 9 | 1 min | **client@** | Accueil : message du jour en langage simple, paiements, retard, étapes terminées ; Documents : seulement les partagés | « Le client suit son chantier sans appeler le chef de projet. » |

En option : mode avion sur le téléphone, dicter une note (« en attente »), remettre le réseau → elle se transcrit.
