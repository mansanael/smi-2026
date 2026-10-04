import { get, set, del, keys } from 'idb-keyval';

const PREFIX = 'api:';

export async function cacheSet(key, data) {
    try {
        await set(PREFIX + key, { data, savedAt: Date.now() });
    } catch { /* stockage plein ou indisponible : on ignore */ }
}

export async function cacheGet(key) {
    try {
        return await get(PREFIX + key);
    } catch {
        return undefined;
    }
}

// À appeler à la déconnexion : on ne laisse pas les données d'un utilisateur sur l'appareil
export async function cacheClear() {
    try {
        const toutes = await keys();
        await Promise.all(
            toutes.filter((k) => typeof k === 'string' && k.startsWith(PREFIX)).map((k) => del(k)),
        );
    } catch { /* ignore */ }
}