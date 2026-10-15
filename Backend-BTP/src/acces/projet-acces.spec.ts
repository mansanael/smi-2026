import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjetAccesService } from './projet-acces.service';
import { ProjetAccesGuard } from './projet-acces.guard';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';

const PROJET_A = '11111111-1111-4111-8111-111111111111';
const PROJET_B = '22222222-2222-4222-8222-222222222222';

// Le chef de projet "cp" est membre du projet A uniquement
function creerService() {
  const membres: Record<string, string[]> = { cp: [PROJET_A], client: [PROJET_A] };
  const projetRepo = {
    find: jest.fn(({ where }) =>
      Promise.resolve((membres[where.membres.id] ?? []).map((id) => ({ id }))),
    ),
    existsBy: jest.fn(({ id, membres: m }) =>
      Promise.resolve((membres[m.id] ?? []).includes(id)),
    ),
  };
  return { service: new ProjetAccesService(projetRepo as any), projetRepo };
}

const dg = { id: 'dg', role: RoleUtilisateur.DIRECTEUR_GENERAL };
const cp = { id: 'cp', role: RoleUtilisateur.CHEF_PROJET };
const client = { id: 'client', role: RoleUtilisateur.MAITRE_OUVRAGE_EXTERNE };

describe('ProjetAccesService', () => {
  it('la direction voit tous les projets sans requête', async () => {
    const { service, projetRepo } = creerService();
    expect(await service.projetIdsAutorises(dg)).toBeNull();
    expect(await service.aAcces(dg, PROJET_B)).toBe(true);
    expect(projetRepo.existsBy).not.toHaveBeenCalled();
  });

  it('le chef de projet ne voit que ses projets', async () => {
    const { service } = creerService();
    expect(await service.projetIdsAutorises(cp)).toEqual([PROJET_A]);
    expect(await service.aAcces(cp, PROJET_A)).toBe(true);
    expect(await service.aAcces(cp, PROJET_B)).toBe(false);
  });

  it('un id de projet invalide est refusé sans erreur SQL', async () => {
    const { service, projetRepo } = creerService();
    expect(await service.aAcces(cp, 'pas-un-uuid')).toBe(false);
    expect(projetRepo.existsBy).not.toHaveBeenCalled();
  });

  it('verifier lève une 403 hors périmètre', async () => {
    const { service } = creerService();
    await expect(service.verifier(cp, PROJET_B)).rejects.toThrow(ForbiddenException);
  });
});

describe('ProjetAccesGuard', () => {
  function contexte(user: object, method: string, params: Record<string, string>): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ user, method, params }) }),
      getHandler: () => () => undefined,
      getClass: () => class {},
    } as unknown as ExecutionContext;
  }

  function creerGuard(nomParam?: string) {
    const reflector = { getAllAndOverride: jest.fn(() => nomParam) } as unknown as Reflector;
    return new ProjetAccesGuard(reflector, creerService().service);
  }

  it('laisse passer un membre du projet', async () => {
    await expect(creerGuard().canActivate(contexte(cp, 'POST', { projetId: PROJET_A }))).resolves.toBe(true);
  });

  it('bloque un utilisateur hors du projet', async () => {
    await expect(creerGuard().canActivate(contexte(cp, 'GET', { projetId: PROJET_B }))).rejects.toThrow(ForbiddenException);
  });

  it('lit le paramètre indiqué par @ProjetParam', async () => {
    await expect(creerGuard('id').canActivate(contexte(cp, 'GET', { id: PROJET_B }))).rejects.toThrow(ForbiddenException);
  });

  it('le client peut lire son projet', async () => {
    await expect(creerGuard().canActivate(contexte(client, 'GET', { projetId: PROJET_A }))).resolves.toBe(true);
  });

  it('le client ne peut rien modifier, même sur son projet', async () => {
    await expect(creerGuard().canActivate(contexte(client, 'POST', { projetId: PROJET_A }))).rejects.toThrow(ForbiddenException);
  });

  it('sans id de projet dans la route, laisse passer (filtrage fait par le service)', async () => {
    await expect(creerGuard().canActivate(contexte(cp, 'GET', {}))).resolves.toBe(true);
  });
});
