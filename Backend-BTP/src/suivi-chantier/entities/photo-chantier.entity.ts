import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Projet } from '../../projets/entities/projet.entity';

export enum CategoriePhoto {
  AVANCEMENT = 'avancement',
  GROS_OEUVRE = 'gros_oeuvre',
  SECOND_OEUVRE = 'second_oeuvre',
  SECURITE = 'securite',
  RECEPTION = 'reception',
  AUTRE = 'autre',
}

@Entity('photos_chantier')
export class PhotoChantier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Projet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projet_id' })
  projet: Projet;

  @Column()
  titre: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text' })
  photoUrl: string; // Base64 data URL ou URL d'hébergement

  @Column({ type: 'date' })
  datePrise: Date;

  @Column({
    type: 'enum',
    enum: CategoriePhoto,
    default: CategoriePhoto.AVANCEMENT,
  })
  categorie: CategoriePhoto;

  @Column({ nullable: true })
  zone: string; // ex: Bâtiment A - Étage 2, Fondation, Toiture...

  @Column({ nullable: true })
  prisPar: string; // Conducteur / Chef de chantier

  @CreateDateColumn()
  creeLe: Date;
}
