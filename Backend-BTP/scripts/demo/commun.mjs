// Outils partagés par les programmes de démonstration : questions dans le terminal et appels au serveur
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

export const rl = createInterface({ input: stdin, output: stdout });

export async function demander(question, defaut = '') {
  const r = (await rl.question(`${question}${defaut ? ` [${defaut}]` : ''} : `)).trim();
  return r || defaut;
}

// Le mot de passe n'est pas affiché pendant la frappe
export async function demanderSecret(question) {
  const ecrire = rl._writeToOutput;
  rl._writeToOutput = (s) => { if (s.includes(question)) ecrire.call(rl, s); };
  const r = await rl.question(`${question} : `);
  rl._writeToOutput = ecrire;
  stdout.write('\n');
  return r.trim();
}

export const oui = (reponse) => /^o(ui)?$/i.test(reponse);

let API = '';
let jeton = '';

export async function appel(method, path, body, token = jeton, essais = 3) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(API + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(120000), // Render gratuit : jusqu'à une minute pour se réveiller
      });
      const texte = await res.text();
      let data; try { data = texte ? JSON.parse(texte) : null; } catch { data = texte; }
      if (!res.ok) throw Object.assign(new Error(`${method} ${path} → ${res.status} ${JSON.stringify(data?.message ?? data)}`), { status: res.status });
      return data;
    } catch (err) {
      if (err.status || i >= essais) throw err;
      console.log(`   … le serveur ne répond pas encore, nouvel essai (${i}/${essais - 1})`);
    }
  }
}

/** Demande le serveur et le compte Directeur général (ou les lit dans API_URL, DEMO_EMAIL, DEMO_MOT_DE_PASSE) */
export async function connexionDirecteur() {
  API = (process.env.API_URL || await demander('Adresse du serveur', 'https://smi-2026.onrender.com/api')).replace(/\/$/, '');
  const email = process.env.DEMO_EMAIL || await demander('E-mail du Directeur général');
  const motDePasse = process.env.DEMO_MOT_DE_PASSE || await demanderSecret('Mot de passe');
  console.log('\n▸ Connexion (le serveur peut mettre une minute à se réveiller)');
  const r = await appel('POST', '/auth/login', { email, motDePasse }, '');
  if (r?.utilisateur?.role !== 'directeur_general') throw new Error('Ce compte n’est pas celui d’un Directeur général.');
  jeton = r.access_token;
  console.log('   connecté');
  return r.utilisateur;
}
