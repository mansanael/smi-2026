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

  @UpdateDateColumn()
  modifieLe: Date;
}
