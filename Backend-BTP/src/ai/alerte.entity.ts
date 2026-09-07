import {
  Column, CreateDateColumn, Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum GraviteAlerte {
  INFO = 'info',
  WARNING = 'warning',
  DANGER = 'danger',
}

export enum TypeAlerte {
  BUDGET_DEPASSE = 'budget_depasse',
  TACHE_EN_RETARD = 'tache_en_retard',
  DOCUMENT_EXPIRE = 'document_expire',
  INCIDENT_HSE = 'incident_hse',
  AVANCEMENT_FAIBLE = 'avancement_faible',
}

@Entity('ai_alertes')
export class Alerte {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TypeAlerte })
  type: TypeAlerte;

  @Column({ type: 'enum', enum: GraviteAlerte, default: GraviteAlerte.WARNING })
  gravite: GraviteAlerte;

  @Column({ nullable: true })
  projetId: string;

  @Column({ nullable: true })
  projetReference: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  lu: boolean;

  @CreateDateColumn()
  creeLe: Date;
}
