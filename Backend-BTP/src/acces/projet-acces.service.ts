import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { Projet } from '../projets/entities/projet.entity';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';
import { ROLES_TOUS_PROJETS } from '../auth/roles';

export interface UtilisateurAcces {
  id: string;
  role: RoleUtilisateur;
}

/**
 * Règle d'accès aux projets :
 * - la direction et le resp. admin & finance voient tous les projets ;
 * - les autres rôles (chef de projet, conducteur, magasinier, client)
 *   ne voient que les projets dont ils sont membres.
 */
@Injectable()
export class ProjetAccesService {
  constructor(
    @InjectRepository(Projet)
    private readonly projetRepo: Repository<Projet>,
  ) {}

  voitTousLesProjets(user: UtilisateurAcces): boolean {
    return ROLES_TOUS_PROJETS.includes(user.role);
  }

  /** Identifiants des projets accessibles, ou null si l'utilisateur voit tout */
  async projetIdsAutorises(user: UtilisateurAcces): Promise<string[] | null> {
    if (this.voitTousLesProjets(user)) return null;
    const projets = await this.projetRepo.find({
      select: { id: true },
      where: { membres: { id: user.id } },
    });
    return projets.map((p) => p.id);
  }

  async aAcces(user: UtilisateurAcces, projetId: string): Promise<boolean> {
    if (this.voitTousLesProjets(user)) return true;
    if (!isUUID(projetId)) return false;
    return this.projetRepo.existsBy({ id: projetId, membres: { id: user.id } });
  }

  async verifier(user: UtilisateurAcces, projetId: string): Promise<void> {
    if (!(await this.aAcces(user, projetId))) {
      throw new ForbiddenException("Vous n'avez pas accès à ce projet.");
    }
  }
}
