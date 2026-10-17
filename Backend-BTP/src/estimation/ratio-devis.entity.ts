import { Column, Entity, PrimaryColumn } from 'typeorm';

// Prix au m² construit d'un lot, selon la finition : la « bibliothèque de prix » de l'entreprise.
// Réglée par la direction dans Administration ; sert au devis estimatif.
@Entity('ratios_devis')
export class RatioDevis {
  @PrimaryColumn()
  code: string; // ex. gros_oeuvre

  @Column()
  libelle: string;

  @Column({ type: 'int', default: 0 })
  ordre: number;

  @Column({ type: 'int' })
  prixEconomique: number; // FCFA par m²

  @Column({ type: 'int' })
  prixStandard: number;

  @Column({ type: 'int' })
  prixHautStanding: number;
}
