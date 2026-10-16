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

function voixFrancaise() {
  const voix = window.speechSynthesis.getVoices();
  return voix.find((v) => v.lang === 'fr-FR' && v.localService)
    ?? voix.find((v) => v.lang?.toLowerCase().startsWith('fr'))
    ?? null;
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
    const voix = voixFrancaise();
    const morceaux = decouper(texte);
    morceaux.forEach((morceau, i) => {
      const enonce = new SpeechSynthesisUtterance(morceau);
      enonce.lang = voix?.lang ?? 'fr-FR';
      if (voix) enonce.voice = voix;
      if (i === morceaux.length - 1) enonce.onend = fin;
      enonce.onerror = fin;
      window.speechSynthesis.speak(enonce);
    });
    setEnLecture(true);
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
