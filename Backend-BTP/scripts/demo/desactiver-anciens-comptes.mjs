#!/usr/bin/env node
/**
 * Désactive les anciens comptes d'essai, pour ne garder que :
 *   - les Directeurs généraux (dont le compte connecté),
 *   - les comptes de démonstration (@btpdemo.sn),
 *   - les personnes dont le prénom ou le nom est donné (par défaut : Malick, Coumba, Lateo).
 *
 *   node scripts/demo/desactiver-anciens-comptes.mjs
 *
 * Un compte désactivé ne peut plus se connecter mais reste dans l'historique (rapports, paiements…).
 * Il peut être réactivé à tout moment dans Administration (« Afficher les comptes désactivés »).
 */
import { appel, connexionDirecteur, demander, oui, rl } from './commun.mjs';

const roleLabels = {
  directeur_general: 'Directeur général', directeur_technique: 'Directeur technique', chef_projet: 'Chef de projet',
  conducteur_travaux: 'Conducteur de travaux', responsable_admin_fin: 'Resp. admin. et financier',
  magasinier: 'Magasinier', maitre_ouvrage_externe: 'Client',
};
const decrire = (u) => `${`${u.prenom} ${u.nom}`.padEnd(24)} ${u.email.padEnd(30)} ${roleLabels[u.role] ?? u.role}`;

async function main() {
  console.log('Désactivation des anciens comptes d’essai BATIPME-SN\n');
  const moi = await connexionDirecteur();

  const noms = (process.env.GARDER || await demander('Prénoms ou noms à garder, séparés par des virgules', 'Malick, Coumba, Lateo'))
    .split(',').map((n) => n.trim().toLowerCase()).filter(Boolean);
  const aGarder = (u) => u.id === moi.id || u.role === 'directeur_general' || u.email.endsWith('@btpdemo.sn')
    || noms.some((n) => u.prenom?.toLowerCase().includes(n) || u.nom?.toLowerCase().includes(n));

  const actifs = (await appel('GET', '/admin/utilisateurs')).filter((u) => u.actif);
  const gardes = actifs.filter(aGarder);
  const anciens = actifs.filter((u) => !aGarder(u));

  console.log(`\n▸ Comptes gardés (${gardes.length})`);
  gardes.forEach((u) => console.log(`   ✓ ${decrire(u)}`));
  console.log(`\n▸ Comptes à désactiver (${anciens.length})`);
  anciens.forEach((u) => console.log(`   ✗ ${decrire(u)}`));

  if (anciens.length === 0) {
    console.log('\nRien à désactiver.');
    return;
  }
  const accord = process.argv.includes('--oui') || oui(await demander(`\nDésactiver ces ${anciens.length} compte(s) ? (oui/non)`, 'non'));
  if (!accord) {
    console.log('Aucun compte n’a été modifié.');
    return;
  }
  for (const u of anciens) {
    await appel('DELETE', `/admin/utilisateurs/${u.id}`);
    console.log(`   désactivé : ${u.prenom} ${u.nom}`);
  }
  console.log('\n✔ Terminé. Pour réactiver un compte : Administration → « Afficher les comptes désactivés » → Réactiver.');
}

main()
  .catch((err) => {
    console.error(`\n✖ Arrêt : ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
