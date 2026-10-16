import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getProjet, getDashboardProjet, updateProjet, deleteProjet } from '../../api/api';
import {
  ArrowLeft, Trash2, MapPin, Calendar, Building2, Wallet, LayoutDashboard, Mic, CalendarDays,
  Users, FileText, Truck, Receipt, Banknote, ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  ROLES_GESTION_PROJET, ROLES_INTERNES, ROLES_BUDGET, ROLES_FACTURATION, ROLES_LECTURE_PAIEMENTS,
  ROLES_TERRAIN, estLectureSeule,
} from '../../roles';
import EquipeProjet from '../../components/EquipeProjet';
import SuiviChantier from '../suivi-chantier/SuiviChantier';
import Planning from '../planning/Planning';
import Budget from '../budget/Budget';
import Ressources from '../ressources/Ressources';
import Documents from '../documents/Documents';
import Approvisionnement from '../approvisionnement/Approvisionnement';
import Facturation from '../facturation/Facturation';
import Paiements from '../paiements/Paiements';

const statutLabels = { en_etude: 'En étude', soumissionne: 'Soumissionné', attribue: 'Attribué', en_preparation: 'En préparation', en_cours: 'En cours', travaux_termines: 'Travaux terminés', en_garantie: 'En garantie', cloture: 'Clôturé' };
const statutOptions = ['en_etude','soumissionne','attribue','en_preparation','en_cours','travaux_termines','en_garantie','cloture'];

// Tout ce qui concerne un chantier est ici, en onglets ; chacun ne voit que ceux de son rôle
// (roles absent = tout le monde, client compris, en lecture seule)
const ONGLETS = [
  { cle: 'resume', label: 'Résumé', icon: LayoutDashboard },
  { cle: 'suivi', label: 'Suivi & voix', labelClient: 'Rapports & photos', icon: Mic, iconClient: ClipboardCheck },
  { cle: 'planning', label: 'Planning', icon: CalendarDays },
  { cle: 'budget', label: 'Budget', icon: Wallet, roles: ROLES_BUDGET },
  { cle: 'equipe', label: 'Équipe & ressources', icon: Users, roles: ROLES_INTERNES },
  { cle: 'documents', label: 'Documents', icon: FileText },
  { cle: 'achats', label: 'Achats & stock', icon: Truck, roles: ROLES_INTERNES },
  { cle: 'facturation', label: 'Facturation', icon: Receipt, roles: ROLES_FACTURATION },
  { cle: 'paiements', label: 'Paiements client', labelClient: 'Mes paiements', icon: Banknote, roles: ROLES_LECTURE_PAIEMENTS },
];

export default function ProjetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const peutModifier = ROLES_GESTION_PROJET.includes(user?.role);
  const peutSupprimer = user?.role === 'directeur_general';
  const client = estLectureSeule(user);
  const [projet, setProjet] = useState(null);
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);

  const onglets = ONGLETS.filter((o) => !o.roles || o.roles.includes(user?.role));
  const [params, setParams] = useSearchParams();
  // Sur le terrain, on arrive directement sur la saisie à la voix
  const ongletParDefaut = ROLES_TERRAIN.includes(user?.role) ? 'suivi' : 'resume';
  const onglet = onglets.some((o) => o.cle === params.get('onglet')) ? params.get('onglet') : ongletParDefaut;
  const changerOnglet = (cle) => setParams(cle === ongletParDefaut ? {} : { onglet: cle }, { replace: true });

  useEffect(() => {
    Promise.all([getProjet(id), getDashboardProjet(id)])
      .then(([p, d]) => { setProjet(p); setDash(d); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatut = async (statut) => {
    await updateProjet(id, { statut });
    setProjet({ ...projet, statut });
  };

  const handleDelete = async () => {
    if (confirm('Supprimer ce projet et toutes ses données ?')) {
      await deleteProjet(id);
      navigate('/projets');
    }
  };

  if (loading) return <div className="spinner" />;
  if (!projet) return <div className="empty-state"><p>Projet introuvable</p></div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projets')}><ArrowLeft size={16} /></button>
          <div>
            <h1>{projet.intitule}</h1>
            <p className="subtitle">{projet.reference} · {projet.region}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {peutModifier ? (
            <select className="form-select" style={{ width: 180 }} value={projet.statut} onChange={e => handleStatut(e.target.value)}>
              {statutOptions.map(s => <option key={s} value={s}>{statutLabels[s]}</option>)}
            </select>
          ) : (
            <span className="badge badge-blue">{statutLabels[projet.statut]}</span>
          )}
          {peutSupprimer && <button className="btn btn-danger btn-sm" onClick={handleDelete}><Trash2 size={16} /></button>}
        </div>
      </div>

      <div className="onglets-chantier" role="tablist">
        {onglets.map(({ cle, label, labelClient, icon, iconClient }) => {
          const Icon = client && iconClient ? iconClient : icon;
          return (
          <button
            key={cle}
            role="tab"
            aria-selected={onglet === cle}
            className={`btn btn-sm ${onglet === cle ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => changerOnglet(cle)}
          >
            <Icon size={15} /> {client && labelClient ? labelClient : label}
          </button>
          );
        })}
      </div>

      {onglet === 'suivi' && <SuiviChantier key={id} projetIdFixe={id} />}
      {onglet === 'planning' && <Planning key={id} projetIdFixe={id} />}
      {onglet === 'budget' && <Budget key={id} projetIdFixe={id} />}
      {onglet === 'equipe' && (
        <>
          <EquipeProjet projetId={id} userRole={user?.role} />
          <div style={{ marginTop: 20 }}><Ressources key={id} projetIdFixe={id} /></div>
        </>
      )}
      {onglet === 'documents' && <Documents key={id} projetIdFixe={id} />}
      {onglet === 'achats' && <Approvisionnement key={id} projetIdFixe={id} />}
      {onglet === 'facturation' && <Facturation key={id} projetIdFixe={id} />}
      {onglet === 'paiements' && <Paiements key={id} projetIdFixe={id} />}

      {onglet === 'resume' && <>
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-icon"><Building2 size={22} /></div>
          <div className="kpi-value">{dash?.avancement?.physique || 0}%</div>
          <div className="kpi-label">Avancement physique</div>
          <div className="progress-bar" style={{ marginTop: 8 }}><div className="progress-fill blue" style={{ width: `${dash?.avancement?.physique || 0}%` }} /></div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon"><Wallet size={22} /></div>
          <div className="kpi-value">{Number(projet.montantMarche).toLocaleString('fr-FR')}</div>
          <div className="kpi-label">Montant marché (FCFA)</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><Calendar size={22} /></div>
          <div className="kpi-value">{projet.dureeContractuelleJours || '—'}</div>
          <div className="kpi-label">Jours contractuels</div>
        </div>
        <div className="kpi-card teal">
          <div className="kpi-icon"><MapPin size={22} /></div>
          <div className="kpi-value" style={{ fontSize: 18 }}>{projet.commune}</div>
          <div className="kpi-label">{projet.region}</div>
        </div>
      </div>

      {dash?.alertes?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {dash.alertes.map((a, i) => <div key={i} className="alert alert-danger">{a}</div>)}
        </div>
      )}

      <div className="charts-grid">
        <div className="glass-card">
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', marginBottom: 16 }}>Informations du projet</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 14 }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Type marché :</span> <strong style={{ textTransform: 'capitalize' }}>{projet.typeMarche}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Maître d'ouvrage :</span> <strong>{projet.maitreOuvrage}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Maître d'œuvre :</span> <strong>{projet.maitreOeuvre || '—'}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Source financement :</span> <strong>{projet.sourceFinancement}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Date démarrage :</span> <strong>{projet.dateDemarrage || '—'}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>N° marché :</span> <strong>{projet.numeroMarche || '—'}</strong></div>
          </div>
        </div>
        <div className="glass-card">
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', marginBottom: 16 }}>KPIs du projet</h3>
          <div style={{ display: 'grid', gap: 12, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tâches terminées</span>
              <strong>{dash?.avancement?.tachesTerminees || 0} / {dash?.avancement?.nombreTaches || 0}</strong>
            </div>
            {/* Le serveur n'envoie pas le budget au client */}
            {dash?.budget && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Dépenses réalisées</span>
                  <strong className="montant">{Number(dash.budget.depensesRealisees || 0).toLocaleString('fr-FR')} FCFA</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Reste à dépenser</span>
                  <strong className="montant">{Number(dash.budget.resteADepenser || 0).toLocaleString('fr-FR')} FCFA</strong>
                </div>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Situations facturées</span>
              <strong>{dash?.facturation?.nombreSituations || 0}</strong>
            </div>
            {/* Le serveur n'envoie pas les incidents au client */}
            {dash?.hse && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Incidents</span>
                <strong>{dash.hse.nombreIncidents || 0}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {projet.description && (
        <div className="glass-card" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Description</h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{projet.description}</p>
        </div>
      )}

      </>}
    </div>
  );
}
