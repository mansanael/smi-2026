import { useEffect, useState } from 'react';
import { Calculator, Check } from 'lucide-react';
import { getBaremeDevis, updateBaremeDevis } from '../../api/api';

const COLONNES = [
  { cle: 'prixEconomique', label: 'Économique' },
  { cle: 'prixStandard', label: 'Standard' },
  { cle: 'prixHautStanding', label: 'Haut standing' },
];
const TAUX = [
  { cle: 'tauxImprevus', label: 'Réserve pour imprévus' },
  { cle: 'tauxPartEntreprise', label: "Part de l'entreprise (frais généraux et bénéfice)" },
  { cle: 'tauxTva', label: "TVA (fixée par l'État)" },
];
const fcfa = (n) => Math.round(Number(n || 0)).toLocaleString('fr-FR');

// Prix au m² de l'entreprise pour le devis estimatif (DG, DT) : les devis déjà créés ne changent pas
export default function BaremeDevis() {
  const [bareme, setBareme] = useState(null);
  const [modifie, setModifie] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getBaremeDevis().then(setBareme).catch(() => setMessage('Impossible de charger les prix.'));
  }, []);

  if (!bareme) return message ? <div className="alert alert-danger">{message}</div> : null;

  const changerPrix = (code, cle, valeur) => {
    setBareme((b) => ({ ...b, lots: b.lots.map((l) => (l.code === code ? { ...l, [cle]: valeur } : l)) }));
    setModifie(true);
    setMessage('');
  };
  const changerTaux = (cle, valeur) => {
    setBareme((b) => ({ ...b, taux: { ...b.taux, [cle]: valeur } }));
    setModifie(true);
    setMessage('');
  };

  const enregistrer = async (e) => {
    e.preventDefault();
    try {
      const r = await updateBaremeDevis({
        lots: bareme.lots.map(({ code, prixEconomique, prixStandard, prixHautStanding }) => ({
          code, prixEconomique: Number(prixEconomique) || 0, prixStandard: Number(prixStandard) || 0, prixHautStanding: Number(prixHautStanding) || 0,
        })),
        ...Object.fromEntries(TAUX.map(({ cle }) => [cle, Number(bareme.taux[cle]) || 0])),
      });
      setBareme(r);
      setModifie(false);
      setMessage('Prix enregistrés : ils serviront aux prochaines estimations.');
    } catch (err) {
      setMessage([].concat(err?.message || "Échec de l'enregistrement.").join(' '));
    }
  };

  const total = (cle) => bareme.lots.reduce((s, l) => s + (Number(l[cle]) || 0), 0);

  return (
    <form className="glass-card" onSubmit={enregistrer} style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Calculator size={16} /> Prix pour les devis</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Prix moyen d'un m² construit, par lot et par finition (FCFA). Utilisés par « Estimer avec l'IA » ; les devis déjà créés ne changent pas.
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={!modifie}><Check size={16} /> Enregistrer</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ fontSize: 14 }}>
          <thead>
            <tr><th>Lot</th>{COLONNES.map((c) => <th key={c.cle} style={{ textAlign: 'right' }}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {bareme.lots.map((l) => (
              <tr key={l.code}>
                <td>{l.libelle}</td>
                {COLONNES.map((c) => (
                  <td key={c.cle} style={{ textAlign: 'right' }}>
                    <input className="form-input" type="number" min="0" step="500" value={l[c.cle]} aria-label={`${l.libelle} — ${c.label}`}
                      style={{ width: 120, textAlign: 'right', padding: '6px 8px' }} onChange={(e) => changerPrix(l.code, c.cle, e.target.value)} />
                  </td>
                ))}
              </tr>
            ))}
            <tr style={{ fontWeight: 700 }}>
              <td>Total au m²</td>
              {COLONNES.map((c) => <td key={c.cle} style={{ textAlign: 'right' }}>{fcfa(total(c.cle))}</td>)}
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginTop: 16 }}>
        {TAUX.map(({ cle, label }) => (
          <label key={cle} style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {label}
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input className="form-input" type="number" min="0" max="100" step="0.5" value={bareme.taux[cle]}
                style={{ width: 100 }} onChange={(e) => changerTaux(cle, e.target.value)} /> %
            </span>
          </label>
        ))}
      </div>
      {message && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 10 }}>{message}</p>}
    </form>
  );
}
