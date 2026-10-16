import { X, Sparkles, CloudSun, Users, Image as ImageIcon } from 'lucide-react';

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

// Fiche complète d'un rapport journalier, avec les photos prises le même jour
export default function JournalDetail({ journal, photosDuJour = [], onFermer, onVoirPhoto }) {
  return (
    <div className="modal-overlay" onClick={onFermer}>
      <div className="modal" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Rapport du {new Date(journal.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
          <button className="modal-close" onClick={onFermer}><X size={20} /></button>
        </div>

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
