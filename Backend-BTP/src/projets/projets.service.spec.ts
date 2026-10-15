import { BadRequestException } from '@nestjs/common';
import { ProjetsService } from './projets.service';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';

const dg = { id: 'dg', role: RoleUtilisateur.DIRECTEUR_GENERAL };
const cp = { id: 'cp', role: RoleUtilisateur.CHEF_PROJET };

function creerService(projetIdsAutorises: string[] | null) {
  const projetRepo = {
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((p) => Promise.resolve({ id: 'nouveau', ...p })),
    findOneBy: jest.fn().mockResolvedValue({ id: 'p1' }),
    findOne: jest.fn().mockResolvedValue({ id: 'p1', membres: [] }),
  };
  const utilisateurRepo = { findBy: jest.fn() };
  const acces = {
    projetIdsAutorises: jest.fn().mockResolvedValue(projetIdsAutorises),
    voitTousLesProjets: jest.fn((u) => u.role === RoleUtilisateur.DIRECTEUR_GENERAL),
  };
  const service = new ProjetsService(projetRepo as any, utilisateurRepo as any, acces as any);
  return { service, projetRepo, utilisateurRepo };
}

describe('ProjetsService', () => {
  describe('findAll', () => {
    it('renvoie tous les projets à la direction', async () => {
      const { service, projetRepo } = creerService(null);
      await service.findAll(dg);
      expect(projetRepo.find).toHaveBeenCalledWith();
    });

    it('filtre sur les projets dont le chef de projet est membre', async () => {
      const { service, projetRepo } = creerService(['p1']);
      await service.findAll(cp);
      expect(projetRepo.find).toHaveBeenCalledWith({ where: { id: expect.anything() } });
    });

    it('ne requête pas la base si l’utilisateur n’a aucun projet', async () => {
      const { service, projetRepo } = creerService([]);
      expect(await service.findAll(cp)).toEqual([]);
      expect(projetRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('ajoute le chef de projet créateur à l’équipe', async () => {
      const { service, projetRepo } = creerService([]);
      await service.create({ reference: 'P-1' } as any, cp);
      expect(projetRepo.save).toHaveBeenCalledWith(expect.objectContaining({ membres: [{ id: 'cp' }] }));
    });

    it('n’ajoute pas la direction comme membre', async () => {
      const { service, projetRepo } = creerService(null);
      await service.create({ reference: 'P-2' } as any, dg);
      expect(projetRepo.save).toHaveBeenCalledWith(expect.not.objectContaining({ membres: expect.anything() }));
    });

    it('ne renvoie pas la liste des membres dans la réponse', async () => {
      const { service } = creerService([]);
      const projet = await service.create({ reference: 'P-3' } as any, cp);
      expect(projet).not.toHaveProperty('membres');
    });
  });

  describe('setMembres', () => {
    it('refuse un utilisateur inexistant', async () => {
      const { service, utilisateurRepo } = creerService(null);
      utilisateurRepo.findBy.mockResolvedValue([{ id: 'u1' }]);
      await expect(service.setMembres('p1', ['u1', 'u2'])).rejects.toThrow(BadRequestException);
    });

    it('enregistre l’équipe sans doublon', async () => {
      const { service, utilisateurRepo, projetRepo } = creerService(null);
      utilisateurRepo.findBy.mockResolvedValue([{ id: 'u1' }]);
      await service.setMembres('p1', ['u1', 'u1']);
      expect(projetRepo.save).toHaveBeenCalledWith(expect.objectContaining({ membres: [{ id: 'u1' }] }));
    });
  });
});
