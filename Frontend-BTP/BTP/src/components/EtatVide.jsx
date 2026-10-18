import { Plus } from 'lucide-react';

// Écran vide qui guide : à quoi sert la page, et un bouton pour commencer
// (le bouton n'apparaît que si on passe une action, donc seulement à ceux qui ont le droit d'ajouter)
export default function EtatVide({ icone: Icone, titre, texte, action, onAction }) {
  return (
    <div className="etat-vide">
      {Icone && <span className="etat-vide-icone"><Icone size={26} /></span>}
      <strong>{titre}</strong>
      {texte && <p>{texte}</p>}
      {action && onAction && (
        <button className="btn btn-primary btn-sm" onClick={onAction}>
          <Plus size={16} /> {action}
        </button>
      )}
    </div>
  );
}

// Même chose, à l'intérieur d'un tableau vide
export function LigneVide({ colonnes, ...props }) {
  return (
    <tr className="ligne-vide">
      <td colSpan={colonnes}><EtatVide {...props} /></td>
    </tr>
  );
}
