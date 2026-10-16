import { useCallback, useEffect, useState } from 'react';
import { Mic, Square, Trash2, Clock, Loader2, WifiOff } from 'lucide-react';
import { getNotesVocales, createNoteVocale, deleteNoteVocale } from '../../api/api';
import { listQueue } from '../../api/queue';
import { useEnregistreur, blobEnBase64, formatDuree, micAccessible, DUREE_MAX_SECONDES } from '../../hooks/useEnregistreur';
import { useAuth } from '../../context/AuthContext';
import { ROLES_GESTION_PROJET } from '../../roles';

const formatDateHeure = (d) =>
  new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

// Observations dictées sur le chantier. Sans réseau, la note attend dans la file
// et est transcrite au retour de la connexion.
export default function NotesVocales({ projetId }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [enAttente, setEnAttente] = useState([]);
  const [envoi, setEnvoi] = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState('');
  const chemin = `/projets/${projetId}/notes-vocales`;

  const charger = useCallback(() => {
    getNotesVocales(projetId).then(setNotes).catch(() => {});
  }, [projetId]);

  const chargerFile = useCallback(async () => {
    const file = await listQueue();
    setEnAttente(file.filter((i) => i.path === chemin));
  }, [chemin]);

  useEffect(() => {
    charger();
    chargerFile();
    // Une note de la file vient d'être envoyée (ou ajoutée) : on rafraîchit
    const surChangement = () => { chargerFile(); charger(); };
    window.addEventListener('queue-changed', surChangement);
    return () => window.removeEventListener('queue-changed', surChangement);
  }, [charger, chargerFile]);

  const { enregistrement, secondes, erreur, demarrer, arreter } = useEnregistreur(
    async ({ blob, mimeType, dureeSecondes, enregistreeLe }) => {
      setEnvoi(true);
      setErreurEnvoi('');
      try {
        const note = await createNoteVocale(projetId, {
          audio: await blobEnBase64(blob), mimeType, dureeSecondes, enregistreeLe,
        });
        if (note?.enAttente) chargerFile();
        else setNotes((avant) => [note, ...avant]);
      } catch (err) {
        setErreurEnvoi([].concat(err?.message || "La note n'a pas pu être enregistrée.").join(' '));
      } finally {
        setEnvoi(false);
      }
    },
  );

  const supprimer = async (note) => {
    if (!confirm('Supprimer cette note vocale ?')) return;
    await deleteNoteVocale(projetId, note.id);
    setNotes((avant) => avant.filter((n) => n.id !== note.id));
  };

  const peutSupprimer = (note) => note.auteurId === user?.id || ROLES_GESTION_PROJET.includes(user?.role);

  return (
    <div>
      <div className="glass-card" style={{ marginBottom: 20, textAlign: 'center', padding: 28 }}>
        {!micAccessible() ? (
          <p style={{ color: 'var(--text-muted)' }}>Ce navigateur ne permet pas d'enregistrer la voix. Utilisez Chrome ou Safari récent.</p>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={enregistrement ? arreter : demarrer}
              disabled={envoi}
              style={{
                width: 96, height: 96, borderRadius: '50%', justifyContent: 'center',
                ...(enregistrement ? { background: 'var(--accent-red)', borderColor: 'var(--accent-red)' } : {}),
              }}
              aria-label={enregistrement ? "Arrêter l'enregistrement" : 'Enregistrer une note vocale'}
            >
              {envoi ? <Loader2 size={36} className="spin" /> : enregistrement ? <Square size={32} /> : <Mic size={40} />}
            </button>
            <p style={{ marginTop: 14, fontWeight: 600 }}>
              {envoi ? 'Transcription en cours…'
                : enregistrement ? `Enregistrement ${formatDuree(secondes)} / ${formatDuree(DUREE_MAX_SECONDES)} — touchez pour arrêter`
                  : 'Touchez le micro et décrivez ce que vous voyez sur le chantier'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Ex. : « Le carrelage du 1er étage est terminé, il reste la plomberie de la salle de bain. »
            </p>
            {(erreur || erreurEnvoi) && <div className="alert alert-danger" style={{ marginTop: 12 }}>{erreur || erreurEnvoi}</div>}
          </>
        )}
      </div>

      {enAttente.map((item) => (
        <div key={item.key} className="glass-card" style={{ marginBottom: 12, borderLeft: '3px solid var(--accent-amber)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
            <WifiOff size={14} />
            Note du {formatDateHeure(item.body.enregistreeLe)} ({formatDuree(item.body.dureeSecondes || 0)}) —
            {item.erreur ? ` refusée : ${item.erreur}` : ' en attente, elle sera transcrite au retour de la connexion'}
          </div>
        </div>
      ))}

      {notes.map((note) => (
        <div key={note.id} className="glass-card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Clock size={13} /> {formatDateHeure(note.enregistreeLe)} · {note.auteurNom}
              {note.dureeSecondes ? ` · ${formatDuree(note.dureeSecondes)}` : ''}
            </span>
            {peutSupprimer(note) && (
              <button className="btn btn-danger btn-icon" title="Supprimer la note" onClick={() => supprimer(note)}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.6 }}>{note.texte}</p>
        </div>
      ))}

      {notes.length === 0 && enAttente.length === 0 && (
        <div className="empty-state"><p>Aucune note vocale pour ce chantier.</p></div>
      )}
    </div>
  );
}
