import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjets, getFournisseurs, createFournisseur, getBonsCommande, createBonCommande, getStock, createMouvement } from '../../api/api';
import { Plus, X, Truck, ShoppingCart, Boxes } from 'lucide-react';
import { LigneVide } from '../../components/EtatVide';

const emptyFournisseur = { nom: '', specialite: 'ciment', region: '', telephone: '', email: '', contactPrincipal: '' };
const emptyBC = { fournisseurId: '', date: '', montantTotal: '', dateLivraisonPrevue: '', observations: '' };
const emptyMouvement = { type: 'entree', materiau: '', unite: '', quantite: '', prixUnitaire: '', date: '', referenceBonLivraison: '', responsable: '', lot: '', observations: '' };

const specialiteLabels = {
    ciment: 'Ciment', fer_beton: 'Fer à béton', granulats: 'Granulats', bois: 'Bois', quincaillerie: 'Quincaillerie',
    location_engins: "Location d'engins", electricite: 'Électricité', plomberie: 'Plomberie', peinture: 'Peinture',
    carburant: 'Carburant', materiel_divers: 'Matériel divers',
};
const statutBCBadge = { demande: 'badge-gray', valide: 'badge-blue', en_livraison: 'badge-amber', receptionne: 'badge-green', annule: 'badge-red' };
const statutBCLabels = { demande: 'Demandé', valide: 'Validé', en_livraison: 'En livraison', receptionne: 'Réceptionné', annule: 'Annulé' };

// projetIdFixe : page affichée comme onglet « Achats » de la fiche chantier (pas de choix du projet)
export default function Approvisionnement({ projetIdFixe }) {
    const [tab, setTab] = useState(projetIdFixe ? 'commandes' : 'fournisseurs');
    const [projets, setProjets] = useState([]);
    const [projetId, setProjetId] = useState(projetIdFixe || '');
    const [fournisseurs, setFournisseurs] = useState([]);
    const [bonsCommande, setBonsCommande] = useState([]);
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formFournisseur, setFormFournisseur] = useState(emptyFournisseur);
    const [formBC, setFormBC] = useState(emptyBC);
    const [formMouvement, setFormMouvement] = useState(emptyMouvement);
    const navigate = useNavigate();

    useEffect(() => {
        getFournisseurs().then(setFournisseurs);
        getProjets().then(list => {
            setProjets(list);
            if (projetIdFixe) return;
            if (list.length > 0) setProjetId(list[0].id);
            else setLoading(false);
        });
    }, [projetIdFixe]);

    const loadProjetData = (pid) => {
        setLoading(true);
        Promise.all([getBonsCommande(pid), getStock(pid)])
            .then(([bc, s]) => { setBonsCommande(bc); setStock(s); })
            .finally(() => setLoading(false));
    };

    useEffect(() => { if (projetId) loadProjetData(projetId); }, [projetId]);

    const handleAddFournisseur = async (e) => {
        e.preventDefault();
        await createFournisseur(formFournisseur);
        setShowModal(false);
        setFormFournisseur(emptyFournisseur);
        getFournisseurs().then(setFournisseurs);
    };

    const handleAddBC = async (e) => {
        e.preventDefault();
        await createBonCommande(projetId, { ...formBC, montantTotal: Number(formBC.montantTotal) || 0 });
        setShowModal(false);
        setFormBC(emptyBC);
        loadProjetData(projetId);
    };

    const handleAddMouvement = async (e) => {
        e.preventDefault();
        await createMouvement(projetId, {
            ...formMouvement,
            quantite: Number(formMouvement.quantite),
            prixUnitaire: formMouvement.prixUnitaire ? Number(formMouvement.prixUnitaire) : undefined,
        });
        setShowModal(false);
        setFormMouvement(emptyMouvement);
        loadProjetData(projetId);
    };

    const formatFCFA = (n) => n ? `${Number(n).toLocaleString('fr-FR')} FCFA` : '—';

    return (
        <div>
            {!projetIdFixe && (
                <div className="page-header">
                    <div>
                        <h1>Approvisionnement</h1>
                        <p className="subtitle">Fournisseurs, bons de commande et stock de chantier</p>
                    </div>
                    {tab !== 'fournisseurs' && projets.length > 0 && (
                        <select className="form-select" style={{ maxWidth: 320 }} value={projetId} onChange={e => setProjetId(e.target.value)}>
                            {projets.map(p => <option key={p.id} value={p.id}>{p.reference} — {p.intitule}</option>)}
                        </select>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <button className={`btn btn-sm ${tab === 'fournisseurs' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('fournisseurs')}>
                    <Truck size={14} /> Fournisseurs ({fournisseurs.length})
                </button>
                <button className={`btn btn-sm ${tab === 'commandes' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('commandes')}>
                    <ShoppingCart size={14} /> Bons de commande
                </button>
                <button className={`btn btn-sm ${tab === 'stock' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('stock')}>
                    <Boxes size={14} /> Stock chantier
                </button>
            </div>

            {(tab === 'fournisseurs' || projets.length > 0) && (
                <div className="page-header" style={{ marginBottom: 12 }}>
                    <div />
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> {tab === 'fournisseurs' ? 'Fournisseur' : tab === 'commandes' ? 'Bon de commande' : 'Mouvement'}
                    </button>
                </div>
            )}

            {tab === 'fournisseurs' && (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead><tr><th>Nom</th><th>Spécialité</th><th>Région</th><th>Téléphone</th><th>Contact</th></tr></thead>
                        <tbody>
                            {fournisseurs.map(f => (
                                <tr key={f.id}>
                                    <td style={{ fontWeight: 600 }}>{f.nom}</td>
                                    <td><span className="badge badge-teal">{specialiteLabels[f.specialite] || f.specialite}</span></td>
                                    <td>{f.region || '—'}</td>
                                    <td>{f.telephone || '—'}</td>
                                    <td>{f.contactPrincipal || '—'}</td>
                                </tr>
                            ))}
                            {fournisseurs.length === 0 && <LigneVide colonnes={5} icone={Truck} titre="Aucun fournisseur enregistré"
                                texte="Ajoutez vos fournisseurs habituels (ciment, fer, sable…) pour les choisir ensuite dans vos bons de commande."
                                action="Ajouter un fournisseur" onAction={() => setShowModal(true)} />}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'commandes' && (projets.length === 0 ? (
                <div className="empty-state">
                    <p>Aucun projet trouvé. Crée d'abord un projet pour passer des commandes.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/projets')}>Aller aux projets</button>
                </div>
            ) : loading ? <div className="spinner" /> : (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead><tr><th>Date</th><th>Fournisseur</th><th>Montant</th><th>Statut</th><th>Livraison prévue</th></tr></thead>
                        <tbody>
                            {bonsCommande.map(bc => (
                                <tr key={bc.id}>
                                    <td>{new Date(bc.date).toLocaleDateString('fr-FR')}</td>
                                    <td>{bc.fournisseur?.nom || '—'}</td>
                                    <td className="montant">{formatFCFA(bc.montantTotal)}</td>
                                    <td><span className={`badge ${statutBCBadge[bc.statut] || 'badge-gray'}`}>{statutBCLabels[bc.statut] || bc.statut}</span></td>
                                    <td>{bc.dateLivraisonPrevue ? new Date(bc.dateLivraisonPrevue).toLocaleDateString('fr-FR') : '—'}</td>
                                </tr>
                            ))}
                            {bonsCommande.length === 0 && <LigneVide colonnes={5} icone={ShoppingCart} titre="Aucun bon de commande"
                                texte="Un bon de commande trace ce que vous achetez, à qui et pour quand. Le magasinier sait ainsi quoi réceptionner."
                                action="Créer un bon de commande" onAction={() => setShowModal(true)} />}
                        </tbody>
                    </table>
                </div>
            ))}

            {tab === 'stock' && (projets.length === 0 ? (
                <div className="empty-state">
                    <p>Aucun projet trouvé.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/projets')}>Aller aux projets</button>
                </div>
            ) : loading ? <div className="spinner" /> : (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead><tr><th>Matériau</th><th>Unité</th><th>Quantité en stock (théorique)</th></tr></thead>
                        <tbody>
                            {stock.map((s, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600 }}>{s.materiau}</td>
                                    <td>{s.unite}</td>
                                    <td className="montant" style={{ color: s.quantite < 0 ? '#ef4444' : undefined }}>{s.quantite}</td>
                                </tr>
                            ))}
                            {stock.length === 0 && <LigneVide colonnes={3} icone={Boxes} titre="Le stock du chantier est vide"
                                texte="Notez chaque entrée (livraison) et chaque sortie (utilisation) de matériaux : la quantité restante se calcule toute seule."
                                action="Ajouter un mouvement" onAction={() => setShowModal(true)} />}
                        </tbody>
                    </table>
                </div>
            ))}

            {showModal && tab === 'fournisseurs' && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Nouveau fournisseur</h2><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
                        <form onSubmit={handleAddFournisseur}>
                            <div className="form-group"><label>Nom *</label><input className="form-input" required value={formFournisseur.nom} onChange={e => setFormFournisseur({ ...formFournisseur, nom: e.target.value })} /></div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Spécialité *</label>
                                    <select className="form-select" value={formFournisseur.specialite} onChange={e => setFormFournisseur({ ...formFournisseur, specialite: e.target.value })}>
                                        {Object.entries(specialiteLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div className="form-group"><label>Région</label><input className="form-input" value={formFournisseur.region} onChange={e => setFormFournisseur({ ...formFournisseur, region: e.target.value })} /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Téléphone</label><input className="form-input" value={formFournisseur.telephone} onChange={e => setFormFournisseur({ ...formFournisseur, telephone: e.target.value })} /></div>
                                <div className="form-group"><label>Email</label><input className="form-input" type="email" value={formFournisseur.email} onChange={e => setFormFournisseur({ ...formFournisseur, email: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Contact principal</label><input className="form-input" value={formFournisseur.contactPrincipal} onChange={e => setFormFournisseur({ ...formFournisseur, contactPrincipal: e.target.value })} /></div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn btn-primary"><Plus size={16} /> Ajouter</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal && tab === 'commandes' && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Nouveau bon de commande</h2><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
                        <form onSubmit={handleAddBC}>
                            <div className="form-group">
                                <label>Fournisseur *</label>
                                <select className="form-select" required value={formBC.fournisseurId} onChange={e => setFormBC({ ...formBC, fournisseurId: e.target.value })}>
                                    <option value="">— Sélectionner —</option>
                                    {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Date *</label><input className="form-input" type="date" required value={formBC.date} onChange={e => setFormBC({ ...formBC, date: e.target.value })} /></div>
                                <div className="form-group"><label>Montant total (FCFA) *</label><input className="form-input" type="number" required value={formBC.montantTotal} onChange={e => setFormBC({ ...formBC, montantTotal: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Date de livraison prévue</label><input className="form-input" type="date" value={formBC.dateLivraisonPrevue} onChange={e => setFormBC({ ...formBC, dateLivraisonPrevue: e.target.value })} /></div>
                            <div className="form-group"><label>Observations</label><textarea className="form-input" rows="2" value={formBC.observations} onChange={e => setFormBC({ ...formBC, observations: e.target.value })} /></div>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8 }}>Rappel CDC : commande &lt; 500 000 FCFA validée par le Chef de Projet, au-delà validation du Directeur Général.</p>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn btn-primary"><Plus size={16} /> Créer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal && tab === 'stock' && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Nouveau mouvement de stock</h2><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
                        <form onSubmit={handleAddMouvement}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Type *</label>
                                    <select className="form-select" value={formMouvement.type} onChange={e => setFormMouvement({ ...formMouvement, type: e.target.value })}>
                                        <option value="entree">Entrée (réception)</option>
                                        <option value="sortie">Sortie (utilisation)</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Date *</label><input className="form-input" type="date" required value={formMouvement.date} onChange={e => setFormMouvement({ ...formMouvement, date: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Matériau *</label><input className="form-input" required value={formMouvement.materiau} onChange={e => setFormMouvement({ ...formMouvement, materiau: e.target.value })} placeholder="Ciment, Fer à béton, Sable..." /></div>
                            <div className="form-row">
                                <div className="form-group"><label>Unité *</label><input className="form-input" required value={formMouvement.unite} onChange={e => setFormMouvement({ ...formMouvement, unite: e.target.value })} placeholder="Sac, kg, m³..." /></div>
                                <div className="form-group"><label>Quantité *</label><input className="form-input" type="number" step="0.001" required value={formMouvement.quantite} onChange={e => setFormMouvement({ ...formMouvement, quantite: e.target.value })} /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Prix unitaire (FCFA)</label><input className="form-input" type="number" value={formMouvement.prixUnitaire} onChange={e => setFormMouvement({ ...formMouvement, prixUnitaire: e.target.value })} /></div>
                                <div className="form-group"><label>Réf. bon de livraison</label><input className="form-input" value={formMouvement.referenceBonLivraison} onChange={e => setFormMouvement({ ...formMouvement, referenceBonLivraison: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Responsable</label><input className="form-input" value={formMouvement.responsable} onChange={e => setFormMouvement({ ...formMouvement, responsable: e.target.value })} placeholder="Nom du magasinier" /></div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn btn-primary"><Plus size={16} /> Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}