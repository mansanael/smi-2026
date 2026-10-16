import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getProjets } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { ROLES_TERRAIN, estLectureSeule } from '../roles';
import Dashboard from './Dashboard';
import AlertesRecentes from '../components/accueil/AlertesRecentes';
import CartesChantiers from '../components/accueil/CartesChantiers';
import AccueilClient from '../components/accueil/AccueilClient';

// La direction voit tout le portefeuille ; les autres arrivent sur leurs chantiers
const ROLES_PORTEFEUILLE = ['directeur_general', 'directeur_technique', 'responsable_admin_fin'];

export default function Accueil() {
  const { user } = useAuth();
  const portefeuille = ROLES_PORTEFEUILLE.includes(user?.role);
  const terrain = ROLES_TERRAIN.includes(user?.role);
  const client = estLectureSeule(user);
  const [projets, setProjets] = useState(null);

  useEffect(() => {
    if (portefeuille) return;
    getProjets().then((l) => setProjets(l || [])).catch(() => setProjets([]));
  }, [portefeuille]);

  if (portefeuille) return <Dashboard />;
  if (projets === null) return <div className="spinner" />;
  if (client) return <AccueilClient user={user} projets={projets} />;

  // Un seul chantier (cas courant sur le terrain) : on l'ouvre directement, sur la voix
  if (terrain && projets.length === 1) {
    return <Navigate to={`/projets/${projets[0].id}`} replace />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bonjour {user?.prenom}</h1>
          <p className="subtitle">
            {terrain ? 'Choisissez le chantier sur lequel vous êtes' : 'Vos chantiers et ce qui demande votre attention'}
          </p>
        </div>
      </div>
      <AlertesRecentes />
      <CartesChantiers projets={projets} avecMicro />
    </div>
  );
}
