#!/usr/bin/env node
/**
 * Données de démonstration BATIPME-SN (noms inventés) pour la soutenance.
 *
 *   node scripts/demo/charger-demo.mjs
 *
 * Le programme demande l'adresse du serveur, l'e-mail et le mot de passe d'un compte Directeur général,
 * affiche les chantiers existants et demande avant de supprimer les chantiers de test.
 * Il peut être relancé (par exemple la veille de la soutenance) : les dates sont calculées à partir du jour
 * de lancement, et les chantiers de démo précédents sont remplacés.
 *
 * Sans questions (tests) : API_URL, DEMO_EMAIL, DEMO_MOT_DE_PASSE et --oui (supprime les autres chantiers).
 */
import { platform } from 'node:process';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { appel, connexionDirecteur, demander, oui, rl } from './commun.mjs';

const MOT_DE_PASSE_DEMO = 'Demo2026!';
const AUTO = process.argv.includes('--oui');

// ─── Dates relatives au jour de lancement ────────────────────────────────────
const jour = (decalage) => new Date(Date.now() + decalage * 86400000).toISOString().slice(0, 10);
const instant = (decalage, heure) => `${jour(decalage)}T${heure}:00.000Z`;

const etape = (texte) => console.log(`\n▸ ${texte}`);

// ─── Le contenu de la démo ───────────────────────────────────────────────────
const EQUIPE = [
  { cle: 'dt', prenom: 'Ibrahima', nom: 'Faye', role: 'directeur_technique', poste: 'Directeur technique' },
  { cle: 'raf', prenom: 'Fatou', nom: 'Sow', role: 'responsable_admin_fin', poste: 'Responsable administratif et financier' },
  { cle: 'cp', prenom: 'Cheikh', nom: 'Ndiaye', role: 'chef_projet', poste: 'Chef de projet' },
  { cle: 'ct', prenom: 'Awa', nom: 'Diop', role: 'conducteur_travaux', poste: 'Conductrice de travaux' },
  { cle: 'mag', prenom: 'Ousseynou', nom: 'Ba', role: 'magasinier', poste: 'Magasinier' },
  { cle: 'client', prenom: 'Mamadou', nom: 'Kane', role: 'maitre_ouvrage_externe', poste: 'Propriétaire (client)' },
];
const email = (cle) => `${cle}@btpdemo.sn`;

const CHANTIERS = {
  villa: {
    reference: 'DEMO-VIL-014', intitule: 'Villa R+2 — Famille Kane', typeMarche: 'prive', typeProjet: 'batiment_residentiel',
    region: 'Dakar', commune: 'Mbao', maitreOuvrage: 'Mamadou Kane', maitreOeuvre: 'Cabinet Archi Teranga',
    bureauControle: 'Bureau de contrôle Sénégal', montantMarche: 110448000, sourceFinancement: 'Fonds propres et prêt bancaire',
    dateDemarrage: jour(-75), dureeContractuelleJours: 300, numeroMarche: 'BTPD-2026-014', statut: 'en_cours',
    description: 'Villa familiale R+2 de 300 m², finition standard : 4 chambres, salon, terrasse en toiture.',
  },
  immeuble: {
    reference: 'DEMO-IMM-009', intitule: 'Immeuble de bureaux R+4 — Plateau', typeMarche: 'prive', typeProjet: 'batiment_administratif',
    region: 'Dakar', commune: 'Dakar Plateau', maitreOuvrage: 'SCI Les Almadies', montantMarche: 420000000,
    sourceFinancement: 'Fonds propres', dateDemarrage: jour(-140), dureeContractuelleJours: 420, statut: 'en_cours',
    description: 'Immeuble de bureaux R+4 de 1 000 m² avec parking en sous-sol.',
  },
  ecole: {
    reference: 'DEMO-ECO-003', intitule: 'Construction d’une école de 6 classes', typeMarche: 'public', typeProjet: 'batiment_administratif',
    region: 'Thiès', commune: 'Thiès Nord', maitreOuvrage: 'Commune de Thiès Nord', montantMarche: 95000000,
    sourceFinancement: 'Budget communal', dateDemarrage: jour(12), dureeContractuelleJours: 180, statut: 'en_preparation',
    modePassation: 'Appel d’offres ouvert', referenceAppelOffres: 'AO-TN-2026-07',
    description: 'Six salles de classe, un bloc administratif et des sanitaires.',
  },
};
const REFERENCES_DEMO = Object.values(CHANTIERS).map((c) => c.reference);

const t = (nom, lot, debut, fin, statut, pourcentageAvancement, responsable) => ({
  nom, lot, dateDebutPrevue: jour(debut), dateFinPrevue: jour(fin), statut, pourcentageAvancement, responsable,
  // Les tâches déjà faites ont commencé et fini aux dates prévues (sinon le serveur mettrait la date du jour)
  ...(debut <= 0 && pourcentageAvancement > 0 ? { dateDebutReelle: jour(debut) } : {}),
  ...(statut === 'terminee' ? { dateFinReelle: jour(fin) } : {}),
});

const TACHES = {
  villa: [
    t('Installation de chantier', 'installation_chantier', -75, -70, 'terminee', 100, 'Awa Diop'),
    t('Terrassement et fouilles', 'terrassement', -70, -60, 'terminee', 100, 'Awa Diop'),
    t('Fondations et longrines', 'fondations', -60, -45, 'terminee', 100, 'Awa Diop'),
    t('Élévation des murs du rez-de-chaussée', 'gros_oeuvre', -45, -30, 'terminee', 100, 'Awa Diop'),
    t('Dalle haute du rez-de-chaussée', 'gros_oeuvre', -30, -18, 'terminee', 100, 'Awa Diop'),
    t('Élévation des murs du 1er étage', 'gros_oeuvre', -18, 8, 'en_cours', 70, 'Awa Diop'),
    t('Dalle haute du 1er étage', 'gros_oeuvre', -8, 12, 'en_cours', 15, 'Awa Diop'),
    t('Ferraillage des poteaux du 2e étage', 'gros_oeuvre', -15, -3, 'en_cours', 60, 'Awa Diop'),
    t('Étanchéité de la toiture-terrasse', 'charpente_couverture', 25, 35, 'a_faire', 0, 'Sous-traitant étanchéité'),
    t('Plomberie et sanitaires', 'plomberie_sanitaire', 40, 70, 'a_faire', 0, 'Sous-traitant plomberie'),
    t('Électricité', 'electricite', 40, 70, 'a_faire', 0, 'Sous-traitant électricité'),
    t('Carrelage et faïence', 'revetements', 75, 110, 'a_faire', 0, 'Awa Diop'),
  ],
  immeuble: [
    t('Terrassement et sous-sol', 'terrassement', -140, -110, 'terminee', 100, 'Awa Diop'),
    t('Fondations sur radier', 'fondations', -110, -85, 'terminee', 100, 'Awa Diop'),
    t('Structure du rez-de-chaussée au R+2', 'gros_oeuvre', -85, -20, 'terminee', 100, 'Awa Diop'),
    t('Structure du R+3 et du R+4', 'gros_oeuvre', -20, 30, 'en_cours', 45, 'Awa Diop'),
    t('Façades et menuiseries aluminium', 'menuiseries', 35, 90, 'a_faire', 0, 'Sous-traitant menuiserie'),
  ],
  ecole: [
    t('Installation de chantier', 'installation_chantier', 12, 16, 'a_faire', 0, 'Cheikh Ndiaye'),
    t('Fondations des 6 classes', 'fondations', 16, 40, 'a_faire', 0, 'Cheikh Ndiaye'),
    t('Élévation et toiture', 'gros_oeuvre', 40, 110, 'a_faire', 0, 'Cheikh Ndiaye'),
  ],
};

const JALONS = {
  villa: [
    { nom: 'Ordre de service de démarrage', type: 'demarrage', datePrevu: jour(-75), dateReel: jour(-75), atteint: true },
    { nom: 'Fondations terminées', type: 'fondations', datePrevu: jour(-45), dateReel: jour(-44), atteint: true },
    { nom: 'Fin du gros œuvre (hors d’eau)', type: 'hors_d_eau', datePrevu: jour(30), atteint: false },
    { nom: 'Réception provisoire', type: 'reception_provisoire', datePrevu: jour(225), atteint: false },
  ],
  immeuble: [{ nom: 'Structure terminée', type: 'jalon_technique', datePrevu: jour(30), atteint: false }],
  ecole: [{ nom: 'Ordre de service de démarrage', type: 'demarrage', datePrevu: jour(12), atteint: false }],
};

// Rapports déjà validés (le message du client est rédigé par l'IA à l'enregistrement)
const RAPPORTS_VILLA = [
  {
    date: jour(-3), meteo: 'ensoleille', temperature: 33, nombreOuvriers: 12, genereParIa: true,
    travauxRealises: '- Coulage du béton des poteaux du 1er étage\n- Pose des agglos du mur de façade',
    resteAFaire: '- Finir les murs du 1er étage\n- Préparer le coffrage de la dalle',
    materiaux_receptionnes: '- 80 sacs de ciment\n- 2 tonnes de fer de 10',
  },
  {
    date: jour(-2), meteo: 'harmattan', temperature: 29, nombreOuvriers: 14, genereParIa: true,
    travauxRealises: '- Murs du 1er étage montés à 70 %\n- Début du coffrage de la dalle haute',
    resteAFaire: '- Ferraillage de la dalle\n- Ferraillage des poteaux du 2e étage',
    problemes: '- Livraison de sable retardée d’une demi-journée',
    visitesDuJour: '- Maître d’œuvre (Cabinet Archi Teranga)',
  },
  {
    date: jour(-1), meteo: 'ensoleille', temperature: 34, nombreOuvriers: 13, genereParIa: true,
    travauxRealises: '- Coffrage de la dalle haute du 1er étage terminé sur la moitié de la surface\n- Ferraillage des poteaux du 2e étage commencé',
    resteAFaire: '- Terminer le coffrage\n- Ferraillage de la dalle avant le coulage',
    visitesDuJour: '- Bureau de contrôle pour vérifier le ferraillage',
  },
];

// Notes vocales du jour (vraie voix de synthèse, vraie transcription) : la 2e déclenche une alerte
const NOTES_DU_JOUR = [
  { heure: '09:15', texte: 'Ce matin nous avons commencé le ferraillage de la dalle du premier étage avec treize ouvriers. Temps ensoleillé. Nous avons reçu cinquante sacs de ciment.' },
  { heure: '15:40', texte: 'Attention, la bétonnière est tombée en panne cet après-midi et il manque vingt sacs de ciment pour finir les poteaux du deuxième étage. Demain il faut couler la dalle si la bétonnière est réparée.' },
];

const PERSONNEL = [
  { prenom: 'Moussa', nom: 'Sarr', poste: 'Chef d’équipe maçon', categorie: 'encadrement', typeContrat: 'cdi', salaireMensuel: 350000 },
  { prenom: 'Lamine', nom: 'Gueye', poste: 'Maçon', categorie: 'ouvrier_qualifie', typeContrat: 'journalier', tauxJournalier: 9000 },
  { prenom: 'Aliou', nom: 'Fall', poste: 'Ferrailleur', categorie: 'ouvrier_qualifie', typeContrat: 'journalier', tauxJournalier: 9000 },
  { prenom: 'Pape', nom: 'Mbaye', poste: 'Coffreur', categorie: 'ouvrier_qualifie', typeContrat: 'journalier', tauxJournalier: 8500 },
  { prenom: 'Babacar', nom: 'Thiam', poste: 'Manœuvre', categorie: 'manoeuvre', typeContrat: 'journalier', tauxJournalier: 5000 },
  { prenom: 'Modou', nom: 'Seck', poste: 'Manœuvre', categorie: 'manoeuvre', typeContrat: 'journalier', tauxJournalier: 5000 },
];

const ENGINS = [
  { designation: 'Bétonnière 350 L', immatriculation: 'BTN-02', type: 'propre', statut: 'en_service', tauxJournalier: 15000 },
  { designation: 'Pelle mécanique', immatriculation: 'DK-4521-BB', type: 'loue', statut: 'disponible', tauxJournalier: 250000, fournisseurLocation: 'Loc’Engins Dakar' },
  { designation: 'Camion benne 20 t', immatriculation: 'DK-7310-AE', type: 'propre', statut: 'en_service', tauxJournalier: 90000 },
  { designation: 'Grue à tour', immatriculation: 'GRU-01', type: 'propre', statut: 'en_maintenance', tauxJournalier: 180000 },
];

// Voix de synthèse française de Windows (pour de vraies notes vocales) ; ailleurs, les notes sont ignorées
function enregistrerNotes() {
  if (platform !== 'win32') return null;
  const dossier = mkdtempSync(join(tmpdir(), 'batipme-demo-'));
  try {
    const lignes = NOTES_DU_JOUR.map((n, i) => {
      const fichier = join(dossier, `note-${i}.wav`).replace(/'/g, "''");
      const texte = n.texte.replace(/'/g, "''");
      return `$s = New-Object System.Speech.Synthesis.SpeechSynthesizer; ` +
        `try { $s.SelectVoice(($s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -like 'fr*' } | Select-Object -First 1).VoiceInfo.Name) } catch {}; ` +
        `$s.SetOutputToWaveFile('${fichier}'); $s.Speak('${texte}'); $s.Dispose();`;
    });
    execFileSync('powershell', ['-NoProfile', '-Command', `Add-Type -AssemblyName System.Speech; ${lignes.join(' ')}`], { stdio: 'ignore' });
    return NOTES_DU_JOUR.map((n, i) => ({ ...n, audio: readFileSync(join(dossier, `note-${i}.wav`)).toString('base64') }));
  } catch {
    return null;
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
}

// ─── Déroulé ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('Chargement des données de démonstration BATIPME-SN (noms inventés)\n');
  await connexionDirecteur();

  // 1. Chantiers existants : ceux de la démo précédente sont remplacés, les autres seulement avec accord
  etape('Chantiers existants');
  const existants = await appel('GET', '/projets');
  const anciensDemo = existants.filter((p) => REFERENCES_DEMO.includes(p.reference));
  const autres = existants.filter((p) => !REFERENCES_DEMO.includes(p.reference));
  autres.forEach((p) => console.log(`   • ${p.reference} — ${p.intitule}`));
  if (autres.length === 0) console.log('   (aucun chantier de test)');
  let supprimerAutres = false;
  if (autres.length) {
    supprimerAutres = AUTO || oui(await demander(`Supprimer ces ${autres.length} chantier(s) de test et leurs données ? (oui/non)`, 'non'));
  }
  for (const p of [...anciensDemo, ...(supprimerAutres ? autres : [])]) {
    await appel('DELETE', `/projets/${p.id}`);
    console.log(`   supprimé : ${p.reference}`);
  }
  // Les alertes des chantiers supprimés n'ont plus de sens ; l'analyse en fin de chargement les recrée
  await appel('DELETE', '/ai/alertes');

  // 2. Comptes de démonstration (gardés s'ils existent déjà)
  etape(`Comptes de démonstration (mot de passe : ${MOT_DE_PASSE_DEMO})`);
  const utilisateurs = await appel('GET', '/admin/utilisateurs');
  const ids = {};
  for (const u of EQUIPE) {
    const existant = utilisateurs.find((x) => x.email === email(u.cle));
    ids[u.cle] = existant?.id ?? (await appel('POST', '/admin/utilisateurs', {
      nom: u.nom, prenom: u.prenom, email: email(u.cle), motDePasse: MOT_DE_PASSE_DEMO, role: u.role, poste: u.poste, telephone: '77 000 00 00',
    })).id;
    console.log(`   ${existant ? 'déjà là ' : 'créé    '} ${email(u.cle).padEnd(22)} ${u.prenom} ${u.nom} — ${u.poste}`);
  }

  // 3. Chantiers, équipes, planning
  etape('Chantiers, équipes et planning');
  const projet = {};
  for (const [cle, c] of Object.entries(CHANTIERS)) projet[cle] = (await appel('POST', '/projets', c)).id;
  await appel('PUT', `/projets/${projet.villa}/membres`, { utilisateurIds: [ids.cp, ids.ct, ids.mag, ids.client] });
  await appel('PUT', `/projets/${projet.immeuble}/membres`, { utilisateurIds: [ids.cp, ids.ct] });
  await appel('PUT', `/projets/${projet.ecole}/membres`, { utilisateurIds: [ids.cp] });
  for (const cle of Object.keys(CHANTIERS)) {
    for (const tache of TACHES[cle]) await appel('POST', `/projets/${projet[cle]}/taches`, tache);
    for (const jalon of JALONS[cle]) await appel('POST', `/projets/${projet[cle]}/jalons`, jalon);
    console.log(`   ${CHANTIERS[cle].reference} : ${TACHES[cle].length} tâches, ${JALONS[cle].length} jalon(s)`);
  }

  // 4. Devis estimé par l'IA, dépenses, paiements du client
  etape('Devis, dépenses et paiements');
  await appel('POST', `/projets/${projet.villa}/estimation/devis`, { surfaceM2: 300, finition: 'standard' });
  await appel('POST', `/projets/${projet.immeuble}/estimation/devis`, { surfaceM2: 1000, finition: 'haut_standing' });
  for (const d of [
    { type: 'realisation', categorie: 'materiaux', montant: 9600000, libelle: 'Ciment (2 000 sacs)', date: jour(-60), fournisseur: 'Ciments du Sahel' },
    { type: 'realisation', categorie: 'materiaux', montant: 12500000, libelle: 'Fer à béton (25 t)', date: jour(-55), fournisseur: 'Quincaillerie Touba' },
    { type: 'realisation', categorie: 'main_oeuvre', montant: 8400000, libelle: 'Main-d’œuvre (2 mois)', date: jour(-15) },
    { type: 'realisation', categorie: 'materiel', montant: 2500000, libelle: 'Location pelle mécanique', date: jour(-62), fournisseur: 'Loc’Engins Dakar' },
    { type: 'engagement', categorie: 'materiaux', montant: 6000000, libelle: 'Agglos et sable (commande)', date: jour(-5), fournisseur: 'Carrière de Bargny' },
  ]) await appel('POST', `/projets/${projet.villa}/depenses`, d);
  // 30 % au démarrage (payé), 20 % aux fondations (payé en partie, en retard), 30 % au gros œuvre, 20 % à la réception
  const echeances = [
    ['Acompte au démarrage (30 %)', 33134400, -70],
    ['Fin des fondations (20 %)', 22089600, -20],
    ['Fin du gros œuvre (30 %)', 33134400, 35],
    ['Réception provisoire (20 %)', 22089600, 230],
  ];
  for (const [libelle, montant, decalage] of echeances) {
    await appel('POST', `/projets/${projet.villa}/paiements/echeances`, { libelle, montant, dateLimite: jour(decalage) });
  }
  await appel('POST', `/projets/${projet.villa}/paiements/versements`, { date: jour(-72), montant: 33134400, mode: 'virement', reference: 'VIR-CBAO-2207' });
  await appel('POST', `/projets/${projet.villa}/paiements/versements`, { date: jour(-12), montant: 15000000, mode: 'wave', reference: 'WAVE-88341' });
  await appel('POST', `/projets/${projet.immeuble}/paiements/echeances`, { libelle: 'Avance de démarrage (20 %)', montant: 84000000, dateLimite: jour(-135) });
  await appel('POST', `/projets/${projet.immeuble}/paiements/versements`, { date: jour(-136), montant: 84000000, mode: 'virement' });
  console.log('   villa : 2 devis estimés, 5 dépenses, 4 échéances dont une en retard (7 089 600 FCFA)');

  // 5. Documents : partagés avec le client ou internes ; une caution qui expire bientôt
  etape('Documents');
  for (const doc of [
    { nom: 'Marché signé', type: 'marche_signe', phase: 'contractualisation' },
    { nom: 'Plans d’architecte (RDC, R+1, R+2)', type: 'plan', phase: 'preparation' },
    { nom: 'Planning prévisionnel', type: 'planning', phase: 'preparation' },
    { nom: 'PV de la réunion de chantier n° 4', type: 'pv_reunion', phase: 'execution' },
    { nom: 'Caution de bonne fin', type: 'caution', phase: 'contractualisation', dateExpiration: jour(10) }, // alerte « expire dans moins de 15 jours »
    { nom: 'Bordereau des prix (interne)', type: 'bordereau_prix', phase: 'appel_offres' },
  ]) await appel('POST', `/projets/${projet.villa}/documents`, { ...doc, cheminFichier: `https://exemple.btpdemo.sn/documents/${encodeURIComponent(doc.nom)}.pdf` });
  console.log('   villa : 4 documents partagés avec le client, 2 internes');

  // 6. Personnel, pointages et engins
  etape('Personnel, pointages et engins');
  const tousLesPersonnels = await appel('GET', '/personnel');
  const personnel = [];
  for (const p of PERSONNEL) {
    const existant = tousLesPersonnels.find((x) => x.prenom === p.prenom && x.nom === p.nom);
    personnel.push(existant ?? (await appel('POST', '/personnel', { ...p, telephone: '76 000 00 00' })));
  }
  for (const p of personnel) {
    for (const decalage of [-2, -1, 0]) {
      await appel('POST', `/projets/${projet.villa}/pointages`, { personnelId: p.id, date: jour(decalage), statut: 'present' }).catch(() => {});
    }
  }
  const tousLesEngins = await appel('GET', '/engins');
  const engin = {};
  for (const e of ENGINS) engin[e.designation] = tousLesEngins.find((x) => x.designation === e.designation) ?? (await appel('POST', '/engins', e));
  const affecter = (p, nom, debut, fin) =>
    appel('POST', `/projets/${p}/engins`, { enginId: engin[nom].id, dateDebut: jour(debut), dateFin: fin === null ? undefined : jour(fin), forcer: true });
  await affecter(projet.villa, 'Pelle mécanique', -72, -58);
  await affecter(projet.villa, 'Bétonnière 350 L', -60, 40);
  await affecter(projet.immeuble, 'Camion benne 20 t', -30, 30);
  console.log(`   ${personnel.length} ouvriers pointés 3 jours sur la villa, ${ENGINS.length} engins (dont la grue en maintenance)`);

  // 7. Rapports validés des jours passés (l'IA rédige le message du client)
  etape('Rapports validés (l’IA écrit le message du client)');
  const jetonConductrice = await appel('POST', '/auth/login', { email: email('ct'), motDePasse: MOT_DE_PASSE_DEMO }, '')
    .then((r) => r.access_token).catch(() => undefined); // sinon : au nom du Directeur général
  for (const r of RAPPORTS_VILLA) {
    const j = await appel('POST', `/projets/${projet.villa}/journaux`, r, jetonConductrice);
    console.log(`   ${r.date} : ${j.resumeClient ? 'message client rédigé' : 'sans message (IA indisponible)'}`);
  }
  await appel('POST', `/projets/${projet.immeuble}/journaux`, {
    date: jour(-1), meteo: 'ensoleille', nombreOuvriers: 22, genereParIa: true,
    travauxRealises: '- Coulage des poteaux du R+3\n- Montage des banches pour les voiles du R+4',
    resteAFaire: '- Dalle du R+3',
  }, jetonConductrice);

  // 8. Notes vocales du jour : à transformer en rapport pendant la démo
  etape('Notes vocales du jour');
  const notes = enregistrerNotes();
  if (!notes) {
    console.log('   ignorées (voix de synthèse disponible seulement sous Windows)');
  } else {
    for (const n of notes) {
      const note = await appel('POST', `/projets/${projet.villa}/notes-vocales`, {
        audio: n.audio, mimeType: 'audio/wav', enregistreeLe: instant(0, n.heure),
      }, jetonConductrice).catch((err) => ({ erreur: err.message }));
      console.log(`   ${n.heure} : ${note.erreur ? `échec (${note.erreur})` : `« ${note.texte.slice(0, 70)}… »${note.probleme ? ' → problème signalé, alerte envoyée' : ''}`}`);
    }
  }

  // 9. Alertes du matin
  etape('Analyse des alertes');
  await appel('GET', '/ai/alertes/analyser');
  const alertes = await appel('GET', '/ai/alertes');
  console.log(`   ${alertes.length} alerte(s) : ${[...new Set(alertes.map((a) => a.type))].join(', ')}`);

  console.log(`
✔ Démonstration prête.

Comptes (mot de passe ${MOT_DE_PASSE_DEMO}) :
${EQUIPE.map((u) => `   ${email(u.cle).padEnd(22)} ${u.poste}`).join('\n')}
   + votre compte Directeur général`);
}

main()
  .catch((err) => {
    console.error(`\n✖ Arrêt : ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
