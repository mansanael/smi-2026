import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUtilisateurs, createUtilisateur, deleteUtilisateur, reactiverUtilisateur } from '../../api/api';
import { Plus, X, ShieldAlert, Trash2, UserCheck } from 'lucide-react';

const emptyForm = { nom: '', prenom: '', email: '', motDePasse: '', role: 'chef_projet', telephone: '', poste: '' };

const roleLabels = {
    directeur_general: 'Directeur Général',
    directeur_technique: 'Directeur Technique',
    chef_projet: 'Chef de Projet',
    conducteur_travaux: 'Conducteur de Travaux',
    responsable_admin_fin: 'Responsable Admin. & Fin.',
    magasinier: 'Magasinier',
    maitre_ouvrage_externe: "Maître d'Ouvrage (externe)",
};
const roleBadge = {
    directeur_general: 'badge-blue',
    directeur_technique: 'badge-teal',
    chef_projet: 'badge-green',
    conducteur_travaux: 'badge-amber',
    responsable_admin_fin: 'badge-purple',
    magasinier: 'badge-gray',
    maitre_ouvrage_externe: 'badge-gray',
};

export default function Utilisateurs() {
    const { user } = useAuth();
    const [utilisateurs, setUtilisateurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState('');

    const estAutorise = user?.role === 'directeur_general' || user?.role === 'directeur_technique';
    const peutSupprimer = user?.role === 'directeur_general';

    const load = () => {
        setLoading(true);
        getUtilisateurs().then(setUtilisateurs).finally(() => setLoading(false));
    };

    useEffect(() => { if (estAutorise) load(); else setLoading(false); }, [estAutorise]);

    const handleAdd = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await createUtilisateur(form);
            setShowModal(false);
            setForm(emptyForm);
            load();
        } catch (err) {
            setError(err.message || "Erreur lors de la création de l'utilisateur");
        }
    };

    const handleDelete = async (id, nom) => {
        if (!confirm(`Désactiver le compte de ${nom} ? Cette personne ne pourra plus se connecter.`)) return;
        await deleteUtilisateur(id);
        load();
    };

    if (!estAutorise) {
        return (
            <div>
                <div className="page-header"><div><h1>Utilisateurs</h1></div></div>
                <div className="empty-state">
                    <ShieldAlert size={32} style={{ marginBottom: 8, opacity: 0.6 }} />
                    <p>Cette section est réservée au Directeur Général et au Directeur Technique.</p>
                </div>
            </div>
        );
    }

    const handleReactivate = async (id, nom) => {
        if (!confirm(`Réactiver le compte de ${nom} ?`)) return;
        await reactiverUtilisateur(id);
        load();
    };


    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Utilisateurs</h1>
                    <p className="subtitle">Gestion des comptes et des rôles d'accès à BATIPME-SN</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Nouvel utilisateur
                </button>
            </div>

            {loading ? <div className="spinner" /> : (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Poste</th><th>Téléphone</th><th>Statut</th>{peutSupprimer && <th></th>}</tr>
                        </thead>
                        <tbody>
                            {utilisateurs.map(u => (
                                <tr key={u.id}>
                                    <td style={{ fontWeight: 600 }}>{u.prenom} {u.nom}</td>
                                    <td>{u.email}</td>
                                    <td><span className={`badge ${roleBadge[u.role] || 'badge-gray'}`}>{roleLabels[u.role] || u.role}</span></td>
                                    <td>{u.poste || '—'}</td>
                                    <td>{u.telephone || '—'}</td>
                                    <td><span className={`badge ${u.actif ? 'badge-green' : 'badge-red'}`}>{u.actif ? 'Actif' : 'Désactivé'}</span></td>
                                    {peutSupprimer && (
                                        <td>
                                            {u.id !== user.id && (
                                                u.actif ? (
                                                    <button className="btn btn-sm btn-secondary" onClick={() => handleDelete(u.id, `${u.prenom} ${u.nom}`)} title="Désactiver">
                                                        <Trash2 size={14} />
                                                    </button>
                                                ) : (
                                                    <button className="btn btn-sm btn-secondary" onClick={() => handleReactiver(u.id, `${u.prenom} ${u.nom}`)} title="Réactiver">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {utilisateurs.length === 0 && (
                                <tr><td colSpan={peutSupprimer ? 7 : 6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Aucun utilisateur</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Nouvel utilisateur</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAdd}>
                            {error && <div className="badge badge-red" style={{ display: 'block', marginBottom: 12, padding: 10 }}>{error}</div>}
                            <div className="form-row">
                                <div className="form-group"><label>Nom *</label><input className="form-input" required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
                                <div className="form-group"><label>Prénom *</label><input className="form-input" required value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Email *</label><input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                            <div className="form-group">
                                <label>Mot de passe temporaire * (8 caractères min.)</label>
                                <input className="form-input" type="text" required minLength={8} value={form.motDePasse} onChange={e => setForm({ ...form, motDePasse: e.target.value })} placeholder="À communiquer à l'utilisateur" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Rôle *</label>
                                    <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                        {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div className="form-group"><label>Poste</label><input className="form-input" value={form.poste} onChange={e => setForm({ ...form, poste: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Téléphone</label><input className="form-input" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} /></div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn btn-primary"><Plus size={16} /> Créer le compte</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}