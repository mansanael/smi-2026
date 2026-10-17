import { useState } from 'react';
import { X, Sparkles, CloudSun, Users, Image as ImageIcon, MessageSquareText, Pencil, RefreshCw, Clock } from 'lucide-react';
import { setResumeClient, regenererResumeClient } from '../../api/api';

const meteoLabels = {
  ensoleille: 'Ensoleillé',
  nuageux: 'Nuageux',
  pluie: 'Pluie',
  harmattan: 'Harmattan',
  orage: 'Orage',
};

const SECTIONS = [
  { cle: 'travauxRealises', label: 'Travaux réalisés' },
  { cle: 'resteAFaire', label: 'Reste à faire' },
  { cle: 'problemes', label: 'Problèmes rencontrés', alerte: true },
  { cle: 'materiaux_receptionnes', label: 'Matériaux réceptionnés' },
  { cle: 'visitesDuJour', label: 'Visites du jour' },
  { cle: 'observations', label: 'Observations' },
];

const quand = (d) => new Date(d).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Dakar' });

// Message préparé par l'IA pour le client : l'équipe le relit, le corrige ou le fait réécrire avant publication
function MessageClient({ projetId, journal, onModifie }) {
  const [edition, setEdition] = useState(false);
  const [texte, setTexte] = useState(journal.resumeClient || '');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const publie = journal.publieLe && new Date(journal.publieLe) <= new Date();

  const agir = async (action) => {
    setEnvoi(true);
    setErreur('');
    try {
      const j = await action();
      setTexte(j.resumeClient || '');
      setEdition(false);
      onModifie?.(j);
    } catch (err) {
      setErreur([].concat(err?.message || 'Échec de l’enregistrement.').join(' '));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div style={{ marginBottom: 16, padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <h4 style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <MessageSquareText size={15} /> Message pour le client
          {journal.resumeClientModifie && <span className="badge badge-gray">corrigé à la main</span>}
        </h4>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Clock size={12} /> {publie ? `Visible par le client depuis ${quand(journal.publieLe)}` : `Visible par le client ${quand(journal.publieLe)}`}
        </span>
      </div>
      {edition ? (
        <textarea className="form-input" rows={6} value={texte} onChange={(e) => setTexte(e.target.value)} />
      ) : (
        <p style={{ whiteSpace: 'pre-line', fontSize: 14, lineHeight: 1.6 }}>
          {journal.resumeClient || "Pas encore de message : le client verra le rapport complet. Vous pouvez demander à l'IA de le rédiger."}
        </p>
      )}
      {erreur && <div className="alert alert-danger" style={{ marginTop: 8 }}>{erreur}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        {edition ? (
          <>
            <button className="btn btn-primary btn-sm" disabled={envoi} onClick={() => agir(() => setResumeClient(projetId, journal.id, texte))}>Enregistrer</button>
            <button className="btn btn-secondary btn-sm" disabled={envoi} onClick={() => { setEdition(false); setTexte(journal.resumeClient || ''); }}>Annuler</button>
          </>
        ) : (
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setEdition(true)}><Pencil size={13} /> Corriger</button>
            <button className="btn btn-secondary btn-sm" disabled={envoi} onClick={() => agir(() => regenererResumeClient(projetId, journal.id))}>
              <RefreshCw size={13} className={envoi ? 'spin' : ''} /> {journal.resumeClient ? "Réécrire avec l'IA" : "Rédiger avec l'IA"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Fiche complète d'un rapport journalier, avec les photos prises le même jour
export default function JournalDetail({ projetId, journal, photosDuJour = [], lectureSeule = false, onFermer, onVoirPhoto, onModifie }) {
  return (
    <div className="modal-overlay" onClick={onFermer}>
      <div className="modal" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Rapport du {new Date(journal.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
          <button className="modal-close" onClick={onFermer}><X size={20} /></button>
        </div>

        {/* Le client lit d'abord le message simple, puis le détail s'il le souhaite */}
        {lectureSeule && journal.resumeClient && (
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 'var(--radius-sm)', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <h4 style={{ fontSize: 14, marginBottom: 6 }}>En bref</h4>
            <p style={{ whiteSpace: 'pre-line', fontSize: 14, lineHeight: 1.6 }}>{journal.resumeClient}</p>
          </div>
        )}
        {!lectureSeule && <MessageClient key={journal.id} projetId={projetId} journal={journal} onModifie={onModifie} />}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <CloudSun size={15} /> {meteoLabels[journal.meteo] || 'Météo non précisée'}{journal.temperature != null ? ` · ${journal.temperature} °C` : ''}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Users size={15} /> {journal.nombreOuvriers} ouvrier{journal.nombreOuvriers > 1 ? 's' : ''}
          </span>
          <span>Rédigé par {journal.redige_par || '—'}</span>
          {journal.genereParIa && (
            <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={12} /> Préparé par l'IA à partir des notes vocales, validé
            </span>
          )}
        </div>

        {SECTIONS.filter(({ cle }) => journal[cle]?.trim()).map(({ cle, label, alerte }) => (
          <div key={cle} style={{ marginBottom: 14 }}>
            <h4 style={{ fontSize: 14, marginBottom: 4, color: alerte ? 'var(--accent-red)' : 'var(--text-primary)' }}>{label}</h4>
            <p style={{ whiteSpace: 'pre-line', lineHeight: 1.6, fontSize: 14 }}>{journal[cle]}</p>
          </div>
        ))}

        {photosDuJour.length > 0 && (
          <div>
            <h4 style={{ fontSize: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ImageIcon size={15} /> Photos du jour ({photosDuJour.length})
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
              {photosDuJour.map((p) => (
                <img key={p.id} src={p.photoUrl} alt={p.titre} title={p.titre} onClick={() => onVoirPhoto?.(p)}
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onFermer}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
