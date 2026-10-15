import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Utilisateur } from '../../utilisateurs/entities/utilisateur.entity';

export enum StatutProjet {
  EN_ETUDE = 'en_etude',
  SOUMISSIONNE = 'soumissionne',
  ATTRIBUE = 'attribue',
  EN_PREPARATION = 'en_preparation',
  EN_COURS = 'en_cours',
  TRAVAUX_TERMINES = 'travaux_termines',
  EN_GARANTIE = 'en_garantie',
  CLOTURE = 'cloture',
}

export enum TypeMarche {
  PUBLIC = 'public',
  PRIVE = 'prive',
  PPP = 'ppp',
}

export enum TypeProjet {
  BATIMENT_RESIDENTIEL = 'batiment_residentiel',
  BATIMENT_ADMINISTRATIF = 'batiment_administratif',
  INFRASTRUCTURE_ROUTIERE = 'infrastructure_routiere',
  OUVRAGE_HYDRAULIQUE = 'ouvrage_hydraulique',
  GENIE_CIVIL = 'genie_civil',
  AMENAGEMENT_URBAIN = 'amenagement_urbain',
}

@Entity('projets')
export class Projet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Identification
  @Column({ unique: true })
  reference: string;

  @Column()
  intitule: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: TypeMarche })
  typeMarche: TypeMarche;

  @Column({ type: 'enum', enum: TypeProjet, nullable: true })
  typeProjet: TypeProjet;

  // Localisation
  @Column()
  region: string;

  @Column()
  commune: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  // Parties prenantes
  @Column()
  maitreOuvrage: string;

  @Column({ nullable: true })
  maitreOeuvre: string;

  @Column({ nullable: true })
  bureauEtudesTechniques: string;

  @Column({ nullable: true })
  bureauControle: string;

  // Financier
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  montantMarche: number;

  @Column()
  sourceFinancement: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  retenueGarantiePourcent: number;

  // Calendrier
  @Column({ type: 'date', nullable: true })
  dateNotification: Date;

  @Column({ type: 'date', nullable: true })
  dateDemarrage: Date;

  @Column({ type: 'int', nullable: true })
  dureeContractuelleJours: number;

  @Column({ type: 'date', nullable: true })
  dateReceptionProvisoire: Date;

  @Column({ type: 'date', nullable: true })
  dateReceptionDefinitive: Date;

  // Réglementaire
  @Column({ nullable: true })
  numeroMarche: string;

  @Column({ nullable: true })
  referenceAppelOffres: string;

  @Column({ nullable: true })
  modePassation: string;

  @Column({ nullable: true })
  nineaClient: string;

  // Statut / cycle de vie
  @Column({ type: 'enum', enum: StatutProjet, default: StatutProjet.EN_ETUDE })
  statut: StatutProjet;

  // Équipe du projet : chef de projet, conducteurs, magasiniers, client…
  // (la direction et le resp. admin & finance voient tous les projets sans être membres)
  @ManyToMany(() => Utilisateur)
  @JoinTable({
    name: 'projet_membres',
    joinColumn: { name: 'projet_id' },
    inverseJoinColumn: { name: 'utilisateur_id' },
  })
  membres: Utilisateur[];

  @CreateDateColumn()
  creeLe: Date;

  @UpdateDateColumn()
  misAJourLe: Date;
}