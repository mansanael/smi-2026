import { useEffect, useState } from 'react';
import { ClipboardList, AlertTriangle, CheckCircle2, ArrowRightCircle, Banknote, ChevronRight } from 'lucide-react';
import { getJournaux, getNotesVocales } from '../../api/api';

const SEPT_JOURS = 7 * 24 * 3600 * 1000;
const formatJour = (d) => new Date(`${String(d).slice(0, 10)}T00:00:00Z`)
  .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const fcfa = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

function Bloc({ icone: Icone, couleur, titre, children, lien, onLien }) {
  return (
    <div className="en-ce-moment-bloc">
      <div className="en-ce-moment-titre">
        <span className={`apercu-icone ${couleur}`}><Icone size={16} /></span>
        <strong>{titre}</strong>
      </div>
      <div className="en-ce-moment-corps">{children}</div>
      {lien && (
        <button className="btn btn-secondary btn-sm" onClick={onLien}>
          {lien} <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

// « En ce moment sur le chantier » : dernier rapport, dernier problème (ou paiements pour le client), prochaine étape
export default function EnCeMoment({ projetId, aSuivre, client, onOnglet }) {
  const [journal, setJournal] = useState(null);
  const [probleme, setProbleme] = useState(null);

  useEffect(() => {
    let actif = true;
    getJournaux(projetId)
      .then((js) => { if (actif) setJournal([...(js || [])].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] ?? null); })
      .catch(() => {});
    // Les problèmes signalés à la voix restent internes : le client ne les voit pas
    if (!client) {
      getNotesVocales(projetId)
        .then((notes) => {
          const recent = (notes || [])
            .filter((n) => n.probleme && Date.now() - new Date(n.enregistreeLe).getTime() < SEPT_JOURS)
            .sort((a, b) => String(b.enregistreeLe).localeCompare(String(a.enregistreeLe)))[0];
          if (actif) setProbleme(recent ?? false);
        })
        .catch(() => {});
    }
    return () => { actif = false; };
  }, [projetId, client]);

  const texteRapport = journal && (client ? journal.resumeClient || journal.travauxRealises : journal.travauxRealises);

  return (
    <div className="glass-card" style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>En ce moment sur le chantier</h3>
      <div className="en-ce-moment">
        <Bloc icone={ClipboardList} couleur="bleu" titre="Dernier rapport"
          lien={client ? 'Voir les rapports' : 'Voir le suivi'} onLien={() => onOnglet('suivi')}>
          {journal ? (
            <>
              <small style={{ textTransform: 'capitalize' }}>{formatJour(journal.date)}{journal.redige_par ? ` · ${journal.redige_par}` : ''}</small>
              <p className="en-ce-moment-texte">{texteRapport || 'Rapport sans description.'}</p>
            </>
          ) : <p className="en-ce-moment-vide">Pas encore de rapport. Dictez les notes du jour dans « Suivi & voix ».</p>}
        </Bloc>

        {client ? (
          <Bloc icone={Banknote} couleur={aSuivre?.paiementEnRetard ? 'rouge' : 'vert'} titre="Mes paiements"
            lien="Voir mes paiements" onLien={() => onOnglet('paiements')}>
            {aSuivre?.paiementEnRetard ? (
              <p className="en-ce-moment-texte"><strong>{fcfa(aSuivre.paiementEnRetard.montant)}</strong> en retard de {aSuivre.paiementEnRetard.jours} jours.</p>
            ) : aSuivre?.prochaineEcheance ? (
              <p className="en-ce-moment-texte">Prochain versement : <strong>{fcfa(aSuivre.prochaineEcheance.resteDu)}</strong> avant le {formatJour(aSuivre.prochaineEcheance.dateLimite)}.</p>
            ) : <p className="en-ce-moment-vide">Aucun paiement en attente.</p>}
          </Bloc>
        ) : (
          <Bloc icone={probleme ? AlertTriangle : CheckCircle2} couleur={probleme ? 'rouge' : 'vert'} titre="Dernier problème signalé"
            lien={probleme ? 'Voir la note' : null} onLien={() => onOnglet('suivi')}>
            {probleme ? (
              <>
                <small>{formatJour(probleme.enregistreeLe)}{probleme.auteurNom ? ` · ${probleme.auteurNom}` : ''}</small>
                <p className="en-ce-moment-texte">{probleme.resumeProbleme || probleme.texte}</p>
              </>
            ) : <p className="en-ce-moment-vide">Aucun problème signalé ces 7 derniers jours.</p>}
          </Bloc>
        )}

        <Bloc icone={ArrowRightCircle} couleur={aSuivre?.tachesEnRetard > 0 ? 'orange' : 'bleu'} titre="Prochaine étape"
          lien="Voir le planning" onLien={() => onOnglet('planning')}>
          {aSuivre?.prochaineTache ? (
            <>
              <p className="en-ce-moment-texte"><strong>{aSuivre.prochaineTache.nom}</strong></p>
              {aSuivre.prochaineTache.dateFinPrevue && <small>À finir le {formatJour(aSuivre.prochaineTache.dateFinPrevue)}</small>}
              {aSuivre.tachesEnRetard > 0 && (
                <span className="badge badge-amber" style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                  {aSuivre.tachesEnRetard} tâche{aSuivre.tachesEnRetard > 1 ? 's' : ''} en retard
                </span>
              )}
            </>
          ) : <p className="en-ce-moment-vide">{aSuivre?.nombreTaches ? 'Toutes les tâches sont terminées.' : 'Aucune tâche planifiée pour l’instant.'}</p>}
        </Bloc>
      </div>
    </div>
  );
}
