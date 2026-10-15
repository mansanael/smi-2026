import {
  Column, Entity, PrimaryGeneratedColumn, ManyToOne,
  JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Projet } from '../../projets/entities/projet.entity';

export enum ModePaiement {
  ESPECES = 'especes',
  VIREMENT = 'virement',
  CHEQUE = 'cheque',
  WAVE = 'wave',
  ORANGE_MONEY = 'orange_money',
  AUTRE = 'autre',
}

// Versement reçu du client
@Entity('paiements_client')
export class Paiement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Projet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projet_id' })
  projet: Projet;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  montant: number; // FCFA

  @Column({ type: 'enum', enum: ModePaiement })
  mode: ModePaiement;

  @Column({ nullable: true })
  reference: string; // n° de chèque, de virement, de transaction Wave…

  @Column({ type: 'text', nullable: true })
  observations: string;

  @Column({ nullable: true })
  enregistrePar: string;

  @CreateDateColumn()
  creeLe: Date;
}
