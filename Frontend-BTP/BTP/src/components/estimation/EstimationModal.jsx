import { useState } from 'react';
import { X, Sparkles, Loader2, FilePlus2, Info } from 'lucide-react';
import { analyserEstimation, calculerEstimation, creerDevisEstimation } from '../../api/api';
import BoutonMicro from '../voix/BoutonMicro';

const FINITIONS = { economique: 'Économique', standard: 'Standard', haut_standing: 'Haut standing' };
const fcfa = (n) => `${Math.round(Number(n || 0)).toLocaleString('fr-FR')} FCFA`;
const millions = (n) => `${(Number(n || 0) / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} millions`;
const message = (err, defaut) => [].concat(err?.message || defaut).join(' ');

/**
 * Devis estimatif : on décrit le projet en une phrase (au clavier ou à la voix),
 * l'IA en tire la surface et la finition, le calcul utilise les prix au m² de l'entreprise.
 */
export default function EstimationModal({ projetId, peutCreer, nombreLignesExistantes = 0, onFermer, onDevisCree }) {
  const [description, setDescription] = useState('');
  const [parametres, setParametres] = useState(null);
  const [surface, setSurface] = useState('');
  const [finition, setFinition] = useState('standard');
  const [finitionSupposee, setFinitionSupposee] = useState(false);
  const [estimation, setEstimation] = useState(null);
  const [attente, setAttente] = useState('');
  const [erreur, setErreur] = useState('');

  const analyser = async (e) => {
    e?.preventDefault();
    setAttente('analyse');
    setErreur('');
    try {
      const r = await analyserEstimation(description);
      setParametres(r.parametres);
      setSurface(r.parametres.surfaceM2 ? String(r.parametres.surfaceM2) : '');
      setFinition(r.parametres.finition || 'standard');
      setFinitionSupposee(r.finitionSupposee);
      setEstimation(r.estimation);
    } catch (err) {
      setErreur(message(err, "L'estimation a échoué."));
    } finally {
      setAttente('');
    }
  };

  const recalculer = async (s = surface, f = finition) => {
    if (!(Number(s) > 0)) { setEstimation(null); return; }
    setAttente('calcul');
    setErreur('');
    try {
      setEstimation(await calculerEstimation(Number(s), f));
    } catch (err) {
      setErreur(message(err, 'Le calcul a échoué.'));
    } finally {
      setAttente('');
    }
  };

  const creer = async () => {
    if (nombreLignesExistantes > 0 && !confirm(`Le devis a déjà ${nombreLignesExistantes} ligne(s). Ajouter les lignes de l'estimation à la suite ?`)) return;
    setAttente('creation');
    setErreur('');
    try {
      await creerDevisEstimation(projetId, Number(surface), finition);
      onDevisCree();
    } catch (err) {
      setErreur(message(err, "Le devis n'a pas pu être créé."));
      setAttente('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onFermer}>
      <div className="modal" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={20} /> Estimer avec l'IA</h2>
          <button className="modal-close" onClick={onFermer}><X size={20} /></button>
        </div>

        <form onSubmit={analyser}>
          <div className="form-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Décrivez le projet
              <BoutonMicro onTexte={(t) => setDescription((d) => (d.trim() ? `${d.trim()} ${t}` : t))} />
            </label>
            <textarea className="form-input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex. : Villa R+2 de 300 m² à Mbao, finition standard" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={description.trim().length < 5 || attente !== ''}>
            {attente === 'analyse' ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />} Estimer
          </button>
        </form>

        {erreur && <div className="alert alert-danger" style={{ marginTop: 12 }}>{erreur}</div>}

        {parametres && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>Ce que l'IA a compris (corrigez si besoin)</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 13, marginBottom: 12 }}>
              {parametres.typeOuvrage && <span className="badge badge-blue">{parametres.typeOuvrage}</span>}
              {parametres.niveaux && <span className="badge badge-blue">{parametres.niveaux} niveau{parametres.niveaux > 1 ? 'x' : ''} (R+{parametres.niveaux - 1})</span>}
              {parametres.localisation && <span className="badge badge-blue">{parametres.localisation}</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Surface totale construite (m²)</label>
                <input className="form-input" type="number" min="1" value={surface}
                  onChange={(e) => setSurface(e.target.value)} onBlur={() => recalculer()} placeholder="Ex. 300" />
              </div>
              <div className="form-group">
                <label>Finition {finitionSupposee && <span style={{ color: 'var(--accent-amber)', fontWeight: 400 }}>(non précisée : supposée)</span>}</label>
                <select className="form-select" value={finition}
                  onChange={(e) => { setFinition(e.target.value); setFinitionSupposee(false); recalculer(surface, e.target.value); }}>
                  {Object.entries(FINITIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            {!estimation && <p style={{ fontSize: 14, color: 'var(--accent-amber)' }}>Indiquez la surface pour obtenir l'estimation.</p>}
          </div>
        )}

        {estimation && (
          <div style={{ opacity: attente === 'calcul' ? 0.5 : 1 }}>
            <div className="glass-card" style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Prix estimé pour le client (TTC)</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{fcfa(estimation.totalTTC)}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                soit entre {millions(estimation.fourchetteTTC.min)} et {millions(estimation.fourchetteTTC.max)} FCFA
              </div>
            </div>

            <table className="data-table" style={{ fontSize: 14 }}>
              <thead><tr><th>Lot</th><th style={{ textAlign: 'right' }}>Prix au m²</th><th style={{ textAlign: 'right' }}>Montant</th></tr></thead>
              <tbody>
                {estimation.lots.map((l) => (
                  <tr key={l.code}>
                    <td>{l.libelle}</td>
                    <td style={{ textAlign: 'right' }}>{fcfa(l.prixM2)}</td>
                    <td className="montant" style={{ textAlign: 'right' }}>{fcfa(l.montant)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 600 }}>
                  <td>Coût des travaux ({estimation.surfaceM2} m² × {fcfa(estimation.prixM2Travaux)})</td><td />
                  <td style={{ textAlign: 'right' }}>{fcfa(estimation.coutTravaux)}</td>
                </tr>
                <tr><td>Imprévus ({estimation.taux.tauxImprevus} %)</td><td /><td style={{ textAlign: 'right' }}>{fcfa(estimation.imprevus)}</td></tr>
                <tr><td>Frais généraux et bénéfice ({estimation.taux.tauxPartEntreprise} %)</td><td /><td style={{ textAlign: 'right' }}>{fcfa(estimation.partEntreprise)}</td></tr>
                <tr style={{ fontWeight: 600 }}><td>Total HT</td><td /><td style={{ textAlign: 'right' }}>{fcfa(estimation.totalHT)}</td></tr>
                <tr><td>TVA ({estimation.taux.tauxTva} %, reversée à l'État)</td><td /><td style={{ textAlign: 'right' }}>{fcfa(estimation.tva)}</td></tr>
                <tr style={{ fontWeight: 700 }}><td>Total TTC</td><td /><td style={{ textAlign: 'right' }}>{fcfa(estimation.totalTTC)}</td></tr>
              </tbody>
            </table>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, display: 'flex', gap: 6 }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              Estimation calculée avec les prix au m² de l'entreprise (réglés dans Administration) : une première réponse au client,
              à affiner par un métré avant la signature.
            </p>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onFermer}>Fermer</button>
              {peutCreer && (
                <button className="btn btn-primary" onClick={creer} disabled={attente !== '' || !(Number(surface) > 0)}>
                  {attente === 'creation' ? <Loader2 size={16} className="spin" /> : <FilePlus2 size={16} />} Créer le devis ({estimation.lots.length + 2} lignes)
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
