import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getProjets,
    getJournaux,
    createJournal,
    getIncidents,
    createIncident,
    getPhotosChantier,
    createPhotoChantier,
    deletePhotoChantier,
    getUser,
} from '../../api/api';
import {
    Plus,
    X,
    CloudSun,
    AlertTriangle,
    Camera,
    Image as ImageIcon,
    Trash2,
    Eye,
    MapPin,
    Calendar,
    Download,
    UploadCloud,
    Filter,
} from 'lucide-react';

const emptyJournal = {
    date: '',
    meteo: 'ensoleille',
    temperature: '',
    nombreOuvriers: '',
    travauxRealises: '',
    materiaux_receptionnes: '',
    visitesDuJour: '',
    observations: '',
    redige_par: '',
};

const emptyIncident = {
    date: '',
    type: 'securite',
    gravite: 'faible',
    description: '',
    actionsCorrectives: '',
    declareCss: false,
    declarePar: '',
};

const getInitialPhotoState = () => {
    const user = getUser();
    return {
        titre: '',
        description: '',
        photoUrl: '',
        datePrise: new Date().toISOString().split('T')[0],
        categorie: 'avancement',
        zone: '',
        prisPar: user?.nom || (user?.email ? user.email.split('@')[0] : ''),
    };
};

const meteoLabels = {
    ensoleille: 'Ensoleillé',
    nuageux: 'Nuageux',
    pluie: 'Pluie',
    harmattan: 'Harmattan',
    orage: 'Orage',
};

const typeLabels = {
    securite: 'Sécurité',
    qualite: 'Qualité',
    materiel: 'Matériel',
    approvisionnement: 'Approvisionnement',
    autre: 'Autre',
};

const graviteBadge = {
    faible: 'badge-gray',
    moyen: 'badge-amber',
    grave: 'badge-blue',
    critique: 'badge-red',
};

const categorieLabels = {
    avancement: 'Avancement',
    gros_oeuvre: 'Gros œuvre',
    second_oeuvre: 'Second œuvre',
    securite: 'Sécurité',
    reception: 'Réception',
    autre: 'Autre',
};

const categorieBadge = {
    avancement: 'badge-blue',
    gros_oeuvre: 'badge-amber',
    second_oeuvre: 'badge-purple',
    securite: 'badge-red',
    reception: 'badge-green',
    autre: 'badge-gray',
};

export default function SuiviChantier() {
    const [projets, setProjets] = useState([]);
    const [projetId, setProjetId] = useState('');
    const [journaux, setJournaux] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('journal');
    const [showModal, setShowModal] = useState(false);

    // Form states
    const [formJournal, setFormJournal] = useState(emptyJournal);
    const [formIncident, setFormIncident] = useState(emptyIncident);
    const [formPhoto, setFormPhoto] = useState(getInitialPhotoState());

    // Photo specific states
    const [filterCategory, setFilterCategory] = useState('tous');
    const [previewPhoto, setPreviewPhoto] = useState(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        getProjets().then((list) => {
            setProjets(list);
            if (list.length > 0) setProjetId(list[0].id);
            else setLoading(false);
        });
    }, []);

    const loadProjetData = (pid) => {
        setLoading(true);
        Promise.all([
            getJournaux(pid),
            getIncidents(pid),
            getPhotosChantier(pid),
        ])
            .then(([j, i, p]) => {
                setJournaux(j || []);
                setIncidents(i || []);
                setPhotos(p || []);
            })
            .catch((err) => console.error('Erreur chargement données suivi chantier:', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (projetId) loadProjetData(projetId);
    }, [projetId]);

    // Compression d'image avant upload
    const handleFileProcess = async (file) => {
        if (!file) return;
        setIsCompressing(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new window.Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1600;
                    const MAX_HEIGHT = 1600;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height = Math.round((height * MAX_WIDTH) / width);
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width = Math.round((width * MAX_HEIGHT) / height);
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Sortie JPEG optimisée (compression terrain BTP)
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
                    setFormPhoto((prev) => ({
                        ...prev,
                        photoUrl: compressedDataUrl,
                        titre: prev.titre || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
                    }));
                    setIsCompressing(false);
                };
                img.onerror = () => {
                    setIsCompressing(false);
                    alert("Format d'image non supporté.");
                };
            };
        } catch (err) {
            console.error('Erreur lors de la compression de la photo:', err);
            setIsCompressing(false);
            alert("Erreur lors de l'analyse de la photo.");
        }
    };

    const handleAddJournal = async (e) => {
        e.preventDefault();
        await createJournal(projetId, {
            ...formJournal,
            temperature: formJournal.temperature ? Number(formJournal.temperature) : undefined,
            nombreOuvriers: Number(formJournal.nombreOuvriers) || 0,
        });
        setShowModal(false);
        setFormJournal(emptyJournal);
        loadProjetData(projetId);
    };

    const handleAddIncident = async (e) => {
        e.preventDefault();
        await createIncident(projetId, formIncident);
        setShowModal(false);
        setFormIncident(emptyIncident);
        loadProjetData(projetId);
    };

    const handleAddPhoto = async (e) => {
        e.preventDefault();
        if (!formPhoto.photoUrl) {
            alert('Veuillez prendre ou sélectionner une photo du chantier.');
            return;
        }
        setIsSaving(true);
        try {
            await createPhotoChantier(projetId, formPhoto);
            setShowModal(false);
            setFormPhoto(getInitialPhotoState());
            loadProjetData(projetId);
        } catch (err) {
            console.error('Erreur lors de la création de la photo:', err);
            alert("Erreur lors de l'enregistrement de la photo.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeletePhoto = async (photoId) => {
        if (window.confirm('Voulez-vous vraiment supprimer cette photo du chantier ?')) {
            try {
                await deletePhotoChantier(projetId, photoId);
                loadProjetData(projetId);
                if (previewPhoto?.id === photoId) setPreviewPhoto(null);
            } catch (err) {
                console.error('Erreur suppression photo:', err);
                alert('Erreur lors de la suppression.');
            }
        }
    };

    const filteredPhotos = photos.filter((p) =>
        filterCategory === 'tous' ? true : p.categorie === filterCategory
    );

    if (projets.length === 0 && !loading) {
        return (
            <div>
                <div className="page-header">
                    <div>
                        <h1>Suivi Chantier</h1>
                    </div>
                </div>
                <div className="empty-state">
                    <p>Aucun projet trouvé. Crée d'abord un projet pour suivre son chantier.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/projets')}>
                        Aller aux projets
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>Suivi Chantier</h1>
                    <p className="subtitle">
                        Journal de chantier, incidents et prises de photos par projet
                    </p>
                </div>
                <select
                    className="form-select"
                    style={{ maxWidth: 320 }}
                    value={projetId}
                    onChange={(e) => setProjetId(e.target.value)}
                >
                    {projets.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.reference} — {p.intitule}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="spinner" />
            ) : (
                <>
                    {/* Navigation Onglets */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                        <button
                            className={`btn btn-sm ${tab === 'journal' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setTab('journal')}
                        >
                            Journal de chantier ({journaux.length})
                        </button>
                        <button
                            className={`btn btn-sm ${tab === 'incidents' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setTab('incidents')}
                        >
                            Incidents ({incidents.length})
                        </button>
                        <button
                            className={`btn btn-sm ${tab === 'photos' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setTab('photos')}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                            <Camera size={15} />
                            Photos du chantier ({photos.length})
                        </button>
                    </div>

                    {/* Actions de l'onglet actif */}
                    <div className="page-header" style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {tab === 'photos' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Filter size={16} color="var(--text-secondary)" />
                                    <select
                                        className="form-select form-select-sm"
                                        style={{ minWidth: 160 }}
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                    >
                                        <option value="tous">Toutes les catégories ({photos.length})</option>
                                        {Object.entries(categorieLabels).map(([k, v]) => (
                                            <option key={k} value={k}>
                                                {v} ({photos.filter((p) => p.categorie === k).length})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                if (tab === 'photos') {
                                    setFormPhoto(getInitialPhotoState());
                                }
                                setShowModal(true);
                            }}
                        >
                            {tab === 'photos' ? (
                                <>
                                    <Camera size={18} /> Prendre / Ajouter une photo
                                </>
                            ) : (
                                <>
                                    <Plus size={18} /> {tab === 'journal' ? 'Rapport journalier' : 'Incident'}
                                </>
                            )}
                        </button>
                    </div>

                    {/* ═══ ONGLET 1: JOURNAL DE CHANTIER ═══ */}
                    {tab === 'journal' && (
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Météo</th>
                                        <th>Ouvriers</th>
                                        <th>Travaux réalisés</th>
                                        <th>Rédigé par</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {journaux.map((j) => (
                                        <tr key={j.id}>
                                            <td>{new Date(j.date).toLocaleDateString('fr-FR')}</td>
                                            <td>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                    <CloudSun size={14} />
                                                    {meteoLabels[j.meteo] || '—'}
                                                </span>
                                            </td>
                                            <td>{j.nombreOuvriers}</td>
                                            <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {j.travauxRealises || '—'}
                                            </td>
                                            <td>{j.redige_par || '—'}</td>
                                        </tr>
                                    ))}
                                    {journaux.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                                Aucun rapport journalier
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ═══ ONGLET 2: INCIDENTS ═══ */}
                    {tab === 'incidents' && (
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Gravité</th>
                                        <th>Description</th>
                                        <th>CSS déclaré</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {incidents.map((i) => (
                                        <tr key={i.id}>
                                            <td>{new Date(i.date).toLocaleDateString('fr-FR')}</td>
                                            <td>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                    <AlertTriangle size={14} />
                                                    {typeLabels[i.type] || i.type}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${graviteBadge[i.gravite] || 'badge-gray'}`}>
                                                    {i.gravite}
                                                </span>
                                            </td>
                                            <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {i.description}
                                            </td>
                                            <td>{i.declareCss ? 'Oui' : 'Non'}</td>
                                        </tr>
                                    ))}
                                    {incidents.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                                Aucun incident enregistré
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ═══ ONGLET 3: PHOTOS DE CHANTIER ═══ */}
                    {tab === 'photos' && (
                        <div>
                            {filteredPhotos.length === 0 ? (
                                <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
                                    <div
                                        style={{
                                            width: 64,
                                            height: 64,
                                            borderRadius: '50%',
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 16px',
                                        }}
                                    >
                                        <Camera size={32} color="var(--accent-blue)" />
                                    </div>
                                    <h3 style={{ fontSize: 18, marginBottom: 8 }}>Aucune photo pour ce chantier</h3>
                                    <p style={{ color: 'var(--text-secondary)', maxWidth: 450, margin: '0 auto 20px', fontSize: 14 }}>
                                        Prenez des photos en direct sur le terrain avec votre smartphone ou importez des clichés
                                        pour documenter l'avancement des travaux.
                                    </p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            setFormPhoto(getInitialPhotoState());
                                            setShowModal(true);
                                        }}
                                    >
                                        <Camera size={16} /> Prendre la première photo
                                    </button>
                                </div>
                            ) : (
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                        gap: 20,
                                    }}
                                >
                                    {filteredPhotos.map((p) => (
                                        <div
                                            key={p.id}
                                            className="glass-card"
                                            style={{
                                                padding: 12,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                            }}
                                        >
                                            {/* Vignette Photo avec badges flottants */}
                                            <div
                                                style={{
                                                    position: 'relative',
                                                    height: 180,
                                                    borderRadius: 'var(--radius-sm)',
                                                    overflow: 'hidden',
                                                    background: 'rgba(0,0,0,0.4)',
                                                    cursor: 'pointer',
                                                }}
                                                onClick={() => setPreviewPhoto(p)}
                                            >
                                                <img
                                                    src={p.photoUrl}
                                                    alt={p.titre}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        display: 'block',
                                                        transition: 'transform 0.3s ease',
                                                    }}
                                                    onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                                                    onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                                />
                                                <span
                                                    className={`badge ${categorieBadge[p.categorie] || 'badge-blue'}`}
                                                    style={{ position: 'absolute', top: 8, left: 8 }}
                                                >
                                                    {categorieLabels[p.categorie] || p.categorie}
                                                </span>
                                                <span
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: 8,
                                                        right: 8,
                                                        background: 'rgba(15, 23, 42, 0.75)',
                                                        backdropFilter: 'blur(6px)',
                                                        padding: '3px 8px',
                                                        borderRadius: 12,
                                                        fontSize: 11,
                                                        color: '#f8fafc',
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {new Date(p.datePrise).toLocaleDateString('fr-FR')}
                                                </span>
                                            </div>

                                            {/* Métadonnées de la photo */}
                                            <div style={{ padding: '12px 4px 4px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <h4
                                                    style={{
                                                        fontSize: 15,
                                                        fontWeight: 600,
                                                        marginBottom: 4,
                                                        color: 'var(--text-primary)',
                                                    }}
                                                >
                                                    {p.titre}
                                                </h4>

                                                {p.zone && (
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            color: 'var(--text-secondary)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                            marginBottom: 6,
                                                        }}
                                                    >
                                                        <MapPin size={12} color="var(--accent-amber)" />
                                                        <span>{p.zone}</span>
                                                    </div>
                                                )}

                                                {p.description && (
                                                    <p
                                                        style={{
                                                            fontSize: 12,
                                                            color: 'var(--text-muted)',
                                                            marginBottom: 8,
                                                            lineHeight: 1.4,
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        {p.description}
                                                    </p>
                                                )}

                                                <div
                                                    style={{
                                                        marginTop: 'auto',
                                                        paddingTop: 8,
                                                        borderTop: '1px solid var(--surface-border)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                    }}
                                                >
                                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                        {p.prisPar ? `Par ${p.prisPar}` : 'Chantier'}
                                                    </span>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            style={{ padding: '4px 8px' }}
                                                            onClick={() => setPreviewPhoto(p)}
                                                            title="Agrandir la photo"
                                                        >
                                                            <Eye size={13} />
                                                        </button>
                                                        <button
                                                            className="btn btn-sm"
                                                            style={{
                                                                padding: '4px 8px',
                                                                color: 'var(--accent-red)',
                                                                borderColor: 'rgba(239, 68, 68, 0.3)',
                                                            }}
                                                            onClick={() => handleDeletePhoto(p.id)}
                                                            title="Supprimer la photo"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ═══ MODAL: NOUVEAU RAPPORT JOURNALIER ═══ */}
            {showModal && tab === 'journal' && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Nouveau rapport journalier</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddJournal}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date *</label>
                                    <input
                                        className="form-input"
                                        type="date"
                                        required
                                        value={formJournal.date}
                                        onChange={(e) => setFormJournal({ ...formJournal, date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Météo</label>
                                    <select
                                        className="form-select"
                                        value={formJournal.meteo}
                                        onChange={(e) => setFormJournal({ ...formJournal, meteo: e.target.value })}
                                    >
                                        {Object.entries(meteoLabels).map(([k, v]) => (
                                            <option key={k} value={k}>
                                                {v}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Température (°C)</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        value={formJournal.temperature}
                                        onChange={(e) => setFormJournal({ ...formJournal, temperature: e.target.value })}
                                        placeholder="32"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nombre d'ouvriers *</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        required
                                        value={formJournal.nombreOuvriers}
                                        onChange={(e) => setFormJournal({ ...formJournal, nombreOuvriers: e.target.value })}
                                        placeholder="15"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Travaux réalisés</label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    value={formJournal.travauxRealises}
                                    onChange={(e) => setFormJournal({ ...formJournal, travauxRealises: e.target.value })}
                                    placeholder="Coulage dalle RDC, pose coffrage..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Matériaux réceptionnés</label>
                                <textarea
                                    className="form-input"
                                    rows="2"
                                    value={formJournal.materiaux_receptionnes}
                                    onChange={(e) => setFormJournal({ ...formJournal, materiaux_receptionnes: e.target.value })}
                                    placeholder="50 sacs de ciment, 10 tonnes de fer..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Visites du jour</label>
                                <input
                                    className="form-input"
                                    value={formJournal.visitesDuJour}
                                    onChange={(e) => setFormJournal({ ...formJournal, visitesDuJour: e.target.value })}
                                    placeholder="Maître d'œuvre, client..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Observations</label>
                                <textarea
                                    className="form-input"
                                    rows="2"
                                    value={formJournal.observations}
                                    onChange={(e) => setFormJournal({ ...formJournal, observations: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Rédigé par</label>
                                <input
                                    className="form-input"
                                    value={formJournal.redige_par}
                                    onChange={(e) => setFormJournal({ ...formJournal, redige_par: e.target.value })}
                                    placeholder="Nom du conducteur de travaux"
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Annuler
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Plus size={16} /> Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══ MODAL: NOUVEL INCIDENT ═══ */}
            {showModal && tab === 'incidents' && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Déclarer un incident</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddIncident}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date *</label>
                                    <input
                                        className="form-input"
                                        type="date"
                                        required
                                        value={formIncident.date}
                                        onChange={(e) => setFormIncident({ ...formIncident, date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Type *</label>
                                    <select
                                        className="form-select"
                                        value={formIncident.type}
                                        onChange={(e) => setFormIncident({ ...formIncident, type: e.target.value })}
                                    >
                                        {Object.entries(typeLabels).map(([k, v]) => (
                                            <option key={k} value={k}>
                                                {v}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Gravité *</label>
                                <select
                                    className="form-select"
                                    value={formIncident.gravite}
                                    onChange={(e) => setFormIncident({ ...formIncident, gravite: e.target.value })}
                                >
                                    <option value="faible">Faible</option>
                                    <option value="moyen">Moyen</option>
                                    <option value="grave">Grave</option>
                                    <option value="critique">Critique</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Description *</label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    required
                                    value={formIncident.description}
                                    onChange={(e) => setFormIncident({ ...formIncident, description: e.target.value })}
                                    placeholder="Chute d'un ouvrier depuis un échafaudage..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Actions correctives</label>
                                <textarea
                                    className="form-input"
                                    rows="2"
                                    value={formIncident.actionsCorrectives}
                                    onChange={(e) => setFormIncident({ ...formIncident, actionsCorrectives: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <div
                                    className="form-group"
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}
                                >
                                    <input
                                        type="checkbox"
                                        id="declareCss"
                                        checked={formIncident.declareCss}
                                        onChange={(e) => setFormIncident({ ...formIncident, declareCss: e.target.checked })}
                                    />
                                    <label htmlFor="declareCss" style={{ margin: 0 }}>
                                        Déclaré à la CSS
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label>Déclaré par</label>
                                    <input
                                        className="form-input"
                                        value={formIncident.declarePar}
                                        onChange={(e) => setFormIncident({ ...formIncident, declarePar: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Annuler
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Plus size={16} /> Déclarer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══ MODAL: PRENDRE / AJOUTER UNE PHOTO DE CHANTIER ═══ */}
            {showModal && tab === 'photos' && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Camera size={20} color="var(--accent-blue)" />
                                <h2>Ajouter une photo de chantier</h2>
                            </div>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddPhoto}>
                            {/* Inputs cachés pour fichier ou caméra mobile */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => handleFileProcess(e.target.files[0])}
                            />
                            <input
                                ref={cameraInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                style={{ display: 'none' }}
                                onChange={(e) => handleFileProcess(e.target.files[0])}
                            />

                            {/* Zone Aperçu / Prise de photo */}
                            <div style={{ marginBottom: 16 }}>
                                {formPhoto.photoUrl ? (
                                    <div
                                        style={{
                                            position: 'relative',
                                            borderRadius: 'var(--radius-md)',
                                            overflow: 'hidden',
                                            maxHeight: 240,
                                            background: '#000',
                                            border: '1px solid var(--surface-border)',
                                        }}
                                    >
                                        <img
                                            src={formPhoto.photoUrl}
                                            alt="Aperçu"
                                            style={{
                                                width: '100%',
                                                height: 240,
                                                objectFit: 'contain',
                                                display: 'block',
                                            }}
                                        />
                                        <div
                                            style={{
                                                position: 'absolute',
                                                bottom: 10,
                                                right: 10,
                                                display: 'flex',
                                                gap: 8,
                                            }}
                                        >
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => cameraInputRef.current?.click()}
                                                style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)' }}
                                            >
                                                <Camera size={14} /> Reprendre
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)' }}
                                            >
                                                <ImageIcon size={14} /> Changer
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            border: '2px dashed var(--surface-border)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '28px 16px',
                                            textAlign: 'center',
                                            background: 'rgba(30, 41, 59, 0.3)',
                                            transition: 'border-color 0.2s',
                                        }}
                                    >
                                        {isCompressing ? (
                                            <div>
                                                <div className="spinner" style={{ margin: '0 auto 12px' }} />
                                                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                                    Optimisation de la photo pour transmission rapide...
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <div
                                                    style={{
                                                        width: 52,
                                                        height: 52,
                                                        borderRadius: '50%',
                                                        background: 'rgba(59, 130, 246, 0.12)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        margin: '0 auto 12px',
                                                    }}
                                                >
                                                    <Camera size={26} color="var(--accent-blue)" />
                                                </div>
                                                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                                                    Prendre ou importer une photo
                                                </p>
                                                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                                                    Sur smartphone/tablette, la caméra s'ouvre directement
                                                </p>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => cameraInputRef.current?.click()}
                                                    >
                                                        <Camera size={14} /> Appareil photo (Mobile)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <UploadCloud size={14} /> Fichier / Galerie
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Informations de la photo */}
                            <div className="form-group">
                                <label>Titre de la photo *</label>
                                <input
                                    className="form-input"
                                    required
                                    placeholder="Ex: Coulage dalle RDC, Ferraillage radier..."
                                    value={formPhoto.titre}
                                    onChange={(e) => setFormPhoto({ ...formPhoto, titre: e.target.value })}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Catégorie *</label>
                                    <select
                                        className="form-select"
                                        value={formPhoto.categorie}
                                        onChange={(e) => setFormPhoto({ ...formPhoto, categorie: e.target.value })}
                                    >
                                        {Object.entries(categorieLabels).map(([k, v]) => (
                                            <option key={k} value={k}>
                                                {v}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Date de prise de vue *</label>
                                    <input
                                        className="form-input"
                                        type="date"
                                        required
                                        value={formPhoto.datePrise}
                                        onChange={(e) => setFormPhoto({ ...formPhoto, datePrise: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Localisation / Zone</label>
                                    <input
                                        className="form-input"
                                        placeholder="Ex: Bâtiment A - Étage 2, Façade Sud..."
                                        value={formPhoto.zone}
                                        onChange={(e) => setFormPhoto({ ...formPhoto, zone: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Pris par</label>
                                    <input
                                        className="form-input"
                                        placeholder="Nom du conducteur / chef de chantier"
                                        value={formPhoto.prisPar}
                                        onChange={(e) => setFormPhoto({ ...formPhoto, prisPar: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Observations / Notes</label>
                                <textarea
                                    className="form-input"
                                    rows="2"
                                    placeholder="Précisions sur les travaux photographiés..."
                                    value={formPhoto.description}
                                    onChange={(e) => setFormPhoto({ ...formPhoto, description: e.target.value })}
                                />
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={!formPhoto.photoUrl || isCompressing || isSaving}
                                >
                                    {isSaving ? 'Enregistrement...' : <><Plus size={16} /> Enregistrer la photo</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══ LIGHTBOX PREVIEW MODAL (ZOOM PLEIN ÉCRAN) ═══ */}
            {previewPhoto && (
                <div
                    className="modal-overlay"
                    style={{ background: 'rgba(0, 0, 0, 0.88)', zIndex: 9999, backdropFilter: 'blur(8px)' }}
                    onClick={() => setPreviewPhoto(null)}
                >
                    <div
                        style={{
                            maxWidth: 850,
                            width: '95%',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--surface-border)',
                            overflow: 'hidden',
                            boxShadow: 'var(--shadow-lg)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* En-tête Lightbox */}
                        <div
                            style={{
                                padding: '14px 20px',
                                borderBottom: '1px solid var(--surface-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span className={`badge ${categorieBadge[previewPhoto.categorie] || 'badge-blue'}`}>
                                    {categorieLabels[previewPhoto.categorie] || previewPhoto.categorie}
                                </span>
                                <h3 style={{ fontSize: 16, margin: 0 }}>{previewPhoto.titre}</h3>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <a
                                    href={previewPhoto.photoUrl}
                                    download={`photo-chantier-${previewPhoto.titre || 'btp'}.jpg`}
                                    className="btn btn-secondary btn-sm"
                                    title="Télécharger l'image"
                                >
                                    <Download size={15} /> Télécharger
                                </a>
                                <button
                                    className="modal-close"
                                    style={{ position: 'static' }}
                                    onClick={() => setPreviewPhoto(null)}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Image grande vue */}
                        <div
                            style={{
                                background: '#000',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                maxHeight: '65vh',
                                overflow: 'hidden',
                            }}
                        >
                            <img
                                src={previewPhoto.photoUrl}
                                alt={previewPhoto.titre}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '65vh',
                                    objectFit: 'contain',
                                    display: 'block',
                                }}
                            />
                        </div>

                        {/* Pied d'information */}
                        <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 20,
                                    flexWrap: 'wrap',
                                    fontSize: 13,
                                    color: 'var(--text-secondary)',
                                    marginBottom: previewPhoto.description ? 10 : 0,
                                }}
                            >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                    <Calendar size={14} color="var(--accent-blue)" />
                                    Prise le : {new Date(previewPhoto.datePrise).toLocaleDateString('fr-FR')}
                                </span>
                                {previewPhoto.zone && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                        <MapPin size={14} color="var(--accent-amber)" />
                                        Zone : {previewPhoto.zone}
                                    </span>
                                )}
                                {previewPhoto.prisPar && (
                                    <span>
                                        Auteur : <strong style={{ color: 'var(--text-primary)' }}>{previewPhoto.prisPar}</strong>
                                    </span>
                                )}
                            </div>
                            {previewPhoto.description && (
                                <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                                    {previewPhoto.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}