import { useState, useEffect } from 'react';
import { Users, Edit, Save, X } from 'lucide-react';
import { getMembresProjet, setMembresProjet, getUtilisateurs } from '../api/api';
import { ROLES_GESTION_MEMBRES, roleLabels } from '../roles';

// Équipe d'un projet : seuls ses membres (et la direction) y ont accès
export default function EquipeProjet({ projetId, userRole }) {
  const [membres, setMembres] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [selection, setSelection] = useState(new Set());
  const [edition, setEdition] = useState(false);
  const [erreur, setErreur] = useState('');
  const peutModifier = ROLES_GESTION_MEMBRES.includes(userRole);

  useEffect(() => {
    getMembresProjet(projetId).then(setMembres).catch(() => setMembres([]));
  }, [projetId]);

  const ouvrirEdition = async () => {
    setErreur('');
    try {
      const tous = await getUtilisateurs();
      // La direction et le resp. admin & finance voient déjà tous les projets
      setUtilisateurs(tous.filter(u => u.actif && !['directeur_general', 'directeur_technique', 'responsable_admin_fin'].includes(u.role)));
      setSelection(new Set(membres.map(m => m.id)));
      setEdition(true);
    } catch {
      setErreur('Impossible de charger la liste des utilisateurs.');
    }
  };

  const basculer = (id) => {
    const s = new Set(selection);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelection(s);
  };

  const enregistrer = async () => {
    try {
      setMembres(await setMembresProjet(projetId, [...selection]));
      setEdition(false);
    } catch (err) {
      setErreur(err?.message || "Erreur lors de l'enregistrement de l'équipe.");
    }
  };

  return (
    <div className="glass-card" style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={16} /> Équipe du projet
        </h3>
        {peutModifier && !edition && (
          <button className="btn btn-secondary btn-sm" onClick={ouvrirEdition}><Edit size={14} /> Modifier</button>
        )}
      </div>

      {erreur && <div className="alert alert-danger">{erreur}</div>}

      {edition ? (
        <>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            Cochez les personnes qui travaillent sur ce projet. La direction et le responsable admin & finance y ont accès d'office.
          </p>
          <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
            {utilisateurs.map(u => (
              <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={selection.has(u.id)} onChange={() => basculer(u.id)} />
                <span><strong>{u.prenom} {u.nom}</strong> · {roleLabels[u.role] || u.role}</span>
              </label>
            ))}
            {utilisateurs.length === 0 && <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Aucun utilisateur à affecter.</p>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={enregistrer}><Save size={14} /> Enregistrer</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setEdition(false)}><X size={14} /> Annuler</button>
          </div>
        </>
      ) : membres.length > 0 ? (
        <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
          {membres.map(m => (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{m.prenom} {m.nom}</strong>
              <span style={{ color: 'var(--text-muted)' }}>{roleLabels[m.role] || m.role}</span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Aucun membre : seuls la direction et le responsable admin & finance voient ce projet.
        </p>
      )}
    </div>
  );
}
