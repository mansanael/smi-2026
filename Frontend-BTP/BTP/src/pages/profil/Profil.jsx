import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfil, setUser } from '../../api/api';
import { Camera, Trash2, Save, CheckCircle2 } from 'lucide-react';

const roleLabels = {
    directeur_general: 'Directeur Général',
    directeur_technique: 'Directeur Technique',
    chef_projet: 'Chef de Projet',
    conducteur_travaux: 'Conducteur de Travaux',
    responsable_admin_fin: 'Resp. Admin & Finance',
    magasinier: 'Magasinier',
    maitre_ouvrage_externe: "Maître d'Ouvrage",
};

function compressImage(file) {
    return new Promise((resolve, reject) => {
        if (file.size > 5 * 1024 * 1024) {
            reject(new Error('Le fichier est trop volumineux (max 5 Mo)'));
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const SIZE = 300;
                const canvas = document.createElement('canvas');
                canvas.width = SIZE;
                canvas.height = SIZE;
                const ctx = canvas.getContext('2d');
                // Crop carré centré
                const minDim = Math.min(img.width, img.height);
                const sx = (img.width - minDim) / 2;
                const sy = (img.height - minDim) / 2;
                ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, SIZE, SIZE);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.onerror = () => reject(new Error("Impossible de lire l'image"));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
        reader.readAsDataURL(file);
    });
}

export default function Profil() {
    const { user, setUser: setAuthUser } = useAuth();
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        nom: user?.nom || '',
        prenom: user?.prenom || '',
        telephone: user?.telephone || '',
        poste: user?.poste || '',
        photo: user?.photo ?? null,
    });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [photoLoading, setPhotoLoading] = useState(false);
    const [avatarHovered, setAvatarHovered] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoLoading(true);
        setError('');
        try {
            const compressed = await compressImage(file);
            setForm((prev) => ({ ...prev, photo: compressed }));
        } catch (err) {
            setError(err.message);
        } finally {
            setPhotoLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemovePhoto = () => {
        setForm((prev) => ({ ...prev, photo: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess(false);
        try {
            const updated = await updateProfil(form);
            const merged = { ...user, ...updated };
            setUser(merged);
            if (setAuthUser) setAuthUser(merged);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.message || 'Erreur lors de la mise à jour du profil');
        } finally {
            setSaving(false);
        }
    };

    const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Mon Profil</h1>
                    <p className="subtitle">Gérer vos informations personnelles</p>
                </div>
            </div>

            <div className="glass-card" style={{ maxWidth: 560, padding: 24, margin: '0 auto' }}>
                {/* Section avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 8 }}>
                    {/* Avatar cliquable */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onMouseEnter={() => setAvatarHovered(true)}
                            onMouseLeave={() => setAvatarHovered(false)}
                            title="Changer la photo"
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                background: form.photo ? 'transparent' : 'var(--gradient-blue)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 24,
                                fontWeight: 700,
                                color: 'white',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                border: '3px solid var(--border)',
                                position: 'relative',
                            }}
                        >
                            {form.photo ? (
                                <img
                                    src={form.photo}
                                    alt="Photo de profil"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : photoLoading ? (
                                <span style={{ fontSize: 13 }}>…</span>
                            ) : (
                                initials
                            )}
                            {/* Overlay caméra au survol */}
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: avatarHovered ? 1 : 0,
                                    transition: 'opacity 0.2s',
                                }}
                            >
                                <Camera size={22} color="white" />
                            </div>
                        </div>

                        {/* Bouton supprimer la photo */}
                        {form.photo && (
                            <button
                                type="button"
                                onClick={handleRemovePhoto}
                                title="Supprimer la photo"
                                style={{
                                    position: 'absolute',
                                    bottom: -2,
                                    right: -2,
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    background: '#ef4444',
                                    border: '2px solid var(--bg-card, #1e1e2e)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                }}
                            >
                                <Trash2 size={12} color="white" />
                            </button>
                        )}
                    </div>

                    {/* Infos utilisateur */}
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>
                            {user?.prenom} {user?.nom}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                            {user?.email}
                        </div>
                        <span className="badge badge-blue" style={{ display: 'inline-block' }}>
                            {roleLabels[user?.role] || user?.role}
                        </span>
                        <div style={{ marginTop: 8 }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ fontSize: 12, padding: '4px 12px', gap: 6 }}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={photoLoading}
                            >
                                <Camera size={13} />
                                {photoLoading ? 'Chargement…' : form.photo ? 'Changer la photo' : 'Ajouter une photo'}
                            </button>
                        </div>
                    </div>

                    {/* Input file masqué */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                </div>

                {/* Texte aide */}
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24, marginTop: 8 }}>
                    JPG, PNG ou WebP · Max 5 Mo · Recadrée automatiquement en 300×300 px
                </p>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="badge badge-red" style={{ display: 'block', marginBottom: 12, padding: 10 }}>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div
                            className="badge badge-green"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: 10 }}
                        >
                            <CheckCircle2 size={14} /> Profil mis à jour avec succès
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label>Nom *</label>
                            <input
                                className="form-input"
                                required
                                value={form.nom}
                                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Prénom *</label>
                            <input
                                className="form-input"
                                required
                                value={form.prenom}
                                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            className="form-input"
                            value={user?.email || ''}
                            disabled
                            style={{ opacity: 0.6 }}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Téléphone</label>
                            <input
                                className="form-input"
                                value={form.telephone}
                                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Poste</label>
                            <input
                                className="form-input"
                                value={form.poste}
                                onChange={(e) => setForm({ ...form, poste: e.target.value })}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </form>
            </div>
        </div>
    );
}
