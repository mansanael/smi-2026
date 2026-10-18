// Montant d'une carte KPI : le nombre en grand, « FCFA » en petit à côté.
// La taille s'adapte à la largeur de la carte pour que le montant tienne sur une ligne.
export default function MontantKpi({ valeur }) {
  return (
    <div className="kpi-value kpi-montant">
      {Number(valeur || 0).toLocaleString('fr-FR')}
      <span className="kpi-unite">FCFA</span>
    </div>
  );
}
