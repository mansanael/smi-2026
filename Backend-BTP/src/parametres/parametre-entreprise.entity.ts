import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

// Réglages propres à l'entreprise (une seule ligne, id = 1)
@Entity('parametres_entreprise')
export class ParametreEntreprise {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  // Heure (HH:MM, heure de Dakar) à partir de laquelle le rapport du jour est visible par le client
  @Column({ default: '18:00' })
  heurePublicationClient: string;

  // Jour (AAAA-MM-JJ) de la dernière analyse des alertes du matin : une seule par jour,
  // qu'elle vienne de la tâche programmée du serveur ou d'un service de réveil externe
  @Column({ type: 'varchar', length: 10, nullable: true })
  derniereAnalyseAlertes: string | null;

  // Pourcentages du devis estimatif (réglés par la direction)
  @Column({ type: 'double precision', default: 5 })
  tauxImprevus: number;

  @Column({ type: 'double precision', default: 15 })
  tauxPartEntreprise: number; // frais généraux et bénéfice

  @Column({ type: 'double precision', default: 18 })
  tauxTva: number; // fixé par l'État (18 % au Sénégal)

  @UpdateDateColumn()
  modifieLe: Date;
}
