import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjets, createProjet, getApercuChantiers } from '../../api/api';
import { Plus, X, MapPin, HardHat } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES_GESTION_PROJET, estLectureSeule } from '../../roles';
import { LigneVide } from '../../components/EtatVide';

const formatJour = (d) => new Date(`${String(d).slice(0, 10)}T00:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });

// Ce qui mérite l'attention sur un chantier, du plus urgent au simple rappel
function APointer({ apercu }) {
  if (!apercu) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  if (apercu.paiementEnRetard) {
    return <span className="badge badge-red">Paiement en retard · {apercu.paiementEnRetard.jours} j</span>;
  }
  if (apercu.tachesEnRetard > 0) {
    return <span className="badge badge-amber">{apercu.tachesEnRetard} tâche{apercu.tachesEnRetard > 1 ? 's' : ''} en retard</span>;
  }
  if (apercu.prochaineTache) {
    return (
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
        Prochaine étape : <strong style={{ color: 'var(--text-primary)' }}>{apercu.prochaineTache.nom}</strong>
        {apercu.prochaineTache.dateFinPrevue && ` (${formatJour(apercu.prochaineTache.dateFinPrevue)})`}
      </span>
    );
  }
  if (apercu.prochaineEcheance) {
    return <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Prochain paiement le {formatJour(apercu.prochaineEcheance.dateLimite)}</span>;
  }
  return <span className="badge badge-green">Rien à signaler</span>;
}

const statutLabels = {
  en_etude: 'En étude', soumissionne: 'Soumissionné', attribue: 'Attribué',
  en_preparation: 'En préparation', en_cours: 'En cours', travaux_termines: 'Travaux terminés',
  en_garantie: 'En garantie', cloture: 'Clôturé',
};
const statutBadge = {
  en_etude: 'badge-gray', soumissionne: 'badge-purple', attribue: 'badge-teal',
  en_preparation: 'badge-amber', en_cours: 'badge-blue', travaux_termines: 'badge-green',
  en_garantie: 'badge-amber', cloture: 'badge-gray',
};

const emptyForm = {
  reference: '', intitule: '', description: '', typeMarche: 'public', region: '',
  commune: '', maitreOuvrage: '', montantMarche: '', sourceFinancement: '',
  dureeContractuelleJours: '', dateDemarrage: '',
};

export default function ProjetsList() {
  const [projets, setProjets] = useState([]);
  const [apercus, setApercus] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const load = () => {
    // L'aperçu (avancement, retards) est un complément : la liste s'affiche même s'il échoue
    getApercuChantiers().then((a) => setApercus(a || {})).catch(() => {});
    return getProjets().then(setProjets).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createProjet({ ...form, montantMarche: Number(form.montantMarche), dureeContractuelleJours: Number(form.dureeContractuelleJours) || undefined });
    setShowModal(false);
    setForm(emptyForm);
    load();
  };

  const filtered = projets.filter(p =>
    (!filter || p.statut === filter) &&
    true
  );

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{estLectureSeule(user) ? 'Mon chantier' : 'Chantiers'}</h1>
          <p className="subtitle">{projets.length} chantier(s) — cliquez sur une ligne pour ouvrir sa fiche</p>
        </div>
        {ROLES_GESTION_PROJET.includes(user?.role) && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Nouveau projet
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${!filter ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('')}>Tous</button>
        {Object.entries(statutLabels).map(([k, v]) => (
          <button key={k} className={`btn btn-sm ${filter === k ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(k)}>{v}</button>
        ))}
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Chantier</th>
              <th>Statut</th>
              <th style={{ minWidth: 150 }}>Avancement</th>
              <th>À surveiller</th>
              <th>Montant marché</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const apercu = apercus[p.id];
              return (
                <tr key={p.id} onClick={() => navigate(`/projets/${p.id}`)}>
                  <td style={{ fontWeight: 600, color: 'var(--accent-blue-light)', whiteSpace: 'nowrap' }}>{p.reference}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{p.intitule}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      <MapPin size={12} style={{ verticalAlign: -1, marginRight: 3 }} />
                      {[p.commune, p.region].filter(Boolean).join(', ') || '—'}
                      {' · Marché '}{p.typeMarche === 'prive' ? 'privé' : p.typeMarche === 'ppp' ? 'PPP' : 'public'}
                    </div>
                  </td>
                  <td><span className={`badge ${statutBadge[p.statut] || 'badge-gray'}`}>{statutLabels[p.statut] || p.statut}</span></td>
                  <td>
                    {apercu ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ flex: 1, minWidth: 70 }}>
                          <div className="progress-fill blue" style={{ width: `${apercu.avancement}%` }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 36 }}>{apercu.avancement} %</span>
                      </div>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td><APointer apercu={apercu} /></td>
                  <td className="montant" style={{ whiteSpace: 'nowrap' }}>{Number(p.montantMarche).toLocaleString('fr-FR')} FCFA</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <LigneVide colonnes={6} icone={HardHat}
                titre={filter ? 'Aucun chantier avec ce statut' : 'Aucun chantier pour l’instant'}
                texte={filter ? 'Choisissez « Tous » pour revoir l’ensemble des chantiers.'
                  : 'Créez votre premier chantier : vous pourrez ensuite planifier les tâches, suivre le budget et dicter les rapports.'}
                action={!filter && ROLES_GESTION_PROJET.includes(user?.role) ? 'Créer un chantier' : null}
                onAction={() => setShowModal(true)} />
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nouveau projet</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-row">
                <div className="form-group">
                  <label>Référence *</label>
                  <input className="form-input" required value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="PRJ-2026-001" />
                </div>
                <div className="form-group">
                  <label>Type de marché *</label>
                  <select className="form-select" value={form.typeMarche} onChange={e => setForm({ ...form, typeMarche: e.target.value })}>
                    <option value="public">Public</option>
                    <option value="prive">Privé</option>
                    <option value="ppp">PPP</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Intitulé *</label>
                <input className="form-input" required value={form.intitule} onChange={e => setForm({ ...form, intitule: e.target.value })} placeholder="Construction école primaire..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Région *</label>
                  <input className="form-input" required value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} placeholder="Dakar" />
                </div>
                <div className="form-group">
                  <label>Commune *</label>
                  <input className="form-input" required value={form.commune} onChange={e => setForm({ ...form, commune: e.target.value })} placeholder="Pikine" />
                </div>
              </div>
              <div className="form-group">
                <label>Maître d'ouvrage *</label>
                <input className="form-input" required value={form.maitreOuvrage} onChange={e => setForm({ ...form, maitreOuvrage: e.target.value })} placeholder="Ministère..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Montant marché (FCFA) *</label>
                  <input className="form-input" type="number" required value={form.montantMarche} onChange={e => setForm({ ...form, montantMarche: e.target.value })} placeholder="150000000" />
                </div>
                <div className="form-group">
                  <label>Source financement *</label>
                  <input className="form-input" required value={form.sourceFinancement} onChange={e => setForm({ ...form, sourceFinancement: e.target.value })} placeholder="Budget national" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date démarrage</label>
                  <input className="form-input" type="date" value={form.dateDemarrage} onChange={e => setForm({ ...form, dateDemarrage: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Durée (jours)</label>
                  <input className="form-input" type="number" value={form.dureeContractuelleJours} onChange={e => setForm({ ...form, dureeContractuelleJours: e.target.value })} placeholder="365" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary"><Plus size={16} /> Créer le projet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
