import { useEffect, useState, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { listQueue, removeRejected } from '../api/queue';
import { synchroniser } from '../api/api';

const COULEURS = {
    orange: '#b45309',
    violet: '#6d28d9',
    rouge: '#b91c1c',
    vert: '#15803d',
    bleu: '#1d4ed8',
};

const conteneur = {
    position: 'fixed',
    left: 0,
    right: 0,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 8,
    maxWidth: 560,
    margin: '0 auto',
    pointerEvents: 'none', // les clics passent à travers, sauf sur les bandeaux
};

function Bouton({ onClick, children, secondaire }) {
    return (
        <button
            onClick={onClick}
            style={{
                border: secondaire ? '1px solid rgba(255,255,255,0.6)' : 'none',
                background: secondaire ? 'transparent' : '#fff',
                color: secondaire ? '#fff' : '#111827',
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
            }}
        >
            {children}
        </button>
    );
}

function Banniere({ couleur, children, actions }) {
    return (
        <div
            role="status"
            style={{
                pointerEvents: 'auto',
                background: COULEURS[couleur],
                color: '#fff',
                padding: '10px 14px',
                borderRadius: 12,
                boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                fontSize: 14,
                lineHeight: 1.3,
            }}
        >
            <span style={{ flex: '1 1 200px' }}>{children}</span>
            {actions && <span style={{ display: 'flex', gap: 8 }}>{actions}</span>}
        </div>
    );
}

export default function PwaStatus() {
    const enLigne = useOnlineStatus();
    const [attente, setAttente] = useState(0);
    const [rejetes, setRejetes] = useState(0);
    const [message, setMessage] = useState('');
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        offlineReady: [offlineReady, setOfflineReady],
        updateServiceWorker,
    } = useRegisterSW();

    const rafraichir = useCallback(async () => {
        const items = await listQueue();
        setAttente(items.filter((i) => !i.erreur).length);
        setRejetes(items.filter((i) => i.erreur).length);
    }, []);

    const lancerSync = useCallback(async () => {
        if (!localStorage.getItem('batipme_token')) return;
        const r = await synchroniser();
        if (r.envoyes > 0) setMessage(`${r.envoyes} saisie(s) synchronisée(s).`);
    }, []);

    useEffect(() => {
        rafraichir();
        window.addEventListener('queue-changed', rafraichir);
        return () => window.removeEventListener('queue-changed', rafraichir);
    }, [rafraichir]);

    // Synchronisation au démarrage et au retour du réseau
    useEffect(() => {
        if (enLigne) lancerSync();
    }, [enLigne, lancerSync]);

    // Nouvel essai toutes les 20 s tant qu'il reste des saisies
    useEffect(() => {
        if (attente === 0) return;
        const t = setInterval(lancerSync, 20000);
        return () => clearInterval(t);
    }, [attente, lancerSync]);

    return (
        <>
            <div style={{ ...conteneur, top: 0, paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
                {!enLigne && (
                    <Banniere couleur="orange">
                        Vous êtes hors ligne. Vos saisies seront envoyées au retour du réseau.
                    </Banniere>
                )}

                {attente > 0 && (
                    <Banniere couleur="violet" actions={<Bouton onClick={lancerSync}>Synchroniser</Bouton>}>
                        {attente} saisie(s) en attente d'envoi.
                    </Banniere>
                )}

                {rejetes > 0 && (
                    <Banniere couleur="rouge" actions={<Bouton onClick={removeRejected}>Ignorer</Bouton>}>
                        {rejetes} saisie(s) refusée(s) par le serveur.
                    </Banniere>
                )}
            </div>

            <div style={{ ...conteneur, bottom: 0, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}>
                {message && (
                    <Banniere
                        couleur="vert"
                        actions={
                            <>
                                <Bouton onClick={() => window.location.reload()}>Actualiser</Bouton>
                                <Bouton secondaire onClick={() => setMessage('')}>OK</Bouton>
                            </>
                        }
                    >
                        {message}
                    </Banniere>
                )}

                {offlineReady && (
                    <Banniere couleur="vert" actions={<Bouton onClick={() => setOfflineReady(false)}>OK</Bouton>}>
                        L'application est prête à fonctionner hors ligne.
                    </Banniere>
                )}

                {needRefresh && (
                    <Banniere
                        couleur="bleu"
                        actions={
                            <>
                                <Bouton onClick={() => updateServiceWorker(true)}>Mettre à jour</Bouton>
                                <Bouton secondaire onClick={() => setNeedRefresh(false)}>Plus tard</Bouton>
                            </>
                        }
                    >
                        Une nouvelle version est disponible.
                    </Banniere>
                )}
            </div>
        </>
    );
}