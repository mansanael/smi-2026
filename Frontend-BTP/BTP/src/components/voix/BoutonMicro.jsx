import { useState } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { transcrireAudio } from '../../api/api';
import { useEnregistreur, blobEnBase64, formatDuree, micAccessible } from '../../hooks/useEnregistreur';

/**
 * Dictée : un clic pour parler, un clic pour arrêter, le texte reconnu est
 * passé à onTexte. Demande une connexion (pour une note hors ligne, voir NotesVocales).
 */
export default function BoutonMicro({ onTexte, disabled = false, className = 'btn btn-secondary btn-sm', taille = 16 }) {
  const [transcription, setTranscription] = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState('');

  const { enregistrement, secondes, erreur, demarrer, arreter } = useEnregistreur(async ({ blob, mimeType }) => {
    setTranscription(true);
    try {
      const { texte } = await transcrireAudio(await blobEnBase64(blob), mimeType);
      if (texte) onTexte(texte);
      else setErreurEnvoi("Aucune parole reconnue, réessayez en parlant plus près du micro.");
    } catch (err) {
      setErreurEnvoi(err?.offline
        ? 'La dictée demande une connexion internet.'
        : [].concat(err?.message || 'La transcription a échoué.').join(' '));
    } finally {
      setTranscription(false);
    }
  });

  if (!micAccessible()) return null;

  const message = erreur || erreurEnvoi;
  const clic = () => {
    setErreurEnvoi('');
    if (enregistrement) arreter();
    else demarrer();
  };

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
      <button
        type="button"
        className={className}
        onClick={clic}
        disabled={disabled || transcription}
        title={enregistrement ? "Arrêter et transcrire" : 'Dicter au lieu d’écrire'}
        aria-label={enregistrement ? "Arrêter l'enregistrement" : 'Dicter'}
        style={enregistrement ? { background: 'var(--accent-red)', color: '#fff', borderColor: 'var(--accent-red)' } : undefined}
      >
        {transcription ? <Loader2 size={taille} className="spin" />
          : enregistrement ? <><Square size={taille} /> {formatDuree(secondes)}</>
            : <Mic size={taille} />}
      </button>
      {message && <span style={{ fontSize: 12, color: 'var(--accent-red)' }}>{message}</span>}
    </span>
  );
}
