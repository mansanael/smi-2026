import { useCallback, useEffect, useRef, useState } from 'react';

// Lecture à voix haute avec la voix du téléphone ou de l'ordinateur (gratuit, sans serveur)
export const lectureDisponible = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

// Une réponse de l'IA est en Markdown : on enlève ce qui ne se lit pas
export function textePourLecture(markdown) {
  return String(markdown ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s*\|?[\s:|-]+\|[\s:|-]*$/gm, ' ')          // ligne de séparation d'un tableau
    .replace(/^\s*\||\|\s*$/gm, '')
    .replace(/\s*\|\s*/g, ', ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')              // liens et images
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')                    // titres
    .replace(/^\s*(?:[-*+•]|\d+[.)])\s+/gm, '')            // puces et listes numérotées
    .replace(/[*_`~>]/g, '')
    .replace(/\p{Extended_Pictographic}️?/gu, '')     // émojis
    .replace(/\s*\n+\s*/g, '. ')
    .replace(/(\s*[.,]\s*){2,}/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Chrome coupe parfois les textes longs : on lit phrase par phrase
function decouper(texte, max = 220) {
  const phrases = texte.match(/[^.!?;:]+[.!?;:]*\s*/g) ?? [texte];
  const morceaux = [];
  let courant = '';
  for (const phrase of phrases) {
    if (courant && (courant + phrase).length > max) {
      morceaux.push(courant.trim());
      courant = '';
    }
    courant += phrase;
  }
  if (courant.trim()) morceaux.push(courant.trim());
  return morceaux;
}

// ─── Choix de la voix ─────────────────────────────────────────────────────────
// Sur téléphone, la première voix française « locale » est souvent la voix compacte hors ligne,
// au son étouffé : on classe les voix par qualité, et chacun peut choisir la sienne (Paramètres).
const CLE_PREFERENCES = 'batipme_voix_lecture';

export function lirePreferencesVoix() {
  try {
    const p = JSON.parse(localStorage.getItem(CLE_PREFERENCES) ?? '{}');
    return { voix: typeof p.voix === 'string' ? p.voix : '', vitesse: Number(p.vitesse) || 1 };
  } catch {
    return { voix: '', vitesse: 1 };
  }
}

export function enregistrerPreferencesVoix(preferences) {
  try { localStorage.setItem(CLE_PREFERENCES, JSON.stringify(preferences)); } catch { /* stockage indisponible : réglage non retenu */ }
}

// Note de qualité d'une voix : voix « naturelles » d'abord, voix compactes en dernier.
// Les voix en ligne (Google…) sont les plus nettes, mais muettes sans réseau : sur le chantier, on reste sur l'appareil.
function noteVoix(v) {
  let note = 0;
  if (/google|natural|naturel|neural|premium|enhanced|amélior|siri/i.test(v.name)) note += 50;
  if (/compact|eloquence|espeak|low/i.test(v.name)) note -= 20;
  if (v.lang === 'fr-FR' || v.lang === 'fr_FR') note += 30; // accent de France avant les autres accents
  if (!v.localService) note += navigator.onLine ? 5 : -100;
  return note;
}

// Voix françaises de l'appareil, de la meilleure à la moins bonne
export function voixFrancaises() {
  if (!lectureDisponible()) return [];
  return window.speechSynthesis.getVoices()
    .filter((v) => v.lang?.toLowerCase().replace('_', '-').startsWith('fr'))
    .sort((a, b) => noteVoix(b) - noteVoix(a));
}

function voixFrancaise() {
  const liste = voixFrancaises();
  const { voix } = lirePreferencesVoix();
  return liste.find((v) => v.voiceURI === voix) ?? liste[0] ?? null;
}

// Sur téléphone, la liste des voix arrive après le chargement : on l'attend (une seconde au plus)
function voixChargees() {
  if (window.speechSynthesis.getVoices().length) return Promise.resolve();
  return new Promise((resoudre) => {
    const fini = () => { window.speechSynthesis.removeEventListener('voiceschanged', fini); resoudre(); };
    window.speechSynthesis.addEventListener('voiceschanged', fini);
    setTimeout(fini, 1000);
  });
}

// Lecture d'un texte avec une voix et une vitesse données (morceau par morceau)
function parler(texte, voix, vitesse, fin) {
  const morceaux = decouper(texte);
  morceaux.forEach((morceau, i) => {
    const enonce = new SpeechSynthesisUtterance(morceau);
    enonce.lang = voix?.lang ?? 'fr-FR';
    if (voix) enonce.voice = voix;
    enonce.rate = vitesse;
    if (i === morceaux.length - 1) enonce.onend = fin;
    enonce.onerror = fin;
    window.speechSynthesis.speak(enonce);
  });
}

// Essai d'une voix depuis les Paramètres
export function essayerVoix(voiceURI, vitesse) {
  if (!lectureDisponible()) return;
  window.speechSynthesis.cancel();
  const voix = voixFrancaises().find((v) => v.voiceURI === voiceURI) ?? voixFrancaise();
  parler('Bonjour. Le coffrage de la dalle du premier étage est terminé, le coulage du béton est prévu demain matin.', voix, vitesse, () => {});
}

export function useLecteurVocal() {
  const [enLecture, setEnLecture] = useState(false);
  // Numéro de la lecture en cours : une lecture annulée ne doit pas changer l'état de la suivante
  const lectureRef = useRef(0);

  const arreter = useCallback(() => {
    if (!lectureDisponible()) return;
    lectureRef.current += 1;
    window.speechSynthesis.cancel();
    setEnLecture(false);
  }, []);

  const lire = useCallback((markdown) => {
    if (!lectureDisponible()) return;
    const texte = textePourLecture(markdown);
    const numero = ++lectureRef.current;
    window.speechSynthesis.cancel();
    if (!texte) {
      setEnLecture(false);
      return;
    }
    const fin = () => { if (lectureRef.current === numero) setEnLecture(false); };
    setEnLecture(true);
    voixChargees().then(() => {
      if (lectureRef.current !== numero) return; // arrêtée entre-temps
      parler(texte, voixFrancaise(), lirePreferencesVoix().vitesse, fin);
    });
  }, []);

  // Sur iPhone, la lecture n'est permise qu'après un geste de l'utilisateur :
  // on lance une lecture vide au moment du clic pour l'autoriser ensuite.
  const deverrouiller = useCallback(() => {
    if (!lectureDisponible()) return;
    lectureRef.current += 1;
    setEnLecture(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
  }, []);

  useEffect(() => {
    if (!lectureDisponible()) return undefined;
    window.speechSynthesis.getVoices(); // charge la liste des voix (asynchrone sur Chrome)
    return () => window.speechSynthesis.cancel();
  }, []);

  return { enLecture, lire, arreter, deverrouiller };
}
