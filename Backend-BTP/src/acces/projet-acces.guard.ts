import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjetAccesService } from './projet-acces.service';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';

const PROJET_PARAM_KEY = 'projetParam';

/** Nom du paramètre de route qui contient l'id du projet (par défaut : projetId) */
export const ProjetParam = (nom: string) => SetMetadata(PROJET_PARAM_KEY, nom);

/**
 * À placer après JwtAuthGuard.
 * - Le client (maître d'ouvrage) est en lecture seule.
 * - Si la route contient un id de projet, l'utilisateur doit y avoir accès.
 */
@Injectable()
export class ProjetAccesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly acces: ProjetAccesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (user?.role === RoleUtilisateur.MAITRE_OUVRAGE_EXTERNE && req.method !== 'GET') {
      throw new ForbiddenException('Votre accès est en lecture seule.');
    }

    const nomParam =
      this.reflector.getAllAndOverride<string>(PROJET_PARAM_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'projetId';
    const projetId = req.params?.[nomParam];
    if (projetId) await this.acces.verifier(user, projetId);

    return true;
  }
}
