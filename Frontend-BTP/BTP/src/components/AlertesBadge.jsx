import { useState, useEffect, useRef } from 'react';
import { Bell, X, AlertCircle, AlertTriangle, Info, CheckCheck, Trash2, RefreshCw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getToken() {
  return localStorage.getItem('batipme_token');
}

async function apiFetch(path, options = {}) {
  const { method = 'GET', body } = options;
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) return null;
  if (res.status === 204) return null;
  return res.json().catch(() => null);
}

const GRAVITE_CONFIG = {
  danger: { icon: AlertCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', label: 'Critique' },
  warning: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', label: 'Attention' },
  info: { icon: Info, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', label: 'Info' },
};

export default function AlertesBadge() {
  const [count, setCount] = useState(0);
  const [alertes, setAlertes] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  // Charger le nombre de non lues au montage + toutes les 2 min
  useEffect(() => {
    chargerCount();
    const interval = setInterval(chargerCount, 120_000);
    return () => clearInterval(interval);
  }, []);

  // Fermer le panel en cliquant ailleurs
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function chargerCount() {
    const data = await apiFetch('/ai/alertes/count');
    if (data) setCount(data.count || 0);
  }

  async function ouvrirPanel() {
    setOpen(v => !v);
    if (!open) {
      setLoading(true);
      const data = await apiFetch('/ai/alertes?lu=false');
      setAlertes(Array.isArray(data) ? data : []);
      setLoading(false);
    }
  }

  async function marquerToutLu() {
    await apiFetch('/ai/alertes/tout-lu', { method: 'PATCH' });
    setCount(0);
    setAlertes([]);
  }

  async function marquerLu(id) {
    await apiFetch(`/ai/alertes/${id}/lu`, { method: 'PATCH' });
    setAlertes(prev => prev.filter(a => a.id !== id));
    setCount(prev => Math.max(0, prev - 1));
  }

  async function analyserMaintenant() {
    setLoading(true);
    await apiFetch('/ai/alertes/analyser');
    const data = await apiFetch('/ai/alertes?lu=false');
    setAlertes(Array.isArray(data) ? data : []);
    await chargerCount();
    setLoading(false);
  }

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      {/* Bouton cloche */}
      <button
        onClick={ouvrirPanel}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: count > 0 ? '#f59e0b' : 'var(--text-muted)',
          padding: '8px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.2s',
        }}
        title="Alertes proactives"
        id="alertes-btn"
      >
        <Bell size={22} />
        {count > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: '#ef4444',
            color: 'white',
            fontSize: '10px',
            fontWeight: '700',
            borderRadius: '10px',
            minWidth: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            animation: 'alertPulse 2s ease-in-out infinite',
          }}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Panel des alertes */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '380px',
          maxHeight: '500px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--surface-border)',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeInDown 0.2s ease',
        }}>
          {/* En-tête */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 16px 12px',
            borderBottom: '1px solid var(--surface-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={16} color="#f59e0b" />
              <span style={{ fontWeight: '600', fontSize: '14px' }}>
                Alertes proactives {count > 0 && <span style={{ color: '#ef4444' }}>({count})</span>}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={analyserMaintenant}
                title="Analyser maintenant"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px' }}
              >
                <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              {alertes.length > 0 && (
                <button
                  onClick={marquerToutLu}
                  title="Tout marquer comme lu"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px' }}
                >
                  <CheckCheck size={14} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px' }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Liste des alertes */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Chargement...
              </div>
            ) : alertes.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <CheckCheck size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                <p>Aucune alerte non lue 🎉</p>
                <button
                  onClick={analyserMaintenant}
                  style={{
                    marginTop: '12px',
                    background: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    color: '#93c5fd',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Lancer une analyse
                </button>
              </div>
            ) : (
              <div style={{ padding: '8px' }}>
                {alertes.map(alerte => {
                  const cfg = GRAVITE_CONFIG[alerte.gravite] || GRAVITE_CONFIG.info;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={alerte.id}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        padding: '12px',
                        borderRadius: '8px',
                        background: cfg.bg,
                        border: `1px solid ${cfg.border}`,
                        marginBottom: '6px',
                        animation: 'fadeInUp 0.2s ease',
                      }}
                    >
                      <Icon size={16} color={cfg.color} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {alerte.projetReference && (
                          <span style={{
                            fontSize: '10px',
                            background: 'rgba(255,255,255,0.1)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            color: 'var(--text-muted)',
                            display: 'inline-block',
                            marginBottom: '4px',
                          }}>
                            {alerte.projetReference}
                          </span>
                        )}
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                          {alerte.message}
                        </p>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                          {new Date(alerte.creeLe).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <button
                        onClick={() => marquerLu(alerte.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', alignSelf: 'flex-start' }}
                        title="Marquer comme lu"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes alertPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 4px rgba(239,68,68,0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
