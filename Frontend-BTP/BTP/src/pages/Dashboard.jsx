import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardGlobal } from '../api/api';
import { FolderKanban, TrendingUp, Wallet, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AlertesRecentes from '../components/accueil/AlertesRecentes';

const COLORS = ['#1d4ed8', '#15803d', '#d97706', '#dc2626', '#6d28d9', '#0f766e', '#64748b', '#db2777'];

const statutLabels = {
  en_etude: 'En étude', soumissionne: 'Soumissionné', attribue: 'Attribué',
  en_preparation: 'En préparation', en_cours: 'En cours', travaux_termines: 'Travaux terminés',
  en_garantie: 'En garantie', cloture: 'Clôturé',
};

function formatMontant(n) {
  if (!n) return '0';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + ' Mrd';
  if (n >= 1e6) return (n / 1e6).toFixed(0) + ' M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + ' k';
  return n.toLocaleString('fr-FR');
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getDashboardGlobal().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;
  if (!data) return <div className="empty-state"><p>Erreur de chargement</p></div>;

  const pieData = Object.entries(data.repartitionParStatut || {}).map(([key, val]) => ({
    name: statutLabels[key] || key, value: val,
  }));

  const barData = (data.projetsActifs || []).map(p => ({
    name: p.reference?.substring(0, 12) || p.intitule?.substring(0, 15),
    montant: Number(p.montantMarche) / 1e6,
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p className="subtitle">Vue d'ensemble de vos projets BTP</p>
        </div>
      </div>

      <AlertesRecentes />

      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-icon"><FolderKanban size={22} /></div>
          <div className="kpi-value">{data.nombreProjetsActifs}</div>
          <div className="kpi-label">Projets actifs sur {data.nombreProjetsTotal}</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon"><Wallet size={22} /></div>
          <div className="kpi-value">{formatMontant(data.valeurPortefeuilleFCFA)}</div>
          <div className="kpi-label">Valeur portefeuille (FCFA)</div>
        </div>
        <div className="kpi-card teal">
          <div className="kpi-icon"><TrendingUp size={22} /></div>
          <div className="kpi-value">{data.nombreProjetsTotal}</div>
          <div className="kpi-label">Total projets</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><AlertTriangle size={22} /></div>
          <div className="kpi-value">{Object.keys(data.repartitionParStatut || {}).length}</div>
          <div className="kpi-label">Statuts différents</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Montant par projet actif (M FCFA)</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fill: '#3b4658', fontSize: 12 }} />
                <YAxis tick={{ fill: '#3b4658', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #d5dce6', borderRadius: 8, color: '#0f172a', boxShadow: '0 4px 12px rgba(15,23,42,0.1)' }}
                  formatter={(v) => [`${v.toFixed(0)} M FCFA`]}
                />
                <Bar dataKey="montant" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>Aucun projet actif</p></div>}
        </div>

        <div className="chart-card">
          <h3>Répartition par statut</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #d5dce6', borderRadius: 8, color: '#0f172a', boxShadow: '0 4px 12px rgba(15,23,42,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>Aucune donnée</p></div>}
        </div>
      </div>

      {data.projetsActifs?.length > 0 && (
        <div className="glass-card">
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>Projets actifs</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Intitulé</th>
                <th>Région</th>
                <th>Statut</th>
                <th>Montant marché</th>
              </tr>
            </thead>
            <tbody>
              {data.projetsActifs.map(p => (
                <tr key={p.id} onClick={() => navigate(`/projets/${p.id}`)}>
                  <td style={{ fontWeight: 600 }}>{p.reference}</td>
                  <td>{p.intitule}</td>
                  <td>{p.region}</td>
                  <td><span className="badge badge-blue">{statutLabels[p.statut] || p.statut}</span></td>
                  <td className="montant">{Number(p.montantMarche).toLocaleString('fr-FR')} FCFA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
