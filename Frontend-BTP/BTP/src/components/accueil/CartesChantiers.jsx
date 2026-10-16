import { useNavigate } from 'react-router-dom';
import { MapPin, Mic, ChevronRight } from 'lucide-react';

const statutLabels = {
  en_etude: 'En étude', soumissionne: 'Soumissionné', attribue: 'Attribué',
  en_preparation: 'En préparation', en_cours: 'En cours', travaux_termines: 'Travaux terminés',
  en_garantie: 'En garantie', cloture: 'Clôturé',
};

// Un chantier = une grande carte ; « Parler » ouvre directement la saisie à la voix
export default function CartesChantiers({ projets, avecMicro = false }) {
  const navigate = useNavigate();

  if (projets.length === 0) {
    return (
      <div className="empty-state">
        <p>Vous n'êtes rattaché à aucun chantier pour l'instant. Demandez au directeur technique de vous ajouter à une équipe.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
      {projets.map((p) => (
        <div key={p.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontWeight: 700, color: 'var(--accent-blue-light)' }}>{p.reference}</span>
            <span className="badge badge-blue">{statutLabels[p.statut] || p.statut}</span>
          </div>
          <div style={{ fontWeight: 600 }}>{p.intitule}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={13} /> {[p.commune, p.region].filter(Boolean).join(', ')}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 6 }}>
            {avecMicro && (
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate(`/projets/${p.id}?onglet=suivi`)}>
                <Mic size={16} /> Parler
              </button>
            )}
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate(`/projets/${p.id}`)}>
              Ouvrir <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
