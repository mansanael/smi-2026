import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Info, Check, CheckCircle2 } from 'lucide-react';
import { getAlertes, marquerAlerteLue } from '../../api/api';

const GRAVITE = {
  danger: { icon: AlertCircle, couleur: 'var(--accent-red)' },
  warning: { icon: AlertTriangle, couleur: 'var(--accent-amber)' },
  info: { icon: Info, couleur: 'var(--accent-blue)' },
};

const quand = (d) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

// Alertes non lues (problèmes signalés à la voix, retards, impayés…) en tête de l'accueil
export default function AlertesRecentes({ max = 5 }) {
  const [alertes, setAlertes] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getAlertes(false).then((a) => setAlertes(Array.isArray(a) ? a : [])).catch(() => setAlertes([]));
  }, []);

  if (alertes === null) return null;

  const vu = async (e, alerte) => {
    e.stopPropagation();
    await marquerAlerteLue(alerte.id);
    setAlertes((l) => l.filter((a) => a.id !== alerte.id));
  };

  const ouvrir = (a) => {
    if (!a.projetId) return;
    navigate(a.type === 'probleme_chantier' ? `/projets/${a.projetId}?onglet=suivi` : `/projets/${a.projetId}`);
  };

  return (
    <div className="glass-card" style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>À traiter</h3>
      {alertes.length === 0 ? (
        <p style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
          <CheckCircle2 size={16} color="var(--accent-green)" /> Aucune alerte en attente.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {alertes.slice(0, max).map((a) => {
            const { icon: Icon, couleur } = GRAVITE[a.gravite] || GRAVITE.info;
            return (
              <div
                key={a.id}
                onClick={() => ouvrir(a)}
                style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start', padding: 10, borderRadius: 'var(--radius-sm)',
                  borderLeft: `3px solid ${couleur}`, background: 'var(--bg-tertiary)', cursor: a.projetId ? 'pointer' : 'default',
                }}
              >
                <Icon size={16} color={couleur} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, fontSize: 14 }}>
                  <div>{a.message}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{quand(a.creeLe)}</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={(e) => vu(e, a)} title="Marquer comme vu">
                  <Check size={14} /> Vu
                </button>
              </div>
            );
          })}
          {alertes.length > max && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>… et {alertes.length - max} autre(s), dans la cloche en haut.</p>
          )}
        </div>
      )}
    </div>
  );
}
