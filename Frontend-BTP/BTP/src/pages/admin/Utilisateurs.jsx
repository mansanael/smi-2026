import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUtilisateurs, createUtilisateur, deleteUtilisateur, reactiverUtilisateur, supprimerUtilisateurDefinitivement, reinitialiserMotDePasse } from '../../api/api';
import { Plus, X, ShieldAlert, Trash2, UserCheck, KeyRound, Copy } from 'lucide-react';
import ReglagesEntreprise from '../../components/ReglagesEntreprise';
import BaremeDevis from '../../components/estimation/BaremeDevis';

const emptyForm = { nom: '', prenom: '', email: '', motDePasse: '', role: 'chef_projet', telephone: '', poste: '' };

// Mot de passe facile à dicter au téléphone (ex. Chantier4821!), à changer ensuite dans le profil
const motDePasseSuggere = () => `Chantier${String(crypto.getRandomValues(new Uint16Array(1))[0] % 10000).padStart(4, '0')}!`;

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
    const [voirDesactives, setVoirDesactives] = useState(false);
    const [reinit, setReinit] = useState(null); // { utilisateur, motDePasse, erreur, fait }

    const enregistrerMotDePasse = async (e) => {
        e.preventDefault();
        try {
            await reinitialiserMotDePasse(reinit.utilisateur.id, reinit.motDePasse);
            setReinit({ ...reinit, erreur: '', fait: true });
        } catch (err) {
            setReinit({ ...reinit, erreur: [].concat(err?.message || 'Erreur lors du changement de mot de passe').join(', ') });
        }
    };
    const nombreDesactives = utilisateurs.filter(u => !u.actif).length;
    const utilisateursAffiches = voirDesactives ? utilisateurs : utilisateurs.filter(u => u.actif);

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
        try {
            await deleteUtilisateur(id);
            load();
        } catch (err) {
            alert(err.message || 'Erreur lors de la désactivation du compte');
        }
    };

    const handleSupprimerDefinitivement = async (id, nom) => {
        if (!confirm(`Supprimer définitivement le compte de ${nom} ? Cette action est irréversible (les rapports et paiements gardent son nom).`)) return;
        try {
            await supprimerUtilisateurDefinitivement(id);
            load();
        } catch (err) {
            alert([].concat(err?.message || 'Erreur lors de la suppression du compte').join(' '));
        }
    };

    const handleReactiver = async (id, nom) => {
        if (!confirm(`Réactiver le compte de ${nom} ?`)) return;
        try {
            await reactiverUtilisateur(id);
            load();
        } catch (err) {
            alert(err.message || 'Erreur lors de la réactivation du compte');
        }
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

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Administration</h1>
                    <p className="subtitle">Réglages de l'entreprise, comptes et rôles d'accès à BATIPME-SN</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Nouvel utilisateur
                </button>
            </div>

            <ReglagesEntreprise />
            <BaremeDevis />

            {/* Les comptes désactivés (anciens essais, départs) sont cachés par défaut */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                <h3 style={{ fontSize: 15 }}>
                    Comptes ({utilisateurs.filter(u => u.actif).length} actifs{nombreDesactives ? `, ${nombreDesactives} désactivé${nombreDesactives > 1 ? 's' : ''}` : ''})
                </h3>
                {nombreDesactives > 0 && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                        <input type="checkbox" checked={voirDesactives} onChange={e => setVoirDesactives(e.target.checked)} />
                        Afficher les comptes désactivés
                    </label>
                )}
            </div>

            {loading ? <div className="spinner" /> : (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Poste</th><th>Téléphone</th><th>Statut</th>{estAutorise && <th>Actions</th>}</tr>
                        </thead>
                        <tbody>
                            {utilisateursAffiches.map(u => (
                                <tr key={u.id} style={u.actif ? undefined : { opacity: 0.6 }}>
                                    <td style={{ fontWeight: 600 }}>{u.prenom} {u.nom}</td>
                                    <td>{u.email}</td>
                                    <td><span className={`badge ${roleBadge[u.role] || 'badge-gray'}`}>{roleLabels[u.role] || u.role}</span></td>
                                    <td>{u.poste || '—'}</td>
                                    <td>{u.telephone || '—'}</td>
                                    <td><span className={`badge ${u.actif ? 'badge-green' : 'badge-red'}`}>{u.actif ? 'Actif' : 'Désactivé'}</span></td>
                                    {estAutorise && (
                                        <td>
                                          <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                                            {/* Après « Mot de passe oublié » ; seul le DG change le mot de passe d'un DG */}
                                            {u.actif && u.id !== user.id && (u.role !== 'directeur_general' || peutSupprimer) && (
                                                <button className="btn btn-sm btn-secondary" style={{ whiteSpace: 'nowrap' }} title="Donner un nouveau mot de passe"
                                                    onClick={() => setReinit({ utilisateur: u, motDePasse: motDePasseSuggere(), erreur: '', fait: false })}>
                                                    <KeyRound size={14} /> Mot de passe
                                                </button>
                                            )}
                                            {peutSupprimer && u.id !== user.id && (
                                                u.actif ? (
                                                    <button className="btn btn-sm btn-secondary" onClick={() => handleDelete(u.id, `${u.prenom} ${u.nom}`)} title="Désactiver">
                                                        <Trash2 size={14} />
                                                    </button>
                                                ) : (
                                                    <span style={{ display: 'inline-flex', gap: 6 }}>
                                                        <button className="btn btn-sm btn-secondary" onClick={() => handleReactiver(u.id, `${u.prenom} ${u.nom}`)} title="Réactiver">
                                                            <UserCheck size={14} /> Réactiver
                                                        </button>
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleSupprimerDefinitivement(u.id, `${u.prenom} ${u.nom}`)} title="Supprimer définitivement">
                                                            <Trash2 size={14} /> Supprimer
                                                        </button>
                                                    </span>
                                                )
                                            )}
                                          </span>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {utilisateursAffiches.length === 0 && (
                                <tr><td colSpan={estAutorise ? 7 : 6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Aucun utilisateur</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {reinit && (
                <div className="modal-overlay" onClick={() => setReinit(null)}>
                    <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><KeyRound size={20} /> Nouveau mot de passe</h2>
                            <button className="modal-close" onClick={() => setReinit(null)}><X size={20} /></button>
                        </div>
                        {reinit.fait ? (
                            <div style={{ display: 'grid', gap: 12, fontSize: 14, lineHeight: 1.6 }}>
                                <p>Le mot de passe de <strong>{reinit.utilisateur.prenom} {reinit.utilisateur.nom}</strong> est maintenant :</p>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <code style={{ flex: 1, fontSize: 18, fontWeight: 700, padding: '10px 14px', borderRadius: 10, background: 'var(--bg-tertiary)' }}>{reinit.motDePasse}</code>
                                    <button className="btn btn-secondary btn-sm" onClick={() => navigator.clipboard?.writeText(reinit.motDePasse)} title="Copier">
                                        <Copy size={14} /> Copier
                                    </button>
                                </div>
                                <p style={{ color: 'var(--text-secondary)' }}>
                                    Communiquez-le à la personne (de vive voix ou par téléphone). Elle pourra le changer dans son profil.
                                    Pensez à marquer l’alerte « mot de passe oublié » comme vue.
                                </p>
                                <button className="btn btn-primary" style={{ justifySelf: 'end' }} onClick={() => setReinit(null)}>Terminé</button>
                            </div>
                        ) : (
                            <form onSubmit={enregistrerMotDePasse}>
                                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                                    Nouveau mot de passe pour <strong style={{ color: 'var(--text-primary)' }}>{reinit.utilisateur.prenom} {reinit.utilisateur.nom}</strong> ({reinit.utilisateur.email}).
                                    L’ancien ne marchera plus.
                                </p>
                                {reinit.erreur && <div className="login-error" style={{ marginBottom: 12 }}>{reinit.erreur}</div>}
                                <div className="form-group">
                                    <label>Mot de passe (8 caractères min.)</label>
                                    <input className="form-input" type="text" required minLength={8} value={reinit.motDePasse}
                                        onChange={e => setReinit({ ...reinit, motDePasse: e.target.value })} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setReinit(null)}>Annuler</button>
                                    <button type="submit" className="btn btn-primary">Enregistrer</button>
                                </div>
                            </form>
                        )}
                    </div>
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