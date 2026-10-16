import { useState } from 'react';
import { X, Check, Sparkles, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { createJournal, createIncident } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import BoutonMicro from './BoutonMicro';

const meteoLabels = {
  ensoleille: 'Ensoleillé',
  nuageux: 'Nuageux',
  pluie: 'Pluie',
  harmattan: 'Harmattan',
  orage: 'Orage',
};

const typeIncidentLabels = {
  securite: 'Sécurité',
  qualite: 'Qualité',
  materiel: 'Matériel',
  approvisionnement: 'Approvisionnement',
  autre: 'Autre',
};

const CHAMPS = [
  { cle: 'travauxRealises', label: 'Travaux réalisés', lignes: 4 },
  { cle: 'resteAFaire', label: 'Reste à faire', lignes: 3 },
  { cle: 'problemes', label: 'Problèmes rencontrés', lignes: 3 },
  { cle: 'materiaux_receptionnes', label: 'Matériaux réceptionnés', lignes: 2 },
  { cle: 'visitesDuJour', label: 'Visites du jour', lignes: 1 },
  { cle: 'observations', label: 'Observations', lignes: 2 },
];

const ajouterTexte = (avant, texte) => (avant?.trim() ? `${avant.trim()}\n- ${texte}` : `- ${texte}`);

/**
 * Validation du rapport journalier préparé par l'IA : la personne relit, corrige
 * (au clavier ou à la voix) et valide. Rien n'est enregistré avant la validation.
 */
export default function CompteRenduModal({ projetId, proposition, photosDuJour = [], onFermer, onEnregistre }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    ...proposition,
    meteo: proposition.meteo ?? '',
    nombreOuvriers: proposition.nombreOuvriers ?? '',
    temperature: '',
  });
  const [incidents, setIncidents] = useState(proposition.incidents.map((i) => ({ ...i, retenu: true })));
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  const changer = (cle, valeur) => setForm((f) => ({ ...f, [cle]: valeur }));

  const valider = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur('');
    try {
      await createJournal(projetId, {
        date: form.date,
        meteo: form.meteo || undefined,
        temperature: form.temperature ? Number(form.temperature) : undefined,
        nombreOuvriers: Number(form.nombreOuvriers) || 0,
        travauxRealises: form.travauxRealises,
        resteAFaire: form.resteAFaire,
        problemes: form.problemes,
        materiaux_receptionnes: form.materiaux_receptionnes,
        visitesDuJour: form.visitesDuJour,
        observations: form.observations,
        genereParIa: true,
      });
      for (const i of incidents.filter((x) => x.retenu && x.description.trim())) {
        await createIncident(projetId, {
          date: form.date, type: i.type, gravite: i.gravite, description: i.description, declareCss: false,
        });
      }
      onEnregistre();
    } catch (err) {
      setErreur([].concat(err?.message || "Le rapport n'a pas pu être enregistré.").join(' '));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onFermer}>
      <div className="modal" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Rapport du {new Date(`${form.date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          <button className="modal-close" onClick={onFermer}><X size={20} /></button>
        </div>

        <div className="alert" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 16, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 'var(--radius-sm)', padding: 12, fontSize: 13 }}>
          <Sparkles size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            L'IA a rédigé ce rapport à partir de {proposition.nombreNotes} note{proposition.nombreNotes > 1 ? 's' : ''} vocale{proposition.nombreNotes > 1 ? 's' : ''}.
            Relisez et corrigez si besoin : il ne sera enregistré qu'après votre validation.
          </span>
        </div>

        <form onSubmit={valider}>
          <div className="form-row">
            <div className="form-group">
              <label>Météo</label>
              <select className="form-select" value={form.meteo} onChange={(e) => changer('meteo', e.target.value)}>
                <option value="">Non précisée</option>
                {Object.entries(meteoLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Nombre d'ouvriers</label>
              <input className="form-input" type="number" min="0" value={form.nombreOuvriers}
                onChange={(e) => changer('nombreOuvriers', e.target.value)} placeholder="Non précisé" />
            </div>
            <div className="form-group">
              <label>Température (°C)</label>
              <input className="form-input" type="number" value={form.temperature}
                onChange={(e) => changer('temperature', e.target.value)} placeholder="32" />
            </div>
          </div>

          {CHAMPS.map(({ cle, label, lignes }) => (
            <div className="form-group" key={cle}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {label}
                <BoutonMicro onTexte={(texte) => setForm((f) => ({ ...f, [cle]: ajouterTexte(f[cle], texte) }))} />
              </label>
              {lignes === 1 ? (
                <input className="form-input" value={form[cle]} onChange={(e) => changer(cle, e.target.value)} placeholder="—" />
              ) : (
                <textarea className="form-input" rows={lignes} value={form[cle]} onChange={(e) => changer(cle, e.target.value)} placeholder="—" />
              )}
            </div>
          ))}

          {incidents.length > 0 && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={15} color="var(--accent-red)" /> Incidents repérés — cochez ceux à déclarer
              </label>
              {incidents.map((i, n) => (
                <label key={n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', fontWeight: 400, cursor: 'pointer' }}>
                  <input type="checkbox" checked={i.retenu} style={{ marginTop: 3 }}
                    onChange={(e) => setIncidents((l) => l.map((x, k) => (k === n ? { ...x, retenu: e.target.checked } : x)))} />
                  <span>
                    <span className="badge badge-amber" style={{ marginRight: 6 }}>{typeIncidentLabels[i.type] || i.type} · {i.gravite}</span>
                    {i.description}
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ImageIcon size={15} /> Photos du jour ({photosDuJour.length})
            </label>
            {photosDuJour.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Aucune photo prise ce jour-là. Les photos ajoutées dans l'onglet Photos à cette date seront jointes au rapport.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
                {photosDuJour.map((p) => (
                  <img key={p.id} src={p.photoUrl} alt={p.titre} title={p.titre}
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                ))}
              </div>
            )}
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Rédigé par : <strong>{user ? `${user.prenom} ${user.nom}` : '—'}</strong>
          </p>
          {erreur && <div className="alert alert-danger" style={{ marginTop: 12 }}>{erreur}</div>}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onFermer} disabled={envoi}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={envoi}>
              <Check size={16} /> {envoi ? 'Enregistrement…' : 'Valider le rapport'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
