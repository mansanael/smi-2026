import { motifLike, normaliser, RechercheService } from './recherche.service';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';

describe('RechercheService', () => {
  it('compare sans majuscules ni accents', () => {
    expect(normaliser('  Béton ARMÉ ')).toBe('beton arme');
  });

  it('cherche % et _ tels quels', () => {
    expect(motifLike('50%_x')).toBe('%50\\%\\_x%');
  });

  it('ne cherche rien sous 2 caractères ni hors de tout projet', async () => {
    const acces = { projetIdsAutorises: jest.fn().mockResolvedValue([]) };
    const service = new RechercheService({} as any, {} as any, {} as any, acces as any);
    const vide = { projets: [], taches: [], documents: [] };
    expect(await service.rechercher('a', { id: 'u', role: RoleUtilisateur.CHEF_PROJET })).toEqual(vide);
    expect(acces.projetIdsAutorises).not.toHaveBeenCalled();
    expect(await service.rechercher('villa', { id: 'u', role: RoleUtilisateur.CHEF_PROJET })).toEqual(vide);
  });
});
