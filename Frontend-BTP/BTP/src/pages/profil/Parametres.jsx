import { useState } from 'react';
import { changerMotDePasse } from '../../api/api';
import { Lock, Save, CheckCircle2 } from 'lucide-react';
import ReglageVoix from '../../components/voix/ReglageVoix';

export default function Parametres() {
    const [form, setForm] = useState({ ancienMotDePasse: '', nouveauMotDePasse: '', confirmation: '' });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        if (form.nouveauMotDePasse !== form.confirmation) {
            setError('La confirmation ne correspond pas au nouveau mot de passe.');
            return;
        }
        setSaving(true);
        try {
            await changerMotDePasse(form.ancienMotDePasse, form.nouveauMotDePasse);
            setSuccess(true);
            setForm({ ancienMotDePasse: '', nouveauMotDePasse: '', confirmation: '' });
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.message || 'Erreur lors du changement de mot de passe');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Paramètres</h1>
                    <p className="subtitle">Sécurité de votre compte et voix de l'assistant</p>
                </div>
            </div>

            <div className="glass-card" style={{ maxWidth: 480, padding: 24 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 15 }}>
                    <Lock size={18} /> Changer le mot de passe
                </h3>
                <form onSubmit={handleSubmit}>
                    {error && <div className="badge badge-red" style={{ display: 'block', marginBottom: 12, padding: 10 }}>{error}</div>}
                    {success && (
                        <div className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: 10 }}>
                            <CheckCircle2 size={14} /> Mot de passe modifié avec succès
                        </div>
                    )}
                    <div className="form-group">
                        <label>Mot de passe actuel *</label>
                        <input className="form-input" type="password" required value={form.ancienMotDePasse} onChange={e => setForm({ ...form, ancienMotDePasse: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Nouveau mot de passe * (8 caractères min.)</label>
                        <input className="form-input" type="password" required minLength={8} value={form.nouveauMotDePasse} onChange={e => setForm({ ...form, nouveauMotDePasse: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Confirmer le nouveau mot de passe *</label>
                        <input className="form-input" type="password" required value={form.confirmation} onChange={e => setForm({ ...form, confirmation: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        <Save size={16} /> {saving ? 'Enregistrement...' : 'Changer le mot de passe'}
                    </button>
                </form>
            </div>

            <ReglageVoix />
        </div>
    );
}