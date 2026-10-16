import {
  Column, Entity, PrimaryGeneratedColumn, ManyToOne,
  JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Projet } from '../../projets/entities/projet.entity';

// Observation dictée sur le chantier. Seul le texte est conservé, pas l'audio
// (moins de stockage, et la voix est une donnée personnelle).
@Entity('notes_vocales')
export class NoteVocale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Projet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projet_id' })
  projet: Projet;

  @Column({ type: 'text' })
  texte: string;

  @Column({ type: 'int', nullable: true })
  dureeSecondes: number;

  // Moment de l'enregistrement sur le chantier (peut précéder l'envoi si hors ligne)
  @Column({ type: 'timestamptz' })
  enregistreeLe: Date;

  @Column()
  auteurId: string;

  @Column()
  auteurNom: string;

  @CreateDateColumn()
  creeLe: Date;
}
