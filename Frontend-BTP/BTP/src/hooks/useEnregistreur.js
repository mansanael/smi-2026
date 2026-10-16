import { useCallback, useEffect, useRef, useState } from 'react';

// 3 minutes : assez pour un compte rendu, et sous la limite d'envoi du serveur
export const DUREE_MAX_SECONDES = 180;

// Chrome / Android : webm ; iPhone (Safari) : mp4
function choisirFormat() {
  const formats = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  return formats.find((f) => window.MediaRecorder?.isTypeSupported?.(f)) ?? '';
}

export const micAccessible = () => Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

export function blobEnBase64(blob) {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resolve(String(lecteur.result).split(',')[1] ?? '');
    lecteur.onerror = () => reject(lecteur.error);
    lecteur.readAsDataURL(blob);
  });
}

function messageErreurMicro(err) {
  if (err?.name === 'NotAllowedError') return "Autorisez l'accès au micro dans votre navigateur.";
  if (err?.name === 'NotFoundError') return 'Aucun micro détecté sur cet appareil.';
  return "Impossible de démarrer l'enregistrement.";
}

/**
 * Enregistre la voix avec le micro de l'appareil.
 * onTermine({ blob, mimeType, dureeSecondes, enregistreeLe }) est appelé à l'arrêt
 * (clic sur « arrêter » ou durée maximale atteinte).
 */
export function useEnregistreur(onTermine) {
  const [enregistrement, setEnregistrement] = useState(false);
  const [secondes, setSecondes] = useState(0);
  const [erreur, setErreur] = useState('');
  const recorderRef = useRef(null);
  const minuterieRef = useRef(null);
  const onTermineRef = useRef(onTermine);
  useEffect(() => { onTermineRef.current = onTermine; });

  const nettoyer = () => {
    clearInterval(minuterieRef.current);
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop()); // éteint le voyant du micro
  };

  const arreter = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }, []);

  const demarrer = useCallback(async () => {
    setErreur('');
    if (!micAccessible()) {
      setErreur("Ce navigateur ne permet pas d'enregistrer la voix.");
      return;
    }
    let flux;
    try {
      flux = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      setErreur(messageErreurMicro(err));
      return;
    }
    const format = choisirFormat();
    const recorder = new MediaRecorder(flux, format ? { mimeType: format } : undefined);
    const morceaux = [];
    const debut = Date.now();
    const enregistreeLe = new Date().toISOString();

    recorder.ondataavailable = (e) => { if (e.data.size > 0) morceaux.push(e.data); };
    recorder.onstop = () => {
      nettoyer();
      setEnregistrement(false);
      const mimeType = recorder.mimeType || format || 'audio/webm';
      onTermineRef.current?.({
        blob: new Blob(morceaux, { type: mimeType }),
        mimeType,
        dureeSecondes: Math.round((Date.now() - debut) / 1000),
        enregistreeLe,
      });
    };

    recorderRef.current = recorder;
    recorder.start();
    setSecondes(0);
    setEnregistrement(true);
    minuterieRef.current = setInterval(() => {
      const ecoulees = Math.round((Date.now() - debut) / 1000);
      setSecondes(ecoulees);
      if (ecoulees >= DUREE_MAX_SECONDES) arreter();
    }, 500);
  }, [arreter]);

  // Quitter la page pendant un enregistrement : on libère le micro
  useEffect(() => () => {
    if (recorderRef.current) recorderRef.current.onstop = null;
    arreter();
    nettoyer();
  }, [arreter]);

  return { enregistrement, secondes, erreur, demarrer, arreter };
}

export const formatDuree = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
