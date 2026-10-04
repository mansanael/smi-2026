import { get, set, del, keys } from 'idb-keyval';

const PREFIX = 'queue:';
let enCours = false;

function notifier() {
    window.dispatchEvent(new Event('queue-changed'));
}

export async function enqueue({ method = 'POST', path, body, label }) {
    const key = `${PREFIX}${Date.now()}-${body.id}`;
    await set(key, { key, method, path, body, label, creeLe: Date.now(), erreur: null });
    notifier();
}

export async function listQueue() {
    const toutes = (await keys())
        .filter((k) => typeof k === 'string' && k.startsWith(PREFIX))
        .sort(); // l'ordre de saisie est conservé
    const items = await Promise.all(toutes.map((k) => get(k)));
    return items.filter(Boolean);
}

// Supprime les saisies que le serveur a refusées
export async function removeRejected() {
    const items = await listQueue();
    await Promise.all(items.filter((i) => i.erreur).map((i) => del(i.key)));
    notifier();
}

// `send` est fournie par api.js (évite un import circulaire)
export async function syncQueue(send) {
    if (enCours) return { envoyes: 0, echecs: 0, arret: null };
    enCours = true;
    let envoyes = 0;
    let echecs = 0;
    let arret = null;
    try {
        const items = await listQueue();
        for (const item of items) {
            if (item.erreur) continue; // déjà refusée, on n'insiste pas
            const r = await send(item);
            if (r.type === 'ok') {
                await del(item.key);
                envoyes++;
            } else if (r.type === 'rejet') {
                await set(item.key, { ...item, erreur: `${r.status} ${r.message}` });
                echecs++;
            } else {
                arret = r.type; // réseau, serveur ou session : on réessaiera plus tard
                break;
            }
        }
    } finally {
        enCours = false;
        notifier();
    }
    return { envoyes, echecs, arret };
}