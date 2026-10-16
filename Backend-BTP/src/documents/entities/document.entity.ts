import {
  Column, Entity, PrimaryGeneratedColumn, ManyToOne,
  JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Projet } from '../../projets/entities/projet.entity';

export enum TypeDocument {
  DAO = 'dao',
  OFFRE_TECHNIQUE = 'offre_technique',
  OFFRE_FINANCIERE = 'offre_financiere',
  MARCHE_SIGNE = 'marche_signe',
  CCAP = 'ccap',
  CCTP = 'cctp',
  BORDEREAU_PRIX = 'bordereau_prix',
  PGSS = 'pgss',
  PV_INSTALLATION = 'pv_installation',
  PLANNING = 'planning',
  JOURNAL_CHANTIER = 'journal_chantier',
  PV_REUNION = 'pv_reunion',
  ORDRE_SERVICE = 'ordre_service',
  AVENANT = 'avenant',
  PV_RECEPTION_PROVISOIRE = 'pv_reception_provisoire',
  PV_RECEPTION_DEFINITIVE = 'pv_reception_definitive',
  CAUTION = 'caution',
  ATTESTATION_FISCALE = 'attestation_fiscale',
  PLAN = 'plan',
  PHOTO = 'photo',
  AUTRE = 'autre',
}

// Documents montrés au client tant que personne n'a décidé autrement (pièces du marché, plans, PV…).
// Les offres, cautions, attestations et documents « autre » restent internes par défaut.
export const TYPES_PARTAGES_CLIENT: TypeDocument[] = [
  TypeDocument.MARCHE_SIGNE, TypeDocument.CCAP, TypeDocument.CCTP, TypeDocument.PLAN,
  TypeDocument.PLANNING, TypeDocument.PV_INSTALLATION, TypeDocument.PV_REUNION,
  TypeDocument.ORDRE_SERVICE, TypeDocument.AVENANT, TypeDocument.PV_RECEPTION_PROVISOIRE,
  TypeDocument.PV_RECEPTION_DEFINITIVE, TypeDocument.JOURNAL_CHANTIER, TypeDocument.PHOTO,
];

export const estVisibleClient = (d: Pick<Document, 'type' | 'visibleClient'>): boolean =>
  d.visibleClient ?? TYPES_PARTAGES_CLIENT.includes(d.type);

export enum PhaseDocument {
  APPEL_OFFRES = 'appel_offres',
  CONTRACTUALISATION = 'contractualisation',
  PREPARATION = 'preparation',
  EXECUTION = 'execution',
  RECEPTION = 'reception',
  CLOTURE = 'cloture',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Projet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projet_id' })
  projet: Projet;

  @Column()
  nom: string;

  @Column({ type: 'enum', enum: TypeDocument })
  type: TypeDocument;

  @Column({ type: 'enum', enum: PhaseDocument })
  phase: PhaseDocument;

  @Column()
  cheminFichier: string; // Chemin relatif ou URL MinIO

  @Column({ nullable: true })
  mimeType: string;

  @Column({ type: 'int', nullable: true })
  tailleFichier: number; // bytes

  @Column({ default: 1 })
  version: number;

  @Column({ type: 'date', nullable: true })
  dateExpiration: Date; // Pour attestations fiscales, cautions...

  @Column({ nullable: true })
  deposePar: string;

  // null = selon le type (voir TYPES_PARTAGES_CLIENT) ; true/false = choix explicite de l'équipe
  @Column({ type: 'boolean', nullable: true })
  visibleClient: boolean | null;

  @CreateDateColumn()
  creeLe: Date;
}
