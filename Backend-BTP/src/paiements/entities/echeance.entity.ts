import {
  Column, Entity, PrimaryGeneratedColumn, ManyToOne,
  JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Projet } from '../../projets/entities/projet.entity';

// Tranche de paiement attendue du client (ex. 30 % à la signature)
@Entity('echeances_paiement')
export class Echeance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Projet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projet_id' })
  projet: Projet;

  @Column()
  libelle: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  montant: number; // FCFA

  @Column({ type: 'date' })
  dateLimite: string;

  // Relances faites auprès du client (téléphone, courrier…)
  @Column({ type: 'int', default: 0 })
  nombreRelances: number;

  @Column({ type: 'date', nullable: true })
  derniereRelanceLe: string | null;

  @CreateDateColumn()
  creeLe: Date;
}
