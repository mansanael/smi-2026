import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Banknote, CalendarClock, ClipboardCheck, Image as ImageIcon, Mic, ChevronRight } from 'lucide-react';
import { getDashboardProjet, getJournaux, getPhotosChantier, getPaiements } from '../../api/api';

const fcfa = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;
const jour = (d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

// Accueil du client : en un coup d'œil, où en est son chantier et ce qu'il reste à payer
export default function AccueilClient({ user, projets }) {
  const navigate = useNavigate();
  const [projetId, setProjetId] = useState(projets[0]?.id);
  const [donnees, setDonnees] = useState(null);
  const projet = projets.find((p) => p.id === projetId);

  useEffect(() => {
    if (!projetId) return;
    let actif = true;
    Promise.all([
      getDashboardProjet(projetId).catch(() => null),
      getJournaux(projetId).catch(() => []),
      getPhotosChantier(projetId).catch(() => []),
      getPaiements(projetId).catch(() => null),
    ]).then(([dash, journaux, photos, paiements]) => {
      if (actif) setDonnees({ dash, journaux: journaux || [], photos: photos || [], paiements });
    });
    return () => { actif = false; };
  }, [projetId]);

  if (projets.length === 0) {
    return <div className="empty-state"><p>Aucun chantier n'est encore rattaché à votre compte.</p></div>;
  }

  const avancement = Math.round(donnees?.dash?.avancement?.physique || 0);
  const dernierRapport = donnees?.journaux?.[0];
  const paiements = donnees?.paiements;
  const prochaine = paiements?.echeances?.find((e) => e.statut !== 'payee');
  const ouvrir = (onglet) => navigate(`/projets/${projetId}${onglet ? `?onglet=${onglet}` : ''}`);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bonjour {user?.prenom}</h1>
          <p className="subtitle">{projet ? `Votre chantier ${projet.reference} — ${projet.intitule}` : ''}</p>
        </div>
        {projets.length > 1 && (
          <select className="form-select" style={{ maxWidth: 320 }} value={projetId} onChange={(e) => { setDonnees(null); setProjetId(e.target.value); }}>
            {projets.map((p) => <option key={p.id} value={p.id}>{p.reference} — {p.intitule}</option>)}
          </select>
        )}
      </div>

      {!donnees ? <div className="spinner" /> : (
        <>
          <div className="kpi-grid">
            <div className="kpi-card blue" onClick={() => ouvrir('planning')} style={{ cursor: 'pointer' }}>
              <div className="kpi-icon"><Building2 size={22} /></div>
              <div className="kpi-value">{avancement}%</div>
              <div className="kpi-label">Avancement des travaux</div>
              <div className="progress-bar" style={{ marginTop: 8 }}><div className="progress-fill blue" style={{ width: `${avancement}%` }} /></div>
            </div>
            {paiements && (
              <div className="kpi-card green" onClick={() => ouvrir('paiements')} style={{ cursor: 'pointer' }}>
                <div className="kpi-icon"><Banknote size={22} /></div>
                <div className="kpi-value" style={{ fontSize: 20 }}>{fcfa(paiements.totalRecu)}</div>
                <div className="kpi-label">Déjà payé, sur {fcfa(paiements.montantMarche)}</div>
              </div>
            )}
            {prochaine && (
              <div className={`kpi-card ${prochaine.statut === 'en_retard' ? 'red' : 'amber'}`} onClick={() => ouvrir('paiements')} style={{ cursor: 'pointer' }}>
                <div className="kpi-icon"><CalendarClock size={22} /></div>
                <div className="kpi-value" style={{ fontSize: 20 }}>{fcfa(prochaine.resteDu)}</div>
                <div className="kpi-label">
                  {prochaine.statut === 'en_retard'
                    ? `« ${prochaine.libelle} » : en retard de ${prochaine.joursRetard} j`
                    : `« ${prochaine.libelle} » avant le ${new Date(prochaine.dateLimite).toLocaleDateString('fr-FR')}`}
                </div>
              </div>
            )}
          </div>

          <div className="glass-card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardCheck size={17} /> Dernier rapport du chantier
            </h3>
            {dernierRapport ? (
              <>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
                  {jour(dernierRapport.date)}{dernierRapport.redige_par ? ` · par ${dernierRapport.redige_par}` : ''}
                </p>
                {dernierRapport.travauxRealises && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Travaux réalisés</div>
                    <p style={{ whiteSpace: 'pre-line', fontSize: 14, lineHeight: 1.6 }}>{dernierRapport.travauxRealises}</p>
                  </div>
                )}
                {dernierRapport.resteAFaire && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Prochaines étapes</div>
                    <p style={{ whiteSpace: 'pre-line', fontSize: 14, lineHeight: 1.6 }}>{dernierRapport.resteAFaire}</p>
                  </div>
                )}
                <button className="btn btn-secondary btn-sm" onClick={() => ouvrir('suivi')}>
                  Tous les rapports <ChevronRight size={14} />
                </button>
              </>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Aucun rapport publié pour l'instant.</p>
            )}
          </div>

          {donnees.photos.length > 0 && (
            <div className="glass-card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ImageIcon size={17} /> Photos récentes
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                {donnees.photos.slice(0, 6).map((p) => (
                  <img key={p.id} src={p.photoUrl} alt={p.titre} title={p.titre} onClick={() => ouvrir('suivi')}
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} />
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/assistant')}>
              <Mic size={16} /> Poser une question sur mon chantier
            </button>
            <button className="btn btn-secondary" onClick={() => ouvrir()}>
              Voir toute la fiche du chantier <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
