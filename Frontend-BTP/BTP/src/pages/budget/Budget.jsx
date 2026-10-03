import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjets, getBudgetKpi, getDevis, addLigneDevis, getDepenses, addDepense } from '../../api/api';
import { Plus, X, Wallet, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const emptyLigneDevis = { rubrique: 'materiaux', designation: '', unite: '', quantite: '', prixUnitaire: '' };
const emptyDepense = { type: 'engagement', libelle: '', montant: '', categorie: 'materiaux', date: new Date().toISOString().slice(0, 10) };

const RUBRIQUES = [
    { value: 'main_oeuvre', label: 'Main d\'œuvre' },
    { value: 'materiaux', label: 'Matériaux' },
    { value: 'materiel_engins', label: 'Matériel / Engins' },
    { value: 'sous_traitance', label: 'Sous-traitance' },
    { value: 'frais_chantier', label: 'Frais de chantier' },
    { value: 'frais_generaux', label: 'Frais généraux' },
    { value: 'imprevus', label: 'Imprévus' },
    { value: 'benefice', label: 'Bénéfice' },
];

const TYPES_DEPENSE = [
    { value: 'engagement', label: 'Engagement (bon de commande)' },
    { value: 'realisation', label: 'Réalisation (facture payée)' },
];

const CATEGORIES_DEPENSE = [
    { value: 'main_oeuvre', label: 'Main d\'œuvre' },
    { value: 'materiaux', label: 'Matériaux' },
    { value: 'materiel', label: 'Matériel' },
    { value: 'sous_traitance', label: 'Sous-traitance' },
    { value: 'frais_generaux', label: 'Frais généraux' },
    { value: 'autre', label: 'Autre' },
];

// Affiche le libellé lisible d'une valeur (ex. 'main_oeuvre' → « Main d'œuvre »)
const labelDe = (liste, valeur) => liste.find(x => x.value === valeur)?.label || valeur;
const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR');

export default function Budget() {
    const [projets, setProjets] = useState([]);
    const [projetId, setProjetId] = useState('');
    const [kpi, setKpi] = useState(null);
    const [devis, setDevis] = useState([]);
    const [depenses, setDepenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('devis');
    const [showModal, setShowModal] = useState(false);
    const [formDevis, setFormDevis] = useState(emptyLigneDevis);
    const [formDepense, setFormDepense] = useState(emptyDepense);
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
        Promise.all([getBudgetKpi(pid), getDevis(pid), getDepenses(pid)])
            .then(([k, d, dep]) => { setKpi(k); setDevis(d); setDepenses(dep); })
            .finally(() => setLoading(false));
    };

    useEffect(() => { if (projetId) loadProjetData(projetId); }, [projetId]);

    const handleAddDevis = async (e) => {
        e.preventDefault();
        await addLigneDevis(projetId, {
            ...formDevis,
            quantite: Number(formDevis.quantite),
            prixUnitaire: Number(formDevis.prixUnitaire),
        });
        setShowModal(false);
        setFormDevis(emptyLigneDevis);
        loadProjetData(projetId);
    };

    const handleAddDepense = async (e) => {
        e.preventDefault();
        await addDepense(projetId, { ...formDepense, montant: Number(formDepense.montant) });
        setShowModal(false);
        setFormDepense(emptyDepense);
        loadProjetData(projetId);
    };

    const formatFCFA = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

    if (projets.length === 0 && !loading) {
        return (
            <div>
                <div className="page-header"><div><h1>Budget</h1></div></div>
                <div className="empty-state">
                    <p>Aucun projet trouvé. Crée d'abord un projet pour gérer son budget.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/projets')}>Aller aux projets</button>
                </div>
            </div>
        );
    }

    const depassement = kpi && Number(kpi.montantDepense) > Number(kpi.montantMarche);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Budget</h1>
                    <p className="subtitle">Suivi des devis, dépenses et avenants par projet</p>
                </div>
                <select className="form-select" style={{ maxWidth: 320 }} value={projetId} onChange={e => setProjetId(e.target.value)}>
                    {projets.map(p => <option key={p.id} value={p.id}>{p.reference} — {p.intitule}</option>)}
                </select>
            </div>

            {loading ? <div className="spinner" /> : (
                <>
                    {kpi && (
                        <div className="kpi-grid">
                            <div className="kpi-card blue">
                                <div className="kpi-icon"><Wallet size={22} /></div>
                                <div className="kpi-value">{formatFCFA(kpi.montantMarche)}</div>
                                <div className="kpi-label">Montant du marché</div>
                            </div>
                            <div className="kpi-card teal">
                                <div className="kpi-icon"><TrendingUp size={22} /></div>
                                <div className="kpi-value">{formatFCFA(kpi.montantDevise)}</div>
                                <div className="kpi-label">Total devisé</div>
                            </div>
                            <div className={`kpi-card ${depassement ? 'amber' : 'green'}`}>
                                <div className="kpi-icon"><TrendingDown size={22} /></div>
                                <div className="kpi-value">{formatFCFA(kpi.montantDepense)}</div>
                                <div className="kpi-label">Total dépensé</div>
                            </div>
                            <div className={`kpi-card ${depassement ? 'amber' : 'blue'}`}>
                                <div className="kpi-icon"><AlertTriangle size={22} /></div>
                                <div className="kpi-value">{formatFCFA(Number(kpi.montantMarche) - Number(kpi.montantDepense))}</div>
                                <div className="kpi-label">{depassement ? 'Dépassement' : 'Solde restant'}</div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                        <button className={`btn btn-sm ${tab === 'devis' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('devis')}>Devis</button>
                        <button className={`btn btn-sm ${tab === 'depenses' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('depenses')}>Dépenses</button>
                    </div>

                    <div className="page-header" style={{ marginBottom: 12 }}>
                        <div />
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={18} /> {tab === 'devis' ? 'Ligne de devis' : 'Dépense'}
                        </button>
                    </div>

                    {tab === 'devis' ? (
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table className="data-table">
                                <thead>
                                    <tr><th>Rubrique</th><th>Désignation</th><th>Unité</th><th>Quantité</th><th>Prix unitaire</th><th>Total</th></tr>
                                </thead>
                                <tbody>
                                    {devis.map(d => (
                                        <tr key={d.id}>
                                            <td><span className="badge badge-blue">{labelDe(RUBRIQUES, d.rubrique)}</span></td>
                                            <td>{d.designation}</td>
                                            <td>{d.unite}</td>
                                            <td>{Number(d.quantite).toLocaleString('fr-FR')}</td>
                                            <td className="montant">{formatFCFA(d.prixUnitaire)}</td>
                                            <td className="montant">{formatFCFA(d.quantite * d.prixUnitaire)}</td>
                                        </tr>
                                    ))}
                                    {devis.length === 0 && (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Aucune ligne de devis</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table className="data-table">
                                <thead>
                                    <tr><th>Date</th><th>Libellé</th><th>Type</th><th>Catégorie</th><th>Montant</th></tr>
                                </thead>
                                <tbody>
                                    {depenses.map(d => (
                                        <tr key={d.id}>
                                            <td>{formatDate(d.date)}</td>
                                            <td>{d.libelle}</td>
                                            <td>
                                                <span className={`badge ${d.type === 'realisation' ? 'badge-green' : 'badge-amber'}`}>
                                                    {d.type === 'realisation' ? 'Réalisation' : 'Engagement'}
                                                </span>
                                            </td>
                                            <td><span className="badge badge-teal">{labelDe(CATEGORIES_DEPENSE, d.categorie)}</span></td>
                                            <td className="montant">{formatFCFA(d.montant)}</td>
                                        </tr>
                                    ))}
                                    {depenses.length === 0 && (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Aucune dépense enregistrée</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {showModal && tab === 'devis' && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Nouvelle ligne de devis</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddDevis}>
                            <div className="form-group">
                                <label>Rubrique *</label>
                                <select className="form-select" required value={formDevis.rubrique} onChange={e => setFormDevis({ ...formDevis, rubrique: e.target.value })}>
                                    {RUBRIQUES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Désignation *</label>
                                <input className="form-input" required value={formDevis.designation} onChange={e => setFormDevis({ ...formDevis, designation: e.target.value })} placeholder="Fondations en béton armé" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Unité *</label>
                                    <input className="form-input" required value={formDevis.unite} onChange={e => setFormDevis({ ...formDevis, unite: e.target.value })} placeholder="m³" />
                                </div>
                                <div className="form-group">
                                    <label>Quantité *</label>
                                    <input className="form-input" type="number" required value={formDevis.quantite} onChange={e => setFormDevis({ ...formDevis, quantite: e.target.value })} placeholder="120" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Prix unitaire (FCFA) *</label>
                                <input className="form-input" type="number" required value={formDevis.prixUnitaire} onChange={e => setFormDevis({ ...formDevis, prixUnitaire: e.target.value })} placeholder="45000" />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn btn-primary"><Plus size={16} /> Ajouter</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal && tab === 'depenses' && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Nouvelle dépense</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddDepense}>
                            <div className="form-group">
                                <label>Type *</label>
                                <select className="form-select" required value={formDepense.type} onChange={e => setFormDepense({ ...formDepense, type: e.target.value })}>
                                    {TYPES_DEPENSE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Libellé *</label>
                                <input className="form-input" required value={formDepense.libelle} onChange={e => setFormDepense({ ...formDepense, libelle: e.target.value })} placeholder="Achat ciment" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Catégorie *</label>
                                    <select className="form-select" required value={formDepense.categorie} onChange={e => setFormDepense({ ...formDepense, categorie: e.target.value })}>
                                        {CATEGORIES_DEPENSE.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Montant (FCFA) *</label>
                                    <input className="form-input" type="number" required value={formDepense.montant} onChange={e => setFormDepense({ ...formDepense, montant: e.target.value })} placeholder="850000" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Date *</label>
                                <input className="form-input" type="date" required value={formDepense.date} onChange={e => setFormDepense({ ...formDepense, date: e.target.value })} />
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