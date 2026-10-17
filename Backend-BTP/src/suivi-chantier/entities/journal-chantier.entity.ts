import {
  Column, Entity, PrimaryGeneratedColumn, ManyToOne,
  JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Projet } from '../../projets/entities/projet.entity';

export enum MeteoChantier {
  ENSOLEILLE = 'ensoleille',
  NUAGEUX = 'nuageux',
  PLUIE = 'pluie',
  HARMATTAN = 'harmattan',
  ORAGE = 'orage',
}

@Entity('journaux_chantier')
export class JournalChantier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Projet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projet_id' })
  projet: Projet;

  @Column({ type: 'date', unique: false })
  date: Date;

  @Column({ type: 'enum', enum: MeteoChantier, nullable: true })
  meteo: MeteoChantier;

  @Column({ type: 'int', nullable: true })
  temperature: number; // °C

  @Column({ type: 'int', default: 0 })
  nombreOuvriers: number;

  @Column({ type: 'text', nullable: true })
  travauxRealises: string; // Description libre des travaux du jour

  @Column({ type: 'text', nullable: true })
  resteAFaire: string;

  @Column({ type: 'text', nullable: true })
  problemes: string; // Difficultés du jour (manques, pannes, retards…)

  @Column({ type: 'text', nullable: true })
  materiaux_receptionnes: string;

  @Column({ type: 'text', nullable: true })
  visitesDuJour: string; // Client, BET, maître d'œuvre...

  @Column({ type: 'text', nullable: true })
  observations: string;

  @Column({ nullable: true })
  redige_par: string;

  // Compte rendu préparé par l'IA à partir des notes vocales, relu et validé par redige_par
  @Column({ default: false })
  genereParIa: boolean;

  // Message simple pour le client, écrit par l'IA à partir de ce rapport validé (modifiable par l'équipe)
  @Column({ type: 'text', nullable: true })
  resumeClient: string | null;

  @Column({ default: false })
  resumeClientModifie: boolean; // corrigé à la main : l'IA ne le réécrit plus

  @CreateDateColumn()
  creeLe: Date;
}
