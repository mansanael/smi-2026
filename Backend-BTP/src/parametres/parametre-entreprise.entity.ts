import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

// Réglages propres à l'entreprise (une seule ligne, id = 1)
@Entity('parametres_entreprise')
export class ParametreEntreprise {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  // Heure (HH:MM, heure de Dakar) à partir de laquelle le rapport du jour est visible par le client
  @Column({ default: '18:00' })
  heurePublicationClient: string;

  @UpdateDateColumn()
  modifieLe: Date;
}
