#!/usr/bin/env node
/**
 * Supprime définitivement les anciens comptes d'essai, pour ne garder que :
 *   - le compte Directeur général connecté,
 *   - les comptes de démonstration (@btpdemo.sn),
 *   - éventuellement, les personnes dont le prénom ou le nom est donné (par défaut : aucune).
 *
 *   node scripts/demo/supprimer-anciens-comptes.mjs
 *
 * Les comptes encore actifs sont d'abord désactivés, puis supprimés. Les rapports, notes et paiements
 * gardent le nom de leur auteur (texte) ; seules les appartenances aux équipes de chantier disparaissent.
 */
import { appel, connexionDirecteur, demander, oui, rl } from './commun.mjs';

const roleLabels = {
  directeur_general: 'Directeur général', directeur_technique: 'Directeur technique', chef_projet: 'Chef de projet',
  conducteur_travaux: 'Conducteur de travaux', responsable_admin_fin: 'Resp. admin. et financier',
  magasinier: 'Magasinier', maitre_ouvrage_externe: 'Client',
};
const decrire = (u) => `${`${u.prenom} ${u.nom}`.padEnd(24)} ${u.email.padEnd(30)} ${roleLabels[u.role] ?? u.role}${u.actif ? '' : ' (désactivé)'}`;

async function main() {
  console.log('Suppression des anciens comptes d’essai BATIPME-SN\n');
  const moi = await connexionDirecteur();

  const reponse = process.env.GARDER || await demander('Autres personnes à garder (prénoms séparés par des virgules)', 'aucune');
  const noms = /^aucun/i.test(reponse.trim()) ? [] : reponse.split(',').map((n) => n.trim().toLowerCase()).filter(Boolean);
  const aGarder = (u) => u.id === moi.id || u.email.endsWith('@btpdemo.sn')
    || noms.some((n) => u.prenom?.toLowerCase().includes(n) || u.nom?.toLowerCase().includes(n));

  const tous = await appel('GET', '/admin/utilisateurs');
  const gardes = tous.filter(aGarder);
  const anciens = tous.filter((u) => !aGarder(u));

  console.log(`\n▸ Comptes gardés (${gardes.length})`);
  gardes.forEach((u) => console.log(`   ✓ ${decrire(u)}`));
  console.log(`\n▸ Comptes à supprimer définitivement (${anciens.length})`);
  anciens.forEach((u) => console.log(`   ✗ ${decrire(u)}`));

  if (anciens.length === 0) {
    console.log('\nRien à supprimer.');
    return;
  }
  const accord = process.argv.includes('--oui')
    || oui(await demander(`\nSupprimer définitivement ces ${anciens.length} compte(s) ? C'est irréversible (oui/non)`, 'non'));
  if (!accord) {
    console.log('Aucun compte n’a été modifié.');
    return;
  }
  for (const u of anciens) {
    if (u.actif) await appel('DELETE', `/admin/utilisateurs/${u.id}`); // désactivation, puis suppression
    await appel('DELETE', `/admin/utilisateurs/${u.id}/definitif`);
    console.log(`   supprimé : ${u.prenom} ${u.nom}`);
  }
  console.log(`\n✔ Terminé : il reste ${gardes.length} compte(s).`);
}

main()
  .catch((err) => {
    console.error(`\n✖ Arrêt : ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
