import { useState, useEffect } from 'react';
import {
    getPersonnel, createPersonnel, getEngins, createEngin, getSousTraitants, createSousTraitant, getProjets,
    getPointages, createPointage, getEnginsProjet, affecterEngin,
} from '../../api/api';
import { Plus, X, HardHat, Truck, Briefcase, ClipboardList } from 'lucide-react';

const emptyAffectationEngin = () => ({ enginId: '', dateDebut: new Date().toISOString().slice(0, 10), dateFin: '', observations: '' });
const formatJour = (d) => (d ? new Date(String(d).slice(0, 10)).toLocaleDateString('fr-FR', { timeZone: 'UTC' }) : '—');

// Conflit d'affectation (409) : le serveur explique le conflit, l'utilisateur peut confirmer quand même
async function avecConfirmationConflit(envoyer) {
    try {
        return await envoyer(false);
    } catch (err) {
        if (err?.status === 409 && err?.conflit) {
            if (!window.confirm(`⚠️ ${err.message}\n\nEnregistrer quand même ?`)) return null;
            return envoyer(true);
        }
        throw err;
    }
}

const emptyPersonnel = { nom: '', prenom: '', poste: '', categorie: 'ouvrier_qualifie', typeContrat: 'journalier', tauxJournalier: '', salaireMensuel: '', telephone: '' };
const emptyEngin = { designation: '', immatriculation: '', marque: '', modele: '', type: 'propre', tauxJournalier: '' };
const emptySousTraitant = { nom: '', nomGerant: '', specialite: 'gros_oeuvre', region: '', telephone: '', email: '' };
const emptyPointage = { personnelId: '', date: new Date().toISOString().slice(0, 10), statut: 'present', heuresSupplementaires: '', observations: '' };

const categorieLabels = { encadrement: 'Encadrement', ouvrier_qualifie: 'Ouvrier qualifié', manoeuvre: 'Manœuvre', tacheronnage: 'Tâcheronnage', saisonnier: 'Saisonnier' };
const contratLabels = { cdi: 'CDI', cdd: 'CDD', journalier: 'Journalier', tacheronnage: 'Tâcheronnage' };
const statutEnginBadge = { disponible: 'badge-green', en_service: 'badge-blue', en_maintenance: 'badge-amber', hors_service: 'badge-gray' };
const specialiteLabels = {
    electricite: 'Électricité', plomberie: 'Plomberie', menuiserie_alu: 'Menuiserie Alu', menuiserie_bois: 'Menuiserie Bois',
    peinture: 'Peinture', carrelage: 'Carrelage', etancheite: 'Étanchéité', vrd: 'VRD', terrassement: 'Terrassement',
    gros_oeuvre: 'Gros œuvre', autre: 'Autre',
};
const statutPresenceLabels = { present: 'Présent', absent: 'Absent', demi_journee: 'Demi-journée', conge: 'Congé', maladie: 'Maladie' };
const statutPresenceBadge = { present: 'badge-green', absent: 'badge-gray', demi_journee: 'badge-amber', conge: 'badge-blue', maladie: 'badge-red' };

// projetIdFixe : page affichée comme onglet de la fiche chantier, ouverte sur les affectations du chantier
export default function Ressources({ projetIdFixe }) {
    const [tab, setTab] = useState(projetIdFixe ? 'affectations' : 'personnel');
    const [personnel, setPersonnel] = useState([]);
    const [engins, setEngins] = useState([]);
    const [sousTraitants, setSousTraitants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formPersonnel, setFormPersonnel] = useState(emptyPersonnel);
    const [formEngin, setFormEngin] = useState(emptyEngin);
    const [formSousTraitant, setFormSousTraitant] = useState(emptySousTraitant);

    // Affectations par projet
    const [projets, setProjets] = useState([]);
    const [projetId, setProjetId] = useState(projetIdFixe || '');
    const [pointages, setPointages] = useState([]);
    const [loadingPointages, setLoadingPointages] = useState(false);
    const [formPointage, setFormPointage] = useState(emptyPointage);
    const [enginsProjet, setEnginsProjet] = useState([]);
    const [formAffEngin, setFormAffEngin] = useState(emptyAffectationEngin);
    const [modalAffectation, setModalAffectation] = useState('pointage'); // 'pointage' | 'engin'

    const loadAll = () => {
        setLoading(true);
        Promise.all([getPersonnel(), getEngins(), getSousTraitants(), getProjets()])
            .then(([p, e, s, proj]) => {
                setPersonnel(p); setEngins(e); setSousTraitants(s);
                setProjets(proj);
                if (!projetIdFixe && proj.length > 0) setProjetId((avant) => avant || proj[0].id);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadAll(); }, []);

    const loadPointages = (pid) => {
        setLoadingPointages(true);
        Promise.all([getPointages(pid), getEnginsProjet(pid).catch(() => [])])
            .then(([pt, eng]) => { setPointages(pt); setEnginsProjet(eng || []); })
            .finally(() => setLoadingPointages(false));
    };

    useEffect(() => { if (projetId && tab === 'affectations') loadPointages(projetId); }, [projetId, tab]);

    const handleAddPersonnel = async (e) => {
        e.preventDefault();
        await createPersonnel({
            ...formPersonnel,
            tauxJournalier: formPersonnel.tauxJournalier ? Number(formPersonnel.tauxJournalier) : undefined,
            salaireMensuel: formPersonnel.salaireMensuel ? Number(formPersonnel.salaireMensuel) : undefined,
        });
        setShowModal(false); setFormPersonnel(emptyPersonnel); loadAll();
    };

    const handleAddEngin = async (e) => {
        e.preventDefault();
        await createEngin({ ...formEngin, tauxJournalier: formEngin.tauxJournalier ? Number(formEngin.tauxJournalier) : undefined });
        setShowModal(false); setFormEngin(emptyEngin); loadAll();
    };

    const handleAddSousTraitant = async (e) => {
        e.preventDefault();
        await createSousTraitant(formSousTraitant);
        setShowModal(false); setFormSousTraitant(emptySousTraitant); loadAll();
    };

    const handleAddPointage = async (e) => {
        e.preventDefault();
        try {
            const ok = await avecConfirmationConflit((forcer) => createPointage(projetId, {
                ...formPointage,
                heuresSupplementaires: formPointage.heuresSupplementaires ? Number(formPointage.heuresSupplementaires) : 0,
                ...(forcer ? { forcer: true } : {}),
            }));
            if (!ok) return;
            setShowModal(false); setFormPointage(emptyPointage); loadPointages(projetId);
        } catch (err) {
            alert([].concat(err?.message || 'Erreur lors du pointage.').join(' '));
        }
    };

    const handleAffecterEngin = async (e) => {
        e.preventDefault();
        try {
            const ok = await avecConfirmationConflit((forcer) => affecterEngin(projetId, {
                enginId: formAffEngin.enginId,
                dateDebut: formAffEngin.dateDebut,
                dateFin: formAffEngin.dateFin || undefined,
                observations: formAffEngin.observations || undefined,
                ...(forcer ? { forcer: true } : {}),
            }));
            if (!ok) return;
            setShowModal(false); setFormAffEngin(emptyAffectationEngin()); loadPointages(projetId);
        } catch (err) {
            alert([].concat(err?.message || "Erreur lors de l'affectation.").join(' '));
        }
    };

    const formatFCFA = (n) => n ? `${Number(n).toLocaleString('fr-FR')} FCFA` : '—';

    return (
        <div>
            {!projetIdFixe && (
                <div className="page-header">
                    <div>
                        <h1>Ressources</h1>
                        <p className="subtitle">Personnel, engins, sous-traitants et affectations par projet</p>
                    </div>
                    {tab === 'affectations' && projets.length > 0 && (
                        <select className="form-select" style={{ maxWidth: 320 }} value={projetId} onChange={e => setProjetId(e.target.value)}>
                            {projets.map(p => <option key={p.id} value={p.id}>{p.reference} — {p.intitule}</option>)}
                        </select>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                <button className={`btn btn-sm ${tab === 'personnel' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('personnel')}>
                    <HardHat size={14} /> Personnel ({personnel.length})
                </button>
                <button className={`btn btn-sm ${tab === 'engins' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('engins')}>
                    <Truck size={14} /> Engins ({engins.length})
                </button>
                <button className={`btn btn-sm ${tab === 'sous-traitants' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('sous-traitants')}>
                    <Briefcase size={14} /> Sous-traitants ({sousTraitants.length})
                </button>
                <button className={`btn btn-sm ${tab === 'affectations' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('affectations')}>
                    <ClipboardList size={14} /> Affectations par projet
                </button>
            </div>

            <div className="page-header" style={{ marginBottom: 12 }}>
                <div />
                {tab !== 'affectations' && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} />
                        {tab === 'personnel' ? ' Employé' : tab === 'engins' ? ' Engin' : ' Sous-traitant'}
                    </button>
                )}
                {tab === 'affectations' && projetId && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary" onClick={() => { setModalAffectation('engin'); setShowModal(true); }}>
                            <Truck size={18} /> Affecter un engin
                        </button>
                        <button className="btn btn-primary" onClick={() => { setModalAffectation('pointage'); setShowModal(true); }}>
                            <Plus size={18} /> Pointage
                        </button>
                    </div>
                )}
            </div>

            {tab === 'affectations' ? (
                projets.length === 0 ? (
                    <div className="empty-state"><p>Aucun projet trouvé. Crée d'abord un projet.</p></div>
                ) : loadingPointages ? <div className="spinner" /> : (
                    <>
                    <h3 style={{ fontSize: 15, margin: '4px 0 10px' }}>Engins sur ce chantier</h3>
                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
                        <table className="data-table">
                            <thead><tr><th>Engin</th><th>Du</th><th>Au</th><th>Observations</th></tr></thead>
                            <tbody>
                                {enginsProjet.map(a => (
                                    <tr key={a.id}>
                                        <td style={{ fontWeight: 600 }}>{a.engin?.designation}{a.engin?.immatriculation ? ` (${a.engin.immatriculation})` : ''}</td>
                                        <td>{formatJour(a.dateDebut)}</td>
                                        <td>{a.dateFin ? formatJour(a.dateFin) : 'sans date de fin'}</td>
                                        <td>{a.observations || '—'}</td>
                                    </tr>
                                ))}
                                {enginsProjet.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Aucun engin affecté à ce chantier</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <h3 style={{ fontSize: 15, margin: '4px 0 10px' }}>Pointages du personnel</h3>
                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table className="data-table">
                            <thead><tr><th>Employé</th><th>Date</th><th>Statut</th><th>Heures sup.</th><th>Montant jour</th><th>Observations</th></tr></thead>
                            <tbody>
                                {pointages.map(pt => (
                                    <tr key={pt.id}>
                                        <td style={{ fontWeight: 600 }}>{pt.personnel ? `${pt.personnel.prenom} ${pt.personnel.nom}` : '—'}</td>
                                        <td>{pt.date}</td>
                                        <td><span className={`badge ${statutPresenceBadge[pt.statut] || 'badge-gray'}`}>{statutPresenceLabels[pt.statut] || pt.statut}</span></td>
                                        <td>{pt.heuresSupplementaires || 0}</td>
                                        <td className="montant">{formatFCFA(pt.montantJournalier)}</td>
                                        <td>{pt.observations || '—'}</td>
                                    </tr>
                                ))}
                                {pointages.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Aucune affectation enregistrée pour ce projet</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    </>
                )
            ) : loading ? <div className="spinner" /> : (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    {tab === 'personnel' && (
                        <table className="data-table">
                            <thead><tr><th>Nom</th><th>Poste</th><th>Catégorie</th><th>Contrat</th><th>Taux/Salaire</th><th>Téléphone</th></tr></thead>
                            <tbody>
                                {personnel.map(p => (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: 600 }}>{p.prenom} {p.nom}</td>
                                        <td>{p.poste}</td>
                                        <td>{categorieLabels[p.categorie] || p.categorie}</td>
                                        <td><span className="badge badge-teal">{contratLabels[p.typeContrat] || p.typeContrat}</span></td>
                                        <td className="montant">{p.salaireMensuel ? `${formatFCFA(p.salaireMensuel)}/mois` : `${formatFCFA(p.tauxJournalier)}/jour`}</td>
                                        <td>{p.telephone || '—'}</td>
                                    </tr>
                                ))}
                                {personnel.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Aucun employé enregistré</td></tr>}
                            </tbody>
                        </table>
                    )}

                    {tab === 'engins' && (
                        <table className="data-table">
                            <thead><tr><th>Désignation</th><th>Immatriculation</th><th>Type</th><th>Statut</th><th>Taux journalier</th></tr></thead>
                            <tbody>
                                {engins.map(e => (
                                    <tr key={e.id}>
                                        <td style={{ fontWeight: 600 }}>{e.designation}</td>
                                        <td>{e.immatriculation || '—'}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{e.type}</td>
                                        <td><span className={`badge ${statutEnginBadge[e.statut] || 'badge-gray'}`}>{e.statut?.replace('_', ' ')}</span></td>
                                        <td className="montant">{formatFCFA(e.tauxJournalier)}</td>
                                    </tr>
                                ))}
                                {engins.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Aucun engin enregistré</td></tr>}
                            </tbody>
                        </table>
                    )}

                    {tab === 'sous-traitants' && (
                        <table className="data-table">
                            <thead><tr><th>Raison sociale</th><th>Spécialité</th><th>Région</th><th>Téléphone</th><th>Évaluation</th></tr></thead>
                            <tbody>
                                {sousTraitants.map(s => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 600 }}>{s.nom}</td>
                                        <td><span className="badge badge-teal">{specialiteLabels[s.specialite] || s.specialite}</span></td>
                                        <td>{s.region || '—'}</td>
                                        <td>{s.telephone || '—'}</td>
                                        <td>{s.evaluation ? `${s.evaluation}/10` : '—'}</td>
                                    </tr>
                                ))}
                                {sousTraitants.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Aucun sous-traitant enregistré</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
            {showModal && tab === 'personnel' && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Nouvel employé</h2><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
                        <form onSubmit={handleAddPersonnel}>
                            <div className="form-row">
                                <div className="form-group"><label>Nom *</label><input className="form-input" required value={formPersonnel.nom} onChange={e => setFormPersonnel({ ...formPersonnel, nom: e.target.value })} /></div>
                                <div className="form-group"><label>Prénom *</label><input className="form-input" required value={formPersonnel.prenom} onChange={e => setFormPersonnel({ ...formPersonnel, prenom: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Poste *</label><input className="form-input" required value={formPersonnel.poste} onChange={e => setFormPersonnel({ ...formPersonnel, poste: e.target.value })} placeholder="Maçon, Chef de chantier..." /></div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Catégorie *</label>
                                    <select className="form-select" value={formPersonnel.categorie} onChange={e => setFormPersonnel({ ...formPersonnel, categorie: e.target.value })}>
                                        {Object.entries(categorieLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Type de contrat *</label>
                                    <select className="form-select" value={formPersonnel.typeContrat} onChange={e => setFormPersonnel({ ...formPersonnel, typeContrat: e.target.value })}>
                                        {Object.entries(contratLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Taux journalier (FCFA)</label><input className="form-input" type="number" value={formPersonnel.tauxJournalier} onChange={e => setFormPersonnel({ ...formPersonnel, tauxJournalier: e.target.value })} /></div>
                                <div className="form-group"><label>Salaire mensuel (FCFA)</label><input className="form-input" type="number" value={formPersonnel.salaireMensuel} onChange={e => setFormPersonnel({ ...formPersonnel, salaireMensuel: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Téléphone</label><input className="form-input" value={formPersonnel.telephone} onChange={e => setFormPersonnel({ ...formPersonnel, telephone: e.target.value })} /></div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn btn-primary"><Plus size={16} /> Ajouter</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal && tab === 'engins' && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Nouvel engin</h2><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
                        <form onSubmit={handleAddEngin}>
                            <div className="form-group"><label>Désignation *</label><input className="form-input" required value={formEngin.designation} onChange={e => setFormEngin({ ...formEngin, designation: e.target.value })} placeholder="Pelle mécanique, Niveleuse..." /></div>
                            <div className="form-row">
                                <div className="form-group"><label>Immatriculation</label><input className="form-input" value={formEngin.immatriculation} onChange={e => setFormEngin({ ...formEngin, immatriculation: e.target.value })} /></div>
                                <div className="form-group">
                                    <label>Type *</label>
                                    <select className="form-select" value={formEngin.type} onChange={e => setFormEngin({ ...formEngin, type: e.target.value })}>
                                        <option value="propre">Propre</option>
                                        <option value="loue">Loué</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Marque</label><input className="form-input" value={formEngin.marque} onChange={e => setFormEngin({ ...formEngin, marque: e.target.value })} /></div>
                                <div className="form-group"><label>Modèle</label><input className="form-input" value={formEngin.modele} onChange={e => setFormEngin({ ...formEngin, modele: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Taux journalier (FCFA)</label><input className="form-input" type="number" value={formEngin.tauxJournalier} onChange={e => setFormEngin({ ...formEngin, tauxJournalier: e.target.value })} /></div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn btn-primary"><Plus size={16} /> Ajouter</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal && tab === 'sous-traitants' && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Nouveau sous-traitant</h2><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
                        <form onSubmit={handleAddSousTraitant}>
                            <div className="form-group"><label>Raison sociale *</label><input className="form-input" required value={formSousTraitant.nom} onChange={e => setFormSousTraitant({ ...formSousTraitant, nom: e.target.value })} /></div>
                            <div className="form-row">
                                <div className="form-group"><label>Nom du gérant</label><input className="form-input" value={formSousTraitant.nomGerant} onChange={e => setFormSousTraitant({ ...formSousTraitant, nomGerant: e.target.value })} /></div>
                                <div className="form-group">
                                    <label>Spécialité *</label>
                                    <select className="form-select" value={formSousTraitant.specialite} onChange={e => setFormSousTraitant({ ...formSousTraitant, specialite: e.target.value })}>
                                        {Object.entries(specialiteLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Région</label><input className="form-input" value={formSousTraitant.region} onChange={e => setFormSousTraitant({ ...formSousTraitant, region: e.target.value })} /></div>
                                <div className="form-group"><label>Téléphone</label><input className="form-input" value={formSousTraitant.telephone} onChange={e => setFormSousTraitant({ ...formSousTraitant, telephone: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Email</label><input className="form-input" type="email" value={formSousTraitant.email} onChange={e => setFormSousTraitant({ ...formSousTraitant, email: e.target.value })} /></div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn btn-primary"><Plus size={16} /> Ajouter</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal && tab === 'affectations' && modalAffectation === 'engin' && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Affecter un engin</h2><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
                        <form onSubmit={handleAffecterEngin}>
                            <div className="form-group">
                                <label>Engin *</label>
                                <select className="form-select" required value={formAffEngin.enginId} onChange={e => setFormAffEngin({ ...formAffEngin, enginId: e.target.value })}>
                                    <option value="">— Choisir —</option>
                                    {engins.map(en => (
                                        <option key={en.id} value={en.id}>
                                            {en.designation}{en.immatriculation ? ` (${en.immatriculation})` : ''}{en.statut && en.statut !== 'disponible' ? ` — ${en.statut.replace('_', ' ')}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Du *</label><input className="form-input" type="date" required value={formAffEngin.dateDebut} onChange={e => setFormAffEngin({ ...formAffEngin, dateDebut: e.target.value })} /></div>
                                <div className="form-group"><label>Au</label><input className="form-input" type="date" min={formAffEngin.dateDebut} value={formAffEngin.dateFin} onChange={e => setFormAffEngin({ ...formAffEngin, dateFin: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Observations</label><input className="form-input" value={formAffEngin.observations} onChange={e => setFormAffEngin({ ...formAffEngin, observations: e.target.value })} /></div>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>L'application vérifie que l'engin n'est pas déjà sur un autre chantier à ces dates, ni en maintenance.</p>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn btn-primary"><Truck size={16} /> Affecter</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal && tab === 'affectations' && modalAffectation === 'pointage' && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Nouveau pointage</h2><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
                        <form onSubmit={handleAddPointage}>
                            <div className="form-group">
                                <label>Employé *</label>
                                <select className="form-select" required value={formPointage.personnelId} onChange={e => setFormPointage({ ...formPointage, personnelId: e.target.value })}>
                                    <option value="">— Choisir —</option>
                                    {personnel.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom} — {p.poste}</option>)}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Date *</label><input className="form-input" type="date" required value={formPointage.date} onChange={e => setFormPointage({ ...formPointage, date: e.target.value })} /></div>
                                <div className="form-group">
                                    <label>Statut *</label>
                                    <select className="form-select" value={formPointage.statut} onChange={e => setFormPointage({ ...formPointage, statut: e.target.value })}>
                                        {Object.entries(statutPresenceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group"><label>Heures supplémentaires</label><input className="form-input" type="number" step="0.5" value={formPointage.heuresSupplementaires} onChange={e => setFormPointage({ ...formPointage, heuresSupplementaires: e.target.value })} /></div>
                            <div className="form-group"><label>Observations</label><input className="form-input" value={formPointage.observations} onChange={e => setFormPointage({ ...formPointage, observations: e.target.value })} /></div>
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