// Connexion sans réseau, pour les appareils où l'utilisateur a coché « Se souvenir de moi ».
// À la dernière connexion réussie, on garde la session et une EMPREINTE du mot de passe
// (PBKDF2, jamais le mot de passe lui-même) pour pouvoir le vérifier sur le chantier, hors ligne.

const CLE = 'batipme_acces_hors_ligne';
const ITERATIONS = 150000;

const enHex = (octets) => [...new Uint8Array(octets)].map((o) => o.toString(16).padStart(2, '0')).join('');
const depuisHex = (hex) => new Uint8Array(hex.match(/../g).map((h) => parseInt(h, 16)));
const normaliser = (email) => String(email || '').trim().toLowerCase();

async function empreinte(motDePasse, sel) {
  const cle = await crypto.subtle.importKey('raw', new TextEncoder().encode(motDePasse), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sel, iterations: ITERATIONS }, cle, 256);
  return enHex(bits);
}

function lire() {
  try { return JSON.parse(localStorage.getItem(CLE)) || null; } catch { return null; }
}

/** Appareil mémorisé ? (pour garder les données à la déconnexion) */
export const accesMemorise = () => lire() !== null;

/** Email à préremplir sur la page de connexion */
export const emailMemorise = () => lire()?.email ?? '';

export async function memoriserAcces(email, motDePasse, token, utilisateur) {
  try {
    const sel = crypto.getRandomValues(new Uint8Array(16));
    localStorage.setItem(CLE, JSON.stringify({
      email: normaliser(email),
      sel: enHex(sel),
      empreinte: await empreinte(motDePasse, sel),
      token,
      utilisateur,
      le: Date.now(),
    }));
  } catch { /* navigateur sans WebCrypto ou stockage plein : pas d'accès hors ligne */ }
}

export function oublierAcces() {
  try { localStorage.removeItem(CLE); } catch { /* ignore */ }
}

/** Vérifie email + mot de passe sans réseau ; renvoie { token, utilisateur } ou null */
export async function verifierAccesHorsLigne(email, motDePasse) {
  const acces = lire();
  if (!acces || acces.email !== normaliser(email)) return null;
  try {
    const calcul = await empreinte(motDePasse, depuisHex(acces.sel));
    return calcul === acces.empreinte ? { token: acces.token, utilisateur: acces.utilisateur } : null;
  } catch {
    return null;
  }
}
