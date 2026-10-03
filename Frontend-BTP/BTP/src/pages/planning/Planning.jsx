import { useState, useEffect, useMemo } from 'react';
import {
  getProjets,
  getTaches,
  createTache,
  updateTache,
  deleteTache,
  getJalons,
  createJalon,
  updateJalon,
  deleteJalon,
} from '../../api/api';
import {
  Plus,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  Check,
  Pencil,
  Trash2,
  Calendar,
  Sliders,
  TrendingUp,
  Flag,
  ListTodo,
  CheckSquare,
} from 'lucide-react';

const lotOptions = [
  { value: 'installation_chantier', label: 'Installation de chantier' },
  { value: 'terrassement', label: 'Terrassement' },
  { value: 'fondations', label: 'Fondations' },
  { value: 'gros_oeuvre', label: 'Gros œuvre' },
  { value: 'charpente_couverture', label: 'Charpente & Couverture' },
  { value: 'menuiseries', label: 'Menuiseries' },
  { value: 'plomberie_sanitaire', label: 'Plomberie & Sanitaire' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'revetements', label: 'Revêtements / Carrelage' },
  { value: 'vrd_amenagements', label: 'VRD & Aménagements' },
  { value: 'climatisation', label: 'Climatisation' },
  { value: 'peinture', label: 'Peinture' },
  { value: 'autre', label: 'Autre' },
];

const statutOptions = [
  { value: 'a_faire', label: 'À faire' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'terminee', label: 'Terminée' },
  { value: 'en_retard', label: 'En retard' },
  { value: 'suspendue', label: 'Suspendue' },
];

const statutLabels = {
  a_faire: 'À faire',
  en_cours: 'En cours',
  terminee: 'Terminée',
  en_retard: 'En retard',
  suspendue: 'Suspendue',
};

const statutBadges = {
  a_faire: 'badge-gray',
  en_cours: 'badge-blue',
  terminee: 'badge-green',
  en_retard: 'badge-red',
  suspendue: 'badge-amber',
};

export default function Planning() {
  const [projets, setProjets] = useState([]);
  const [projetId, setProjetId] = useState('');
  const [taches, setTaches] = useState([]);
  const [jalons, setJalons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAvancementModal, setShowAvancementModal] = useState(false);
  const [showJalonModal, setShowJalonModal] = useState(false);

  // Formulaires
  const [createForm, setCreateForm] = useState({
    nom: '',
    description: '',
    lot: 'gros_oeuvre',
    dateDebutPrevue: '',
    dateFinPrevue: '',
    dureeJours: '',
    responsable: '',
    pourcentageAvancement: 0,
    statut: 'a_faire',
  });

  const [editForm, setEditForm] = useState({
    id: '',
    nom: '',
    description: '',
    lot: 'gros_oeuvre',
    dateDebutPrevue: '',
    dateFinPrevue: '',
    dureeJours: '',
    responsable: '',
    pourcentageAvancement: 0,
    statut: 'a_faire',
  });

  const [avancementTarget, setAvancementTarget] = useState(null);

  const [jalonForm, setJalonForm] = useState({
    nom: '',
    type: 'jalon_technique',
    datePrevu: '',
    atteint: false,
  });

  useEffect(() => {
    getProjets().then(setProjets);
  }, []);

  const refreshData = async (pid) => {
    if (!pid) return;
    try {
      const [t, j] = await Promise.all([getTaches(pid), getJalons(pid)]);
      setTaches(t || []);
      setJalons(j || []);
    } catch (err) {
      console.error('Erreur chargement planning:', err);
    }
  };

  useEffect(() => {
    if (projetId) {
      setLoading(true);
      refreshData(projetId).finally(() => setLoading(false));
    } else {
      setTaches([]);
      setJalons([]);
    }
  }, [projetId]);

  // Statistiques globales du planning
  const stats = useMemo(() => {
    const total = taches.length;
    const avg = total > 0
      ? Math.round(taches.reduce((acc, t) => acc + (Number(t.pourcentageAvancement) || 0), 0) / total)
      : 0;
    const terminees = taches.filter(t => t.statut === 'terminee' || Number(t.pourcentageAvancement) >= 100).length;
    const enCours = taches.filter(t => t.statut === 'en_cours' || (Number(t.pourcentageAvancement) > 0 && Number(t.pourcentageAvancement) < 100)).length;
    const jalonsTotal = jalons.length;
    const jalonsOk = jalons.filter(j => j.atteint).length;
    return { total, avg, terminees, enCours, jalonsTotal, jalonsOk };
  }, [taches, jalons]);

  // ─── ACTIONS TÂCHES ────────────────────────────────────────────────────────

  // Création tâche
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createTache(projetId, {
        ...createForm,
        dureeJours: Number(createForm.dureeJours) || undefined,
        pourcentageAvancement: Number(createForm.pourcentageAvancement) || 0,
      });
      setShowCreateModal(false);
      setCreateForm({
        nom: '',
        description: '',
        lot: 'gros_oeuvre',
        dateDebutPrevue: '',
        dateFinPrevue: '',
        dureeJours: '',
        responsable: '',
        pourcentageAvancement: 0,
        statut: 'a_faire',
      });
      await refreshData(projetId);
    } catch (err) {
      console.error('Erreur création tâche:', err);
    }
  };

  // Modification complète tâche
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.id) return;
    try {
      await updateTache(editForm.id, {
        nom: editForm.nom,
        description: editForm.description,
        lot: editForm.lot,
        dateDebutPrevue: editForm.dateDebutPrevue || undefined,
        dateFinPrevue: editForm.dateFinPrevue || undefined,
        dureeJours: Number(editForm.dureeJours) || undefined,
        responsable: editForm.responsable,
        pourcentageAvancement: Number(editForm.pourcentageAvancement) || 0,
        statut: editForm.statut,
      });
      setShowEditModal(false);
      await refreshData(projetId);
    } catch (err) {
      console.error('Erreur modification tâche:', err);
    }
  };

  // Suppression tâche
  const handleDeleteTache = async (tache) => {
    if (!window.confirm(`Supprimer la tâche "${tache.nom}" ?`)) return;
    try {
      await deleteTache(tache.id);
      setTaches(prev => prev.filter(t => t.id !== tache.id));
    } catch (err) {
      console.error('Erreur suppression tâche:', err);
    }
  };

  // Ajustement rapide d'avancement (+10%, -10%, etc.)
  const handleQuickAvancement = async (tache, delta) => {
    const current = Number(tache.pourcentageAvancement) || 0;
    const nextVal = Math.max(0, Math.min(100, current + delta));
    if (nextVal === current) return;

    setUpdatingId(tache.id);
    try {
      let nextStatut = tache.statut;
      if (nextVal >= 100) nextStatut = 'terminee';
      else if (nextVal > 0 && (!tache.statut || tache.statut === 'a_faire')) nextStatut = 'en_cours';
      else if (nextVal === 0 && tache.statut === 'terminee') nextStatut = 'a_faire';

      await updateTache(tache.id, { pourcentageAvancement: nextVal, statut: nextStatut });
      setTaches(prev => prev.map(t => t.id === tache.id ? { ...t, pourcentageAvancement: nextVal, statut: nextStatut } : t));
    } catch (err) {
      console.error('Erreur mise à jour avancement:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Définir une valeur exacte d'avancement (ex: 100% Terminer)
  const handleSetAvancement = async (tache, targetVal) => {
    const val = Math.max(0, Math.min(100, Number(targetVal) || 0));
    setUpdatingId(tache.id);
    try {
      let nextStatut = tache.statut;
      if (val >= 100) nextStatut = 'terminee';
      else if (val > 0 && (!tache.statut || tache.statut === 'a_faire')) nextStatut = 'en_cours';
      else if (val === 0 && tache.statut === 'terminee') nextStatut = 'a_faire';

      await updateTache(tache.id, { pourcentageAvancement: val, statut: nextStatut });
      setTaches(prev => prev.map(t => t.id === tache.id ? { ...t, pourcentageAvancement: val, statut: nextStatut } : t));
    } catch (err) {
      console.error('Erreur avancement:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Ouvrir la modale d'édition complète
  const openEditModal = (tache) => {
    setEditForm({
      id: tache.id,
      nom: tache.nom || '',
      description: tache.description || '',
      lot: tache.lot || 'gros_oeuvre',
      dateDebutPrevue: tache.dateDebutPrevue ? tache.dateDebutPrevue.slice(0, 10) : '',
      dateFinPrevue: tache.dateFinPrevue ? tache.dateFinPrevue.slice(0, 10) : '',
      dureeJours: tache.dureeJours || '',
      responsable: tache.responsable || '',
      pourcentageAvancement: Number(tache.pourcentageAvancement) || 0,
      statut: tache.statut || 'a_faire',
    });
    setShowEditModal(true);
  };

  // Ouvrir la modale dédiée à l'avancement
  const openAvancementModal = (tache) => {
    setAvancementTarget({
      id: tache.id,
      nom: tache.nom,
      lot: tache.lot,
      pourcentageAvancement: Number(tache.pourcentageAvancement) || 0,
      statut: tache.statut || 'a_faire',
    });
    setShowAvancementModal(true);
  };

  // Enregistrer depuis la modale d'avancement
  const saveAvancementModal = async (e) => {
    e?.preventDefault();
    if (!avancementTarget) return;
    setUpdatingId(avancementTarget.id);
    try {
      await updateTache(avancementTarget.id, {
        pourcentageAvancement: Number(avancementTarget.pourcentageAvancement),
        statut: avancementTarget.statut,
      });
      setTaches(prev =>
        prev.map(t =>
          t.id === avancementTarget.id
            ? {
                ...t,
                pourcentageAvancement: Number(avancementTarget.pourcentageAvancement),
                statut: avancementTarget.statut,
              }
            : t
        )
      );
      setShowAvancementModal(false);
      setAvancementTarget(null);
    } catch (err) {
      console.error('Erreur enregistrement avancement:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // ─── ACTIONS JALONS ────────────────────────────────────────────────────────

  // Création jalon
  const handleCreateJalon = async (e) => {
    e.preventDefault();
    try {
      await createJalon(projetId, jalonForm);
      setShowJalonModal(false);
      setJalonForm({ nom: '', type: 'jalon_technique', datePrevu: '', atteint: false });
      const j = await getJalons(projetId);
      setJalons(j);
    } catch (err) {
      console.error('Erreur création jalon:', err);
    }
  };

  // Basculer l'état du jalon
  const handleToggleJalon = async (jalon) => {
    const nextVal = !jalon.atteint;
    try {
      await updateJalon(jalon.id, {
        atteint: nextVal,
        dateReel: nextVal ? new Date().toISOString().split('T')[0] : null,
      });
      setJalons(prev =>
        prev.map(j =>
          j.id === jalon.id
            ? { ...j, atteint: nextVal, dateReel: nextVal ? new Date().toISOString().split('T')[0] : null }
            : j
        )
      );
    } catch (err) {
      console.error('Erreur bascule jalon:', err);
    }
  };

  // Suppression jalon
  const handleDeleteJalon = async (jalon) => {
    if (!window.confirm(`Supprimer le jalon "${jalon.nom}" ?`)) return;
    try {
      await deleteJalon(jalon.id);
      setJalons(prev => prev.filter(j => j.id !== jalon.id));
    } catch (err) {
      console.error('Erreur suppression jalon:', err);
    }
  };

  const statutIcon = (s) => {
    if (s === 'terminee') return <CheckCircle size={16} color="#10b981" />;
    if (s === 'en_cours') return <Clock size={16} color="#3b82f6" />;
    if (s === 'en_retard') return <AlertTriangle size={16} color="#ef4444" />;
    return <Clock size={16} color="#64748b" />;
  };

  return (
    <div>
      {/* ─── EN-TÊTE ──────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1>Planning & Délais</h1>
          <p className="subtitle">Pilotage des tâches, suivi de l'avancement physique et jalons contractuels</p>
        </div>
        {projetId && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => setShowJalonModal(true)}>
              <Flag size={16} /> Nouveau jalon
            </button>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} /> Nouvelle tâche
            </button>
          </div>
        )}
      </div>

      {/* ─── SÉLECTEUR DE PROJET ────────────────────────────────────────── */}
      <div className="glass-card" style={{ marginBottom: 24, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
              Sélectionner un projet de construction
            </label>
            <select className="form-select" value={projetId} onChange={e => setProjetId(e.target.value)}>
              <option value="">-- Choisir un projet --</option>
              {projets.map(p => (
                <option key={p.id} value={p.id}>
                  {p.reference} — {p.intitule}
                </option>
              ))}
            </select>
          </div>
          {projetId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
              <span className="badge badge-blue">
                {stats.total} tâche{stats.total > 1 ? 's' : ''}
              </span>
              <span className="badge badge-purple">
                {stats.jalonsTotal} jalon{stats.jalonsTotal > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {!projetId && (
        <div className="empty-state">
          <Calendar size={48} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <p>Veuillez sélectionner un chantier ci-dessus pour consulter et ajuster son planning et son avancement.</p>
        </div>
      )}

      {loading && <div className="spinner" />}

      {projetId && !loading && (
        <>
          {/* ─── BANDEAU KPI AVANCEMENT GLOBAL ─────────────────────────────── */}
          <div className="kpi-grid">
            <div className="kpi-card blue">
              <div className="kpi-icon"><TrendingUp size={22} /></div>
              <div className="kpi-value">{stats.avg}%</div>
              <div className="kpi-label">Avancement physique global</div>
              <div className="progress-bar" style={{ marginTop: 10, height: 8 }}>
                <div
                  className={`progress-fill ${stats.avg >= 80 ? 'green' : stats.avg >= 40 ? 'blue' : stats.avg > 0 ? 'amber' : ''}`}
                  style={{ width: `${stats.avg}%` }}
                />
              </div>
            </div>

            <div className="kpi-card green">
              <div className="kpi-icon"><CheckSquare size={22} /></div>
              <div className="kpi-value">{stats.terminees} / {stats.total}</div>
              <div className="kpi-label">Tâches terminées (100%)</div>
              <div className="progress-bar" style={{ marginTop: 10, height: 8 }}>
                <div
                  className="progress-fill green"
                  style={{ width: `${stats.total > 0 ? (stats.terminees / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="kpi-card amber">
              <div className="kpi-icon"><ListTodo size={22} /></div>
              <div className="kpi-value">{stats.enCours}</div>
              <div className="kpi-label">Tâches en cours d'exécution</div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                {stats.total - stats.terminees - stats.enCours} tâche(s) en attente
              </div>
            </div>

            <div className="kpi-card purple">
              <div className="kpi-icon"><Flag size={22} /></div>
              <div className="kpi-value">{stats.jalonsOk} / {stats.jalonsTotal}</div>
              <div className="kpi-label">Jalons contractuels atteints</div>
              <div className="progress-bar" style={{ marginTop: 10, height: 8 }}>
                <div
                  className="progress-fill purple"
                  style={{ width: `${stats.jalonsTotal > 0 ? (stats.jalonsOk / stats.jalonsTotal) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* ─── TABLEAU DES TÂCHES & BOUTONS D'AVANCEMENT ─────────────────── */}
          <div className="glass-card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Tâches du chantier ({taches.length})
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  Utilisez les boutons rapides (+10%, 100%, curseur) pour indiquer et faire progresser l'avancement de chaque tâche.
                </p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} /> Ajouter une tâche
              </button>
            </div>

            {taches.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}></th>
                      <th>Tâche</th>
                      <th>Lot WBS</th>
                      <th>Planning</th>
                      <th style={{ minWidth: 320 }}>Avancement physique</th>
                      <th>Responsable</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taches.map(t => {
                      const avancement = Number(t.pourcentageAvancement) || 0;
                      const isUpdating = updatingId === t.id;

                      return (
                        <tr key={t.id}>
                          <td style={{ verticalAlign: 'middle' }}>
                            <span title={statutLabels[t.statut] || t.statut}>
                              {statutIcon(t.statut)}
                            </span>
                          </td>
                          <td style={{ verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.nom}</div>
                            {t.description && (
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                {t.description}
                              </div>
                            )}
                            <div style={{ marginTop: 4 }}>
                              <span className={`badge ${statutBadges[t.statut] || 'badge-gray'}`} style={{ fontSize: 11, padding: '2px 8px' }}>
                                {statutLabels[t.statut] || t.statut}
                              </span>
                            </div>
                          </td>
                          <td style={{ verticalAlign: 'middle' }}>
                            <span className="badge badge-teal" style={{ textTransform: 'capitalize' }}>
                              {(lotOptions.find(o => o.value === t.lot)?.label) || t.lot}
                            </span>
                          </td>
                          <td style={{ verticalAlign: 'middle', fontSize: 13, whiteSpace: 'nowrap' }}>
                            <div><strong>Du :</strong> {t.dateDebutPrevue || '—'}</div>
                            <div><strong>Au :</strong> {t.dateFinPrevue || '—'}</div>
                            {t.dureeJours && (
                              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>({t.dureeJours} jours)</div>
                            )}
                          </td>

                          {/* ── COLONNE AVANCEMENT INTERACTIVE AVEC BOUTONS ── */}
                          <td style={{ verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div
                                  className="progress-bar"
                                  style={{ width: 100, height: 8, cursor: 'pointer' }}
                                  title="Cliquez pour ajuster précisément l'avancement"
                                  onClick={() => openAvancementModal(t)}
                                >
                                  <div
                                    className={`progress-fill ${avancement >= 80 ? 'green' : avancement >= 40 ? 'blue' : avancement > 0 ? 'amber' : ''}`}
                                    style={{ width: `${avancement}%` }}
                                  />
                                </div>
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    minWidth: 42,
                                    color: avancement === 100 ? '#34d399' : avancement > 0 ? '#60a5fa' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => openAvancementModal(t)}
                                  title="Cliquez pour ajuster"
                                >
                                  {avancement}%
                                </span>
                              </div>

                              {/* Boutons d'ajustement direct */}
                              <div className="avancement-control-row">
                                <button
                                  type="button"
                                  className="avancement-btn"
                                  title="Diminuer l'avancement de 10%"
                                  disabled={isUpdating || avancement <= 0}
                                  onClick={() => handleQuickAvancement(t, -10)}
                                >
                                  -10%
                                </button>
                                <button
                                  type="button"
                                  className="avancement-btn"
                                  title="Augmenter l'avancement de 10%"
                                  disabled={isUpdating || avancement >= 100}
                                  onClick={() => handleQuickAvancement(t, 10)}
                                >
                                  +10%
                                </button>
                                <button
                                  type="button"
                                  className="avancement-btn btn-finish"
                                  title="Marquer la tâche comme terminée (100%)"
                                  disabled={isUpdating || avancement >= 100}
                                  onClick={() => handleSetAvancement(t, 100)}
                                >
                                  <Check size={12} /> 100%
                                </button>
                                <button
                                  type="button"
                                  className="avancement-btn btn-edit-progress"
                                  title="Régler l'avancement via le curseur"
                                  disabled={isUpdating}
                                  onClick={() => openAvancementModal(t)}
                                >
                                  <Sliders size={12} /> Régler
                                </button>
                              </div>
                            </div>
                          </td>

                          <td style={{ verticalAlign: 'middle', fontSize: 13 }}>
                            {t.responsable || <span style={{ color: 'var(--text-muted)' }}>Non assigné</span>}
                          </td>

                          {/* ── ACTIONS ── */}
                          <td style={{ verticalAlign: 'middle', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-icon"
                                title="Modifier les détails de la tâche"
                                onClick={() => openEditModal(t)}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-icon"
                                title="Supprimer la tâche"
                                onClick={() => handleDeleteTache(t)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 32 }}>
                <p>Aucune tâche planifiée pour ce projet.</p>
                <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setShowCreateModal(true)}>
                  <Plus size={16} /> Créer la première tâche
                </button>
              </div>
            )}
          </div>

          {/* ─── TABLEAU DES JALONS CONTRACTUELS ────────────────────────────── */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Jalons contractuels & clés ({jalons.length})
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  Étapes majeures du marché (démarrage, hors d'eau, réception provisoire, etc.). Cliquez sur le bouton pour valider un jalon atteint.
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowJalonModal(true)}>
                <Plus size={16} /> Ajouter un jalon
              </button>
            </div>

            {jalons.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Jalon</th>
                      <th>Type</th>
                      <th>Date prévue</th>
                      <th>Date réelle</th>
                      <th>Statut / Validation</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jalons.map(j => (
                      <tr key={j.id}>
                        <td style={{ fontWeight: 600 }}>{j.nom}</td>
                        <td><span className="badge badge-purple">{j.type || 'Jalon clé'}</span></td>
                        <td>{j.datePrevu || '—'}</td>
                        <td>{j.dateReel || <span style={{ color: 'var(--text-muted)' }}>Non renseignée</span>}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{
                              background: j.atteint ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-tertiary)',
                              color: j.atteint ? '#34d399' : 'var(--text-secondary)',
                              border: `1px solid ${j.atteint ? 'rgba(16, 185, 129, 0.5)' : 'var(--surface-border)'}`,
                            }}
                            title={j.atteint ? 'Cliquer pour repasser en attente' : 'Cliquer pour marquer comme atteint'}
                            onClick={() => handleToggleJalon(j)}
                          >
                            {j.atteint ? (
                              <>
                                <CheckCircle size={14} color="#10b981" /> Atteint ✓
                              </>
                            ) : (
                              <>
                                <Clock size={14} color="#f59e0b" /> Marquer atteint
                              </>
                            )}
                          </button>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-danger btn-icon"
                            title="Supprimer le jalon"
                            onClick={() => handleDeleteJalon(j)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 32 }}>
                <p>Aucun jalon défini pour ce chantier.</p>
                <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => setShowJalonModal(true)}>
                  <Plus size={16} /> Définir un jalon
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── MODALE : NOUVELLE TÂCHE ─────────────────────────────────────── */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nouvelle tâche de chantier</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Intitulé de la tâche *</label>
                <input
                  className="form-input"
                  required
                  placeholder="Ex: Coulage des poteaux du RDC"
                  value={createForm.nom}
                  onChange={e => setCreateForm({ ...createForm, nom: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description / Détails techniques</label>
                <textarea
                  className="form-textarea"
                  placeholder="Précisions sur les travaux, spécifications béton, équipe..."
                  value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Lot WBS</label>
                  <select
                    className="form-select"
                    value={createForm.lot}
                    onChange={e => setCreateForm({ ...createForm, lot: e.target.value })}
                  >
                    {lotOptions.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Durée prévisionnelle (jours)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    placeholder="Ex: 10"
                    value={createForm.dureeJours}
                    onChange={e => setCreateForm({ ...createForm, dureeJours: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date début prévue</label>
                  <input
                    className="form-input"
                    type="date"
                    value={createForm.dateDebutPrevue}
                    onChange={e => setCreateForm({ ...createForm, dateDebutPrevue: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Date fin prévue</label>
                  <input
                    className="form-input"
                    type="date"
                    value={createForm.dateFinPrevue}
                    onChange={e => setCreateForm({ ...createForm, dateFinPrevue: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Responsable / Conducteur</label>
                  <input
                    className="form-input"
                    placeholder="Ex: Chef de chantier ou chef d'équipe"
                    value={createForm.responsable}
                    onChange={e => setCreateForm({ ...createForm, responsable: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Avancement initial (%)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    max="100"
                    value={createForm.pourcentageAvancement}
                    onChange={e => setCreateForm({ ...createForm, pourcentageAvancement: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Statut initial</label>
                <select
                  className="form-select"
                  value={createForm.statut}
                  onChange={e => setCreateForm({ ...createForm, statut: e.target.value })}
                >
                  {statutOptions.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Créer la tâche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODALE : MODIFICATION COMPLÈTE DE TÂCHE ─────────────────────── */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Modifier la tâche</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Intitulé de la tâche *</label>
                <input
                  className="form-input"
                  required
                  value={editForm.nom}
                  onChange={e => setEditForm({ ...editForm, nom: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description / Détails</label>
                <textarea
                  className="form-textarea"
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Lot WBS</label>
                  <select
                    className="form-select"
                    value={editForm.lot}
                    onChange={e => setEditForm({ ...editForm, lot: e.target.value })}
                  >
                    {lotOptions.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Durée (jours)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    value={editForm.dureeJours}
                    onChange={e => setEditForm({ ...editForm, dureeJours: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date début prévue</label>
                  <input
                    className="form-input"
                    type="date"
                    value={editForm.dateDebutPrevue}
                    onChange={e => setEditForm({ ...editForm, dateDebutPrevue: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Date fin prévue</label>
                  <input
                    className="form-input"
                    type="date"
                    value={editForm.dateFinPrevue}
                    onChange={e => setEditForm({ ...editForm, dateFinPrevue: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Responsable</label>
                  <input
                    className="form-input"
                    value={editForm.responsable}
                    onChange={e => setEditForm({ ...editForm, responsable: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Avancement physique (%)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.pourcentageAvancement}
                    onChange={e => {
                      const val = Number(e.target.value) || 0;
                      let st = editForm.statut;
                      if (val >= 100) st = 'terminee';
                      else if (val > 0 && st === 'a_faire') st = 'en_cours';
                      setEditForm({ ...editForm, pourcentageAvancement: val, statut: st });
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Statut d'exécution</label>
                <select
                  className="form-select"
                  value={editForm.statut}
                  onChange={e => setEditForm({ ...editForm, statut: e.target.value })}
                >
                  {statutOptions.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODALE DÉDIÉE : RÉGLER L'AVANCEMENT EN DIRECT ─────────────────── */}
      {showAvancementModal && avancementTarget && (
        <div className="modal-overlay" onClick={() => setShowAvancementModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Indiquer l'avancement</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  {avancementTarget.nom}
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowAvancementModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={saveAvancementModal}>
              {/* Grand affichage de pourcentage */}
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 16px',
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 24,
                  border: '1px solid var(--surface-border)',
                }}
              >
                <div style={{ fontSize: 48, fontWeight: 800, color: avancementTarget.pourcentageAvancement === 100 ? '#34d399' : '#60a5fa' }}>
                  {avancementTarget.pourcentageAvancement}%
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {avancementTarget.pourcentageAvancement === 100
                    ? '🎉 Tâche complètement achevée'
                    : avancementTarget.pourcentageAvancement >= 75
                    ? 'Presque terminée'
                    : avancementTarget.pourcentageAvancement >= 50
                    ? 'À mi-parcours'
                    : avancementTarget.pourcentageAvancement > 0
                    ? 'Démarrée / En cours'
                    : 'Non encore commencée (0%)'}
                </div>

                {/* Barre de progression visuelle */}
                <div className="progress-bar" style={{ marginTop: 16, height: 10 }}>
                  <div
                    className={`progress-fill ${avancementTarget.pourcentageAvancement >= 80 ? 'green' : avancementTarget.pourcentageAvancement >= 40 ? 'blue' : avancementTarget.pourcentageAvancement > 0 ? 'amber' : ''}`}
                    style={{ width: `${avancementTarget.pourcentageAvancement}%` }}
                  />
                </div>
              </div>

              {/* Curseur Slider interactif */}
              <div className="form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Déplacer le curseur</span>
                  <span style={{ fontWeight: 700 }}>{avancementTarget.pourcentageAvancement}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="slider-custom"
                  value={avancementTarget.pourcentageAvancement}
                  onChange={e => {
                    const val = Number(e.target.value);
                    let st = avancementTarget.statut;
                    if (val >= 100) st = 'terminee';
                    else if (val > 0 && st === 'a_faire') st = 'en_cours';
                    else if (val === 0 && st === 'terminee') st = 'a_faire';
                    setAvancementTarget({
                      ...avancementTarget,
                      pourcentageAvancement: val,
                      statut: st,
                    });
                  }}
                />
              </div>

              {/* Boutons de présélection rapide */}
              <div className="form-group">
                <label>Présélections rapides</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[0, 25, 50, 75, 100].map(val => (
                    <button
                      key={val}
                      type="button"
                      className={`avancement-preset-btn ${avancementTarget.pourcentageAvancement === val ? 'active' : ''}`}
                      onClick={() => {
                        let st = avancementTarget.statut;
                        if (val >= 100) st = 'terminee';
                        else if (val > 0 && st === 'a_faire') st = 'en_cours';
                        else if (val === 0 && st === 'terminee') st = 'a_faire';
                        setAvancementTarget({
                          ...avancementTarget,
                          pourcentageAvancement: val,
                          statut: st,
                        });
                      }}
                    >
                      {val === 0 ? '0% (À faire)' : val === 100 ? '100% (Terminé)' : `${val}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Statut associé */}
              <div className="form-group">
                <label>Statut de la tâche</label>
                <select
                  className="form-select"
                  value={avancementTarget.statut}
                  onChange={e => setAvancementTarget({ ...avancementTarget, statut: e.target.value })}
                >
                  {statutOptions.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAvancementModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Valider l'avancement ({avancementTarget.pourcentageAvancement}%)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODALE : NOUVEAU JALON ──────────────────────────────────────── */}
      {showJalonModal && (
        <div className="modal-overlay" onClick={() => setShowJalonModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nouveau jalon contractuel</h2>
              <button className="modal-close" onClick={() => setShowJalonModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateJalon}>
              <div className="form-group">
                <label>Nom du jalon *</label>
                <input
                  className="form-input"
                  required
                  placeholder="Ex: Achèvement fondations / Réception provisoire"
                  value={jalonForm.nom}
                  onChange={e => setJalonForm({ ...jalonForm, nom: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Type de jalon</label>
                <select
                  className="form-select"
                  value={jalonForm.type}
                  onChange={e => setJalonForm({ ...jalonForm, type: e.target.value })}
                >
                  <option value="demarrage">Démarrage des travaux (Ordre de service)</option>
                  <option value="fondations">Achèvement des fondations</option>
                  <option value="hors_d_eau">Hors d'eau (Couverture achevée)</option>
                  <option value="hors_d_air">Hors d'air (Menuiseries posées)</option>
                  <option value="reception_provisoire">Réception provisoire des travaux</option>
                  <option value="reception_definitive">Réception définitive (Fin de garantie)</option>
                  <option value="jalon_technique">Jalon technique / Contrôle bureau</option>
                  <option value="autre">Autre étape clé</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date contractuelle prévue *</label>
                <input
                  className="form-input"
                  type="date"
                  required
                  value={jalonForm.datePrevu}
                  onChange={e => setJalonForm({ ...jalonForm, datePrevu: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="atteintCheckbox"
                  style={{ width: 18, height: 18, accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
                  checked={jalonForm.atteint}
                  onChange={e => setJalonForm({ ...jalonForm, atteint: e.target.checked })}
                />
                <label htmlFor="atteintCheckbox" style={{ marginBottom: 0, cursor: 'pointer' }}>
                  Ce jalon est déjà atteint
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowJalonModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Créer le jalon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
