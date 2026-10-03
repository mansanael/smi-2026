import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjets, getSituations, createSituation, updateSituation, updateStatutSituation, getRecapitulatif } from '../../api/api';
import { Plus, X, Receipt, Wallet, CheckCircle2, Clock, Pencil } from 'lucide-react';

const emptyForm = { numero: '', mois: '', montantHTCumul: '', montantHTNouveau: '', pourcentageAvancement: '' };

const statutBadge = { brouillon: 'badge-gray', soumise: 'badge-blue', validee: 'badge-teal', payee: 'badge-green', rejetee: 'badge-red' };
const statutLabels = { brouillon: 'Brouillon', soumise: 'Soumise', validee: 'Validée', payee: 'Payée', rejetee: 'Rejetée' };

// Actions possibles selon le statut actuel (circuit de validation)
const actionsStatut = {
    brouillon: [{ valeur: 'soumise', label: 'Soumettre' }],
    soumise: [{ valeur: 'validee', label: 'Valider' }, { valeur: 'rejetee', label: 'Rejeter' }],
    validee: [{ valeur: 'payee', label: 'Marquer payée' }, { valeur: 'rejetee', label: 'Rejeter' }],
    payee: [],
    rejetee: [{ valeur: 'brouillon', label: 'Remettre en brouillon' }],
};

export default function Facturation() {
    const [projets, setProjets] = useState([]);
    const [projetId, setProjetId] = useState('');
    const [situations, setSituations] = useState([]);
    const [recap, setRecap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null); // null = création, sinon id de la situation modifiée
    const navigate = useNavigate();

    useEffect(() => {
        getProjets().then(list => {
            setProjets(list);
            if (list.length > 0) setProjetId(list[0].id);
            else setLoading(false);
        });
    }, []);

    const loadProjetData = (pid) => {
        setLoading(true);
        Promise.all([getSituations(pid), getRecapitulatif(pid)])
            .then(([s, r]) => { setSituations(s); setRecap(r); })
            .finally(() => setLoading(false));
    };

    useEffect(() => { if (projetId) loadProjetData(projetId); }, [projetId]);

    const messageErreur = (err) => [].concat(err?.message || 'Une erreur est survenue').join(', ');

    const ouvrirCreation = () => {
        setEditingId(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const ouvrirEdition = (s) => {
        setEditingId(s.id);
        setForm({
            numero: String(s.numero),
            mois: String(s.mois).slice(0, 10),
            montantHTCumul: String(Number(s.montantHTCumul)),
            montantHTNouveau: String(Number(s.montantHTNouveau)),
            pourcentageAvancement: String(Number(s.pourcentageAvancement)),
        });
        setShowModal(true);
    };

    const fermerModal = () => {
        setShowModal(false);
        setEditingId(null);
        setForm(emptyForm);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = {
            numero: Number(form.numero),
            mois: form.mois,
            montantHTCumul: Number(form.montantHTCumul),
            montantHTNouveau: Number(form.montantHTNouveau),
            pourcentageAvancement: Number(form.pourcentageAvancement) || 0,
        };
        try {
            if (editingId) await updateSituation(projetId, editingId, data);
            else await createSituation(projetId, data);
            fermerModal();
            loadProjetData(projetId);
        } catch (err) {
            alert(messageErreur(err));
        }
    };

    const handleStatut = async (s, action) => {
        if (!window.confirm(`${action.label} la situation n°${s.numero} ?`)) return;
        try {
            await updateStatutSituation(projetId, s.id, action.valeur);
            loadProjetData(projetId);
        } catch (err) {
            alert(messageErreur(err));
        }
    };

    const formatFCFA = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

    if (projets.length === 0 && !loading) {
        return (
            <div>
                <div className="page-header"><div><h1>Facturation</h1></div></div>
                <div className="empty-state">
                    <p>Aucun projet trouvé. Crée d'abord un projet pour générer ses situations de travaux.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/projets')}>Aller aux projets</button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Facturation</h1>
                    <p className="subtitle">Situations de travaux (décomptes mensuels)</p>
                </div>
                <select className="form-select" style={{ maxWidth: 320 }} value={projetId} onChange={e => setProjetId(e.target.value)}>
                    {projets.map(p => <option key={p.id} value={p.id}>{p.reference} — {p.intitule}</option>)}
                </select>
            </div>

            {loading ? <div className="spinner" /> : (
                <>
                    {recap && (
                        <div className="kpi-grid">
                            <div className="kpi-card blue">
                                <div className="kpi-icon"><Receipt size={22} /></div>
                                <div className="kpi-value">{recap.nombreSituations}</div>
                                <div className="kpi-label">Situations émises</div>
                            </div>
                            <div className="kpi-card teal">
                                <div className="kpi-icon"><Wallet size={22} /></div>
                                <div className="kpi-value">{formatFCFA(recap.totalNetAPayer)}</div>
                                <div className="kpi-label">Total net à payer</div>
                            </div>
                            <div className="kpi-card green">
                                <div className="kpi-icon"><CheckCircle2 size={22} /></div>
                                <div className="kpi-value">{formatFCFA(recap.totalEncaisse)}</div>
                                <div className="kpi-label">Total encaissé</div>
                            </div>
                            <div className="kpi-card amber">
                                <div className="kpi-icon"><Clock size={22} /></div>
                                <div className="kpi-value">{formatFCFA(recap.restantAEncaisser)}</div>
                                <div className="kpi-label">Restant à encaisser</div>
                            </div>
                        </div>
                    )}

                    <div className="page-header" style={{ marginBottom: 12 }}>
                        <div />
                        <button className="btn btn-primary" onClick={ouvrirCreation}>
                            <Plus size={18} /> Situation de travaux
                        </button>
                    </div>

                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>N°</th><th>Mois</th><th>Montant HT (situation)</th><th>Avancement</th>
                                    <th>Retenue garantie</th><th>TVA</th><th>Net à payer</th><th>Statut</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {situations.map(s => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 600 }}>{s.numero}</td>
                                        <td>{new Date(s.mois).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</td>
                                        <td className="montant">{formatFCFA(s.montantHTNouveau)}</td>
                                        <td>{s.pourcentageAvancement}%</td>
                                        <td className="montant">{formatFCFA(s.retenueGarantie)}</td>
                                        <td className="montant">{formatFCFA(s.montantTVA)}</td>
                                        <td className="montant" style={{ fontWeight: 600 }}>{formatFCFA(s.netAPayer)}</td>
                                        <td><span className={`badge ${statutBadge[s.statut] || 'badge-gray'}`}>{statutLabels[s.statut] || s.statut}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {(actionsStatut[s.statut] || []).map(a => (
                                                    <button key={a.valeur} className="btn btn-secondary btn-sm" onClick={() => handleStatut(s, a)}>
                                                        {a.label}
                                                    </button>
                                                ))}
                                                {['brouillon', 'rejetee'].includes(s.statut) && (
                                                    <button className="btn btn-secondary btn-sm btn-icon" title="Modifier" onClick={() => ouvrirEdition(s)}>
                                                        <Pencil size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {situations.length === 0 && (
                                    <tr><td colSpan="9" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Aucune situation de travaux émise</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={fermerModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingId ? 'Modifier la situation de travaux' : 'Nouvelle situation de travaux'}</h2>
                            <button className="modal-close" onClick={fermerModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Numéro *</label>
                                    <input className="form-input" type="number" required value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} placeholder="1" />
                                </div>
                                <div className="form-group">
                                    <label>Mois *</label>
                                    <input className="form-input" type="date" required value={form.mois} onChange={e => setForm({ ...form, mois: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Montant HT cumulé depuis le début des travaux *</label>
                                <input className="form-input" type="number" required value={form.montantHTCumul} onChange={e => setForm({ ...form, montantHTCumul: e.target.value })} placeholder="45000000" />
                            </div>
                            <div className="form-group">
                                <label>Montant HT de cette situation *</label>
                                <input className="form-input" type="number" required value={form.montantHTNouveau} onChange={e => setForm({ ...form, montantHTNouveau: e.target.value })} placeholder="12000000" />
                            </div>
                            <div className="form-group">
                                <label>Pourcentage d'avancement global (%)</label>
                                <input className="form-input" type="number" min="0" max="100" value={form.pourcentageAvancement} onChange={e => setForm({ ...form, pourcentageAvancement: e.target.value })} placeholder="35" />
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8 }}>
                                Les montants de TVA (18%), TCS (1%), retenue de garantie (5%) et avance à déduire sont calculés automatiquement par le serveur, conformément aux taux légaux en vigueur au Sénégal.
                            </p>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={fermerModal}>Annuler</button>
                                <button type="submit" className="btn btn-primary">{editingId ? 'Enregistrer' : <><Plus size={16} /> Générer</>}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}