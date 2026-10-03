import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';

export enum RoleUtilisateur {
  DIRECTEUR_GENERAL = 'directeur_general',
  DIRECTEUR_TECHNIQUE = 'directeur_technique',
  CHEF_PROJET = 'chef_projet',
  CONDUCTEUR_TRAVAUX = 'conducteur_travaux',
  RESPONSABLE_ADMIN_FIN = 'responsable_admin_fin',
  MAGASINIER = 'magasinier',
  MAITRE_OUVRAGE_EXTERNE = 'maitre_ouvrage_externe',
}

@Entity('utilisateurs')
export class Utilisateur {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // exclu des SELECT par défaut
  motDePasse: string;

  @Column({ type: 'enum', enum: RoleUtilisateur, default: RoleUtilisateur.CHEF_PROJET })
  role: RoleUtilisateur;

  @Column({ default: true })
  actif: boolean;

  @Column({ nullable: true })
  telephone: string;

  @Column({ nullable: true })
  poste: string;

  @Column({ type: 'text', nullable: true })
  photo: string;

  @CreateDateColumn()
  creeLe: Date;

  @UpdateDateColumn()
  misAJourLe: Date;

  // Hash automatique du mot de passe avant insertion
  @BeforeInsert()
  @BeforeUpdate()
  async hashMotDePasse() {
    if (this.motDePasse) {
      this.motDePasse = await bcrypt.hash(this.motDePasse, 12);
    }
  }

  // Méthode de comparaison pour le login
  async verifierMotDePasse(motDePasseEnClair: string): Promise<boolean> {
    return bcrypt.compare(motDePasseEnClair, this.motDePasse);
  }
}
