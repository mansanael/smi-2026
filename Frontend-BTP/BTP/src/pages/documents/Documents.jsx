import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjets, getDocuments, createDocument, getExpirations } from '../../api/api';
import { Plus, X, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { estLectureSeule } from '../../roles';

const emptyForm = { nom: '', type: 'plan', phase: 'execution', cheminFichier: '', dateExpiration: '', deposePar: '' };

const typeLabels = {
    dao: 'DAO', offre_technique: 'Offre technique', offre_financiere: 'Offre financière', marche_signe: 'Marché signé',
    ccap: 'CCAP', cctp: 'CCTP', bordereau_prix: 'Bordereau de prix', pgss: 'PGSS', pv_installation: 'PV installation',
    planning: 'Planning', journal_chantier: 'Journal chantier', pv_reunion: 'PV réunion', ordre_service: 'Ordre de service',
    avenant: 'Avenant', pv_reception_provisoire: 'PV réception provisoire', pv_reception_definitive: 'PV réception définitive',
    caution: 'Caution', attestation_fiscale: 'Attestation fiscale', plan: 'Plan', photo: 'Photo', autre: 'Autre',
};
const phaseLabels = {
    appel_offres: "Appel d'offres", contractualisation: 'Contractualisation', preparation: 'Préparation',
    execution: 'Exécution', reception: 'Réception', cloture: 'Clôture',
};
const phaseBadge = {
    appel_offres: 'badge-gray', contractualisation: 'badge-purple', preparation: 'badge-amber',
    execution: 'badge-blue', reception: 'badge-teal', cloture: 'badge-green',
};

export default function Documents() {
    const { user } = useAuth();
    const lectureSeule = estLectureSeule(user);
    const [projets, setProjets] = useState([]);
    const [projetId, setProjetId] = useState('');
    const [documents, setDocuments] = useState([]);
    const [expirations, setExpirations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const navigate = useNavigate();

    useEffect(() => {
        getProjets().then(list => {
            setProjets(list);
            if (list.length > 0) setProjetId(list[0].id);
            else setLoading(false);
        });
        getExpirations().then(setExpirations).catch(() => { });
    }, []);

    const loadProjetData = (pid) => {
        setLoading(true);
        getDocuments(pid).then(setDocuments).finally(() => setLoading(false));
    };

    useEffect(() => { if (projetId) loadProjetData(projetId); }, [projetId]);

    const handleAdd = async (e) => {
        e.preventDefault();
        await createDocument(projetId, { ...form, dateExpiration: form.dateExpiration || undefined });
        setShowModal(false);
        setForm(emptyForm);
        loadProjetData(projetId);
    };

    if (projets.length === 0 && !loading) {
        return (
            <div>
                <div className="page-header"><div><h1>Documents</h1></div></div>
                <div className="empty-state">
                    <p>Aucun projet trouvé. Crée d'abord un projet pour y attacher des documents.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/projets')}>Aller aux projets</button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Documents</h1>
                    <p className="subtitle">Plans, PV, contrats et pièces administratives par projet</p>
                </div>
                <select className="form-select" style={{ maxWidth: 320 }} value={projetId} onChange={e => setProjetId(e.target.value)}>
                    {projets.map(p => <option key={p.id} value={p.id}>{p.reference} — {p.intitule}</option>)}
                </select>
            </div>

            {expirations.length > 0 && (
                <div className="glass-card" style={{ marginBottom: 20, borderLeft: '3px solid var(--accent-amber)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertCircle size={18} color="var(--accent-amber)" />
                    <span>{expirations.length} document(s) arrivent à expiration (attestations, cautions...) — vérifie leur validité.</span>
                </div>
            )}

            <div className="page-header" style={{ marginBottom: 12 }}>
                <div />
                {!lectureSeule && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> Document
                    </button>
                )}
            </div>

            {loading ? <div className="spinner" /> : (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr><th>Nom</th><th>Type</th><th>Phase</th><th>Version</th><th>Expiration</th><th>Déposé par</th></tr>
                        </thead>
                        <tbody>
                            {documents.map(d => (
                                <tr key={d.id}>
                                    <td style={{ fontWeight: 600 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FileText size={14} />{d.nom}</span></td>
                                    <td>{typeLabels[d.type] || d.type}</td>
                                    <td><span className={`badge ${phaseBadge[d.phase] || 'badge-gray'}`}>{phaseLabels[d.phase] || d.phase}</span></td>
                                    <td>v{d.version}</td>
                                    <td>{d.dateExpiration ? new Date(d.dateExpiration).toLocaleDateString('fr-FR') : '—'}</td>
                                    <td>{d.deposePar || '—'}</td>
                                </tr>
                            ))}
                            {documents.length === 0 && (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Aucun document enregistré</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Nouveau document</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAdd}>
                            <div className="form-group">
                                <label>Nom du document *</label>
                                <input className="form-input" required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Plan de fondation v2" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Type *</label>
                                    <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Phase *</label>
                                    <select className="form-select" value={form.phase} onChange={e => setForm({ ...form, phase: e.target.value })}>
                                        {Object.entries(phaseLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Chemin / URL du fichier *</label>
                                <input className="form-input" required value={form.cheminFichier} onChange={e => setForm({ ...form, cheminFichier: e.target.value })} placeholder="https://... ou chemin de stockage" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date d'expiration</label>
                                    <input className="form-input" type="date" value={form.dateExpiration} onChange={e => setForm({ ...form, dateExpiration: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Déposé par</label>
                                    <input className="form-input" value={form.deposePar} onChange={e => setForm({ ...form, deposePar: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn btn-primary"><Plus size={16} /> Ajouter</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}