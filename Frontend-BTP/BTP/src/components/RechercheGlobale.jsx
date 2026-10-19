import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, HardHat, ListChecks, FileText, X } from 'lucide-react';
import { rechercher } from '../api/api';

const DELAI_FRAPPE_MS = 250;

// Où mène chaque résultat : la fiche du chantier, sur le bon onglet
const CATEGORIES = [
  { cle: 'projets', titre: 'Chantiers', Icone: HardHat,
    lien: (r) => `/projets/${r.id}`, libelle: (r) => `${r.reference} — ${r.intitule}`, detail: (r) => r.commune },
  { cle: 'taches', titre: 'Tâches', Icone: ListChecks,
    lien: (r) => `/projets/${r.projet?.id}?onglet=planning`, libelle: (r) => r.nom, detail: (r) => r.projet?.reference },
  { cle: 'documents', titre: 'Documents', Icone: FileText,
    lien: (r) => `/projets/${r.projet?.id}?onglet=documents`, libelle: (r) => r.nom, detail: (r) => r.projet?.reference },
];

// Barre de recherche du haut : résultats au fil de la frappe, navigation au clavier (↑ ↓ Entrée Échap)
export default function RechercheGlobale({ visibleMobile, onFermer }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  // Réponse du serveur, avec le texte cherché : une réponse pour un autre texte n'est pas affichée
  const [reponse, setReponse] = useState({ texte: '', resultats: null, erreur: false });
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(-1);
  const zoneRef = useRef(null);
  const champRef = useRef(null);

  const texte = q.trim();
  const aJour = texte.length >= 2 && reponse.texte === texte;
  const resultats = aJour && !reponse.erreur ? reponse.resultats : null;
  const etat = texte.length < 2 ? 'repos' : !aJour ? 'chargement' : reponse.erreur ? 'erreur' : 'repos';

  // Liste à plat (pour le clavier), dans l'ordre d'affichage
  const lignes = resultats
    ? CATEGORIES.flatMap((c) => (resultats[c.cle] ?? []).map((r) => ({ c, r })))
    : [];

  useEffect(() => {
    if (texte.length < 2) return undefined;
    let annule = false;
    const minuteur = setTimeout(() => {
      rechercher(texte)
        .then((r) => { if (!annule) { setReponse({ texte, resultats: r, erreur: false }); setActif(-1); } })
        .catch(() => { if (!annule) setReponse({ texte, resultats: null, erreur: true }); });
    }, DELAI_FRAPPE_MS);
    return () => { annule = true; clearTimeout(minuteur); };
  }, [texte]);

  useEffect(() => {
    const dehors = (e) => { if (zoneRef.current && !zoneRef.current.contains(e.target)) setOuvert(false); };
    document.addEventListener('mousedown', dehors);
    return () => document.removeEventListener('mousedown', dehors);
  }, []);

  // Sur téléphone, le champ prend le focus dès qu'il apparaît
  useEffect(() => { if (visibleMobile) champRef.current?.focus(); }, [visibleMobile]);

  const aller = ({ c, r }) => {
    navigate(c.lien(r));
    setOuvert(false);
    setQ('');
    onFermer?.();
  };

  const auClavier = (e) => {
    if (e.key === 'Escape') { setOuvert(false); champRef.current?.blur(); onFermer?.(); return; }
    if (!lignes.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setOuvert(true); setActif((i) => (i + 1) % lignes.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActif((i) => (i <= 0 ? lignes.length - 1 : i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); aller(lignes[Math.max(actif, 0)]); }
  };

  const montrerListe = ouvert && texte.length >= 2;
  let rang = -1;

  return (
    <div ref={zoneRef} className={`search-wrapper ${visibleMobile ? 'mobile-visible' : ''}`}>
      <div className="search-champ">
        <Search size={18} className="search-icon" />
        <input
          ref={champRef}
          type="search"
          placeholder="Rechercher chantiers, tâches, documents..."
          className="search-input"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOuvert(true); }}
          onFocus={() => setOuvert(true)}
          onKeyDown={auClavier}
          role="combobox"
          aria-expanded={montrerListe}
          aria-controls="resultats-recherche"
          aria-autocomplete="list"
          aria-label="Rechercher"
        />
        {q && (
          <button type="button" className="search-effacer" onClick={() => { setQ(''); champRef.current?.focus(); }} aria-label="Effacer la recherche">
            <X size={16} />
          </button>
        )}
      </div>

      {montrerListe && (
        <div className="search-resultats" id="resultats-recherche" role="listbox">
          {etat === 'chargement' && !resultats && <div className="search-message">Recherche…</div>}
          {etat === 'erreur' && <div className="search-message">Recherche indisponible pour le moment (connexion ?).</div>}
          {resultats && !lignes.length && etat !== 'erreur' && (
            <div className="search-message">Aucun résultat pour « {texte} ».</div>
          )}
          {resultats && CATEGORIES.map((c) => {
            const liste = resultats[c.cle] ?? [];
            if (!liste.length) return null;
            return (
              <div key={c.cle} className="search-groupe">
                <div className="search-groupe-titre">{c.titre}</div>
                {liste.map((r) => {
                  rang += 1;
                  const i = rang;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      role="option"
                      aria-selected={i === actif}
                      className={`search-ligne ${i === actif ? 'actif' : ''}`}
                      onMouseEnter={() => setActif(i)}
                      onClick={() => aller({ c, r })}
                    >
                      <c.Icone size={16} className="search-ligne-icone" />
                      <span className="search-ligne-texte">
                        <span className="search-ligne-libelle">{c.libelle(r)}</span>
                        {c.detail(r) && <span className="search-ligne-detail">{c.detail(r)}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
