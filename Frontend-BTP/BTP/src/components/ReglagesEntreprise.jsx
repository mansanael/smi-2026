import { useEffect, useState } from 'react';
import { Clock, Check } from 'lucide-react';
import { getParametres, updateParametres } from '../api/api';

// Réglages de l'entreprise (DG, DT) : heure à laquelle le client voit le rapport du jour
export default function ReglagesEntreprise() {
  const [heure, setHeure] = useState('');
  const [enregistree, setEnregistree] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    getParametres().then((p) => {
      setHeure(p?.heurePublicationClient || '18:00');
      setEnregistree(p?.heurePublicationClient || '18:00');
    }).catch(() => {});
  }, []);

  const enregistrer = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const p = await updateParametres({ heurePublicationClient: heure });
      setEnregistree(p.heurePublicationClient);
      setMessage('Enregistré.');
    } catch (err) {
      setMessage([].concat(err?.message || 'Échec de l’enregistrement.').join(' '));
    }
  };

  return (
    <form className="glass-card" onSubmit={enregistrer} style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: '1 1 280px' }}>
        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={16} /> Rapport du jour pour le client</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Heure à partir de laquelle le client voit le rapport validé du jour. Un rapport validé plus tard lui est montré dès sa validation.
        </div>
      </div>
      <input type="time" className="form-input" style={{ width: 'auto' }} value={heure} required onChange={(e) => setHeure(e.target.value)} />
      <button type="submit" className="btn btn-primary" disabled={!heure || heure === enregistree}>
        <Check size={16} /> Enregistrer
      </button>
      {message && <span style={{ fontSize: 13, color: 'var(--text-secondary)', flexBasis: '100%' }}>{message}</span>}
    </form>
  );
}
