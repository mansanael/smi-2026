import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getProjets, getPaiements, addVersement, deleteVersement,
    addEcheance, deleteEcheance, relancerEcheance,
} from '../../api/api';
import { Plus, X, Wallet, Banknote, Clock, AlertTriangle, BellRing, Trash2, CalendarPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES_SAISIE_PAIEMENTS, estLectureSeule } from '../../roles';

const aujourdhui = () => new Date().toISOString().slice(0, 10);
const emptyVersement = () => ({ date: aujourdhui(), montant: '', mode: 'virement', reference: '', observations: '' });
const emptyEcheance = { libelle: '', montant: '', dateLimite: '' };

const MODES = {
    especes: 'Espèces',
    virement: 'Virement',
    cheque: 'Chèque',
    wave: 'Wave',
    orange_money: 'Orange Money',
    autre: 'Autre',
};

const STATUTS = {
    payee: { label: 'Payée', badge: 'badge-green' },
    partielle: { label: 'Partiellement payée', badge: 'badge-blue' },
    en_retard: { label: 'En retard', badge: 'badge-red' },
    a_venir: { label: 'À venir', badge: 'badge-gray' },
};

const fcfa = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const messageErreur = (err) => [].concat(err?.message || "Erreur lors de l'enregistrement.").join(' ');

// projetIdFixe : page affichée comme onglet de la fiche chantier (pas de choix du projet)
export default function Paiements({ projetIdFixe }) {
    const { user } = useAuth();
    const peutSaisir = ROLES_SAISIE_PAIEMENTS.includes(user?.role);
    const estClient = estLectureSeule(user);
    const [projets, setProjets] = useState([]);
    const [projetId, setProjetId] = useState(projetIdFixe || '');
    const [suivi, setSuivi] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // 'versement' | 'echeance' | null
    const [formVersement, setFormVersement] = useState(emptyVersement());
    const [formEcheance, setFormEcheance] = useState(emptyEcheance);
    const [erreur, setErreur] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        getProjets().then(list => {
            setProjets(list);
            if (projetIdFixe) return;
            if (list.length > 0) setProjetId(list[0].id);
            else setLoading(false);
        });
    }, [projetIdFixe]);

    const charger = (pid) => {
        setLoading(true);
        getPaiements(pid).then(setSuivi).finally(() => setLoading(false));
    };

    useEffect(() => { if (projetId) charger(projetId); }, [projetId]);

    const ouvrir = (type) => {
        setErreur('');
        if (type === 'versement') setFormVersement(emptyVersement());
        else setFormEcheance(emptyEcheance);
        setModal(type);
    };

    const enregistrerVersement = async (e) => {
        e.preventDefault();
        try {
            await addVersement(projetId, {
                ...formVersement,
                montant: Number(formVersement.montant),
                reference: formVersement.reference || undefined,
                observations: formVersement.observations || undefined,
            });
            setModal(null);
            charger(projetId);
        } catch (err) {
            setErreur(messageErreur(err));
        }
    };

    const enregistrerEcheance = async (e) => {
        e.preventDefault();
        try {
            await addEcheance(projetId, { ...formEcheance, montant: Number(formEcheance.montant) });
            setModal(null);
            charger(projetId);
        } catch (err) {
            setErreur(messageErreur(err));
        }
    };

    const supprimerVersement = async (v) => {
        if (!confirm(`Supprimer le versement de ${fcfa(v.montant)} du ${formatDate(v.date)} ?`)) return;
        await deleteVersement(projetId, v.id);
        charger(projetId);
    };

    const supprimerEcheance = async (ech) => {
        if (!confirm(`Supprimer l'échéance « ${ech.libelle} » ?`)) return;
        await deleteEcheance(projetId, ech.id);
        charger(projetId);
    };

    const relancer = async (ech) => {
        await relancerEcheance(projetId, ech.id);
        charger(projetId);
    };

    if (!projetIdFixe && projets.length === 0 && !loading) {
        return (
            <div>
                <div className="page-header"><div><h1>Paiements du client</h1></div></div>
                <div className="empty-state">
                    <p>Aucun projet trouvé.</p>
                    {!estClient && <button className="btn btn-primary" onClick={() => navigate('/projets')}>Aller aux projets</button>}
                </div>
            </div>
        );
    }

    const ecartEcheancier = suivi && suivi.echeances.length > 0 && Math.abs(suivi.totalEcheancier - suivi.montantMarche) >= 1;

    return (
        <div>
            {!projetIdFixe && (
                <div className="page-header">
                    <div>
                        <h1>Paiements du client</h1>
                        <p className="subtitle">
                            {estClient ? 'Vos échéances et l’historique de vos versements' : 'Échéancier, versements reçus et suivi des impayés'}
                        </p>
                    </div>
                    <select className="form-select" style={{ maxWidth: 320 }} value={projetId} onChange={e => setProjetId(e.target.value)}>
                        {projets.map(p => <option key={p.id} value={p.id}>{p.reference} — {p.intitule}</option>)}
                    </select>
                </div>
            )}

            {loading || !suivi ? <div className="spinner" /> : (
                <>
                    <div className="kpi-grid">
                        <div className="kpi-card blue">
                            <div className="kpi-icon"><Wallet size={22} /></div>
                            <div className="kpi-value montant" style={{ fontSize: 22 }}>{fcfa(suivi.montantMarche)}</div>
                            <div className="kpi-label">Montant du marché</div>
                        </div>
                        <div className="kpi-card green">
                            <div className="kpi-icon"><Banknote size={22} /></div>
                            <div className="kpi-value montant" style={{ fontSize: 22 }}>{fcfa(suivi.totalRecu)}</div>
                            <div className="kpi-label">Reçu ({suivi.tauxEncaissement} %)</div>
                            <div className="progress-bar" style={{ marginTop: 8 }}>
                                <div className="progress-fill green" style={{ width: `${Math.min(100, suivi.tauxEncaissement)}%` }} />
                            </div>
                        </div>
                        <div className="kpi-card amber">
                            <div className="kpi-icon"><Clock size={22} /></div>
                            <div className="kpi-value montant" style={{ fontSize: 22 }}>{fcfa(suivi.resteAPayer)}</div>
                            <div className="kpi-label">Reste à payer</div>
                        </div>
                        <div className={`kpi-card ${suivi.nombreEcheancesEnRetard > 0 ? 'red' : 'teal'}`}>
                            <div className="kpi-icon"><AlertTriangle size={22} /></div>
                            <div className="kpi-value montant" style={{ fontSize: 22 }}>{fcfa(suivi.montantEnRetard)}</div>
                            <div className="kpi-label">En retard ({suivi.nombreEcheancesEnRetard} échéance{suivi.nombreEcheancesEnRetard > 1 ? 's' : ''})</div>
                        </div>
                    </div>

                    {suivi.nombreEcheancesEnRetard > 0 && (
                        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
                            {estClient
                                ? `${suivi.nombreEcheancesEnRetard} échéance(s) dépassée(s) pour un total de ${fcfa(suivi.montantEnRetard)}.`
                                : `Impayés : ${fcfa(suivi.montantEnRetard)} en retard sur ${suivi.nombreEcheancesEnRetard} échéance(s). Pensez à relancer le client.`}
                        </div>
                    )}

                    {/* ─── ÉCHÉANCIER ─────────────────────────────────────────── */}
                    <div className="glass-card" style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Échéancier ({suivi.echeances.length})</h3>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                                    Les versements règlent les échéances dans l'ordre des dates limites.
                                </p>
                            </div>
                            {peutSaisir && (
                                <button className="btn btn-secondary btn-sm" onClick={() => ouvrir('echeance')}>
                                    <CalendarPlus size={16} /> Ajouter une échéance
                                </button>
                            )}
                        </div>

                        {ecartEcheancier && !estClient && (
                            <div className="alert alert-warning">
                                Le total de l'échéancier ({fcfa(suivi.totalEcheancier)}) ne correspond pas au montant du marché ({fcfa(suivi.montantMarche)}).
                            </div>
                        )}

                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Échéance</th><th>Date limite</th><th>Montant</th><th>Réglé</th><th>Statut</th>
                                        {!estClient && <th>Relances</th>}
                                        {peutSaisir && <th style={{ textAlign: 'right' }}>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {suivi.echeances.map(ech => (
                                        <tr key={ech.id}>
                                            <td style={{ fontWeight: 600 }}>{ech.libelle}</td>
                                            <td>{formatDate(ech.dateLimite)}</td>
                                            <td className="montant">{fcfa(ech.montant)}</td>
                                            <td className="montant">{fcfa(ech.montantRegle)}</td>
                                            <td>
                                                <span className={`badge ${STATUTS[ech.statut].badge}`}>{STATUTS[ech.statut].label}</span>
                                                {ech.joursRetard > 0 && (
                                                    <div style={{ fontSize: 12, color: 'var(--accent-red)', marginTop: 4 }}>
                                                        {ech.joursRetard} j de retard · reste {fcfa(ech.resteDu)}
                                                    </div>
                                                )}
                                            </td>
                                            {!estClient && (
                                                <td style={{ fontSize: 13 }}>
                                                    {ech.nombreRelances > 0
                                                        ? <>{ech.nombreRelances} · dernière le {formatDate(ech.derniereRelanceLe)}</>
                                                        : <span style={{ color: 'var(--text-muted)' }}>Aucune</span>}
                                                </td>
                                            )}
                                            {peutSaisir && (
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'inline-flex', gap: 6 }}>
                                                        {ech.statut === 'en_retard' && (
                                                            <button className="btn btn-secondary btn-sm" title="Noter une relance faite aujourd'hui" onClick={() => relancer(ech)}>
                                                                <BellRing size={14} /> Relancé
                                                            </button>
                                                        )}
                                                        <button className="btn btn-danger btn-icon" title="Supprimer l'échéance" onClick={() => supprimerEcheance(ech)}>
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {suivi.echeances.length === 0 && (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Aucune échéance définie</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ─── VERSEMENTS ─────────────────────────────────────────── */}
                    <div className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Versements reçus ({suivi.paiements.length})</h3>
                            {peutSaisir && (
                                <button className="btn btn-primary btn-sm" onClick={() => ouvrir('versement')}>
                                    <Plus size={16} /> Enregistrer un versement
                                </button>
                            )}
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th><th>Montant</th><th>Mode</th><th>Référence</th>
                                        {!estClient && <th>Enregistré par</th>}
                                        {peutSaisir && <th style={{ textAlign: 'right' }}>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {suivi.paiements.map(v => (
                                        <tr key={v.id}>
                                            <td>{formatDate(v.date)}</td>
                                            <td className="montant" style={{ fontWeight: 600 }}>{fcfa(v.montant)}</td>
                                            <td>{MODES[v.mode] || v.mode}</td>
                                            <td>{v.reference || '—'}</td>
                                            {!estClient && <td>{v.enregistrePar || '—'}</td>}
                                            {peutSaisir && (
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="btn btn-danger btn-icon" title="Supprimer le versement" onClick={() => supprimerVersement(v)}>
                                                        <Trash2 size={15} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {suivi.paiements.length === 0 && (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Aucun versement enregistré</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {modal === 'versement' && (
                <div className="modal-overlay" onClick={() => setModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Enregistrer un versement</h2>
                            <button className="modal-close" onClick={() => setModal(null)}><X size={20} /></button>
                        </div>
                        <form onSubmit={enregistrerVersement}>
                            {erreur && <div className="alert alert-danger">{erreur}</div>}
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date *</label>
                                    <input className="form-input" type="date" required value={formVersement.date} onChange={e => setFormVersement({ ...formVersement, date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Montant (FCFA) *</label>
                                    <input className="form-input" type="number" min="1" required value={formVersement.montant} onChange={e => setFormVersement({ ...formVersement, montant: e.target.value })} placeholder="2000000" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Mode de paiement *</label>
                                    <select className="form-select" value={formVersement.mode} onChange={e => setFormVersement({ ...formVersement, mode: e.target.value })}>
                                        {Object.entries(MODES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Référence</label>
                                    <input className="form-input" value={formVersement.reference} onChange={e => setFormVersement({ ...formVersement, reference: e.target.value })} placeholder="N° de chèque, de transaction…" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Observations</label>
                                <textarea className="form-input" rows="2" value={formVersement.observations} onChange={e => setFormVersement({ ...formVersement, observations: e.target.value })} />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Annuler</button>
                                <button type="submit" className="btn btn-primary"><Plus size={16} /> Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modal === 'echeance' && (
                <div className="modal-overlay" onClick={() => setModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Nouvelle échéance</h2>
                            <button className="modal-close" onClick={() => setModal(null)}><X size={20} /></button>
                        </div>
                        <form onSubmit={enregistrerEcheance}>
                            {erreur && <div className="alert alert-danger">{erreur}</div>}
                            <div className="form-group">
                                <label>Libellé *</label>
                                <input className="form-input" required value={formEcheance.libelle} onChange={e => setFormEcheance({ ...formEcheance, libelle: e.target.value })} placeholder="Acompte à la signature (30 %)" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Montant (FCFA) *</label>
                                    <input className="form-input" type="number" min="1" required value={formEcheance.montant} onChange={e => setFormEcheance({ ...formEcheance, montant: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Date limite *</label>
                                    <input className="form-input" type="date" required value={formEcheance.dateLimite} onChange={e => setFormEcheance({ ...formEcheance, dateLimite: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Annuler</button>
                                <button type="submit" className="btn btn-primary"><Plus size={16} /> Ajouter</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
