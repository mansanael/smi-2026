import { ConflictException } from '@nestjs/common';
import { conflitPointage, periodesSeChevauchent } from './conflits';
import { RessourcesService } from './ressources.service';
import { StatutEngin } from './entities/engin.entity';

describe('Conflits de pointage (même ouvrier, même jour)', () => {
  const surB = [{ statut: 'present', projetId: 'B', projetReference: 'PRJ-B' }];

  it('présent sur deux chantiers : conflit', () => {
    expect(conflitPointage({ statut: 'present', projetId: 'A' }, surB)).toMatch(/PRJ-B/);
  });

  it('deux demi-journées sur deux chantiers : permis', () => {
    expect(conflitPointage({ statut: 'demi_journee', projetId: 'A' }, [{ statut: 'demi_journee', projetId: 'B' }])).toBeNull();
  });

  it('absent ou en congé ailleurs : pas de conflit', () => {
    expect(conflitPointage({ statut: 'present', projetId: 'A' }, [{ statut: 'absent', projetId: 'B' }])).toBeNull();
    expect(conflitPointage({ statut: 'conge', projetId: 'A' }, surB)).toBeNull();
  });

  it('deux pointages sur le même chantier : refusé (il serait payé deux fois)', () => {
    expect(conflitPointage({ statut: 'demi_journee', projetId: 'B' }, surB)).toMatch(/déjà pointé ce jour-là sur ce chantier/);
  });
});

describe('Chevauchement de périodes', () => {
  it('se touchent ou se recouvrent', () => {
    expect(periodesSeChevauchent({ dateDebut: '2026-10-01', dateFin: '2026-10-15' }, { dateDebut: '2026-10-15', dateFin: '2026-10-20' })).toBe(true);
    expect(periodesSeChevauchent({ dateDebut: '2026-10-01', dateFin: '2026-10-14' }, { dateDebut: '2026-10-15', dateFin: '2026-10-20' })).toBe(false);
  });

  it('sans date de fin : occupé indéfiniment', () => {
    expect(periodesSeChevauchent({ dateDebut: '2026-10-01', dateFin: null }, { dateDebut: '2027-05-01', dateFin: '2027-05-02' })).toBe(true);
  });
});

describe('RessourcesService — affectation d’un engin', () => {
  function creer(engin: object, affectations: object[]) {
    const enginRepo = { findOne: jest.fn().mockResolvedValue(engin) };
    const affEnginRepo = {
      find: jest.fn().mockResolvedValue(affectations),
      create: jest.fn((a) => a),
      save: jest.fn((a) => Promise.resolve(a)),
    };
    const service = new RessourcesService({} as any, {} as any, enginRepo as any, {} as any, affEnginRepo as any, {} as any);
    return { service, affEnginRepo };
  }
  const pelle = { id: 'e1', designation: 'Pelle mécanique', statut: StatutEngin.DISPONIBLE };
  const surB = { dateDebut: '2026-10-10', dateFin: '2026-10-30', projet: { id: 'B', reference: 'PRJ-B' }, engin: pelle };

  it('déjà sur un autre chantier à ces dates : 409 avec le détail', async () => {
    const { service, affEnginRepo } = creer(pelle, [surB]);
    const essai = service.affecterEngin({ enginId: 'e1', projetId: 'A', dateDebut: '2026-10-20', dateFin: '2026-10-25' });
    await expect(essai).rejects.toThrow(ConflictException);
    await expect(service.affecterEngin({ enginId: 'e1', projetId: 'A', dateDebut: '2026-10-20' }))
      .rejects.toThrow(/Pelle mécanique est déjà affecté à PRJ-B du 10\/10\/2026 au 30\/10\/2026/);
    expect(affEnginRepo.save).not.toHaveBeenCalled();
  });

  it('après la fin de l’autre affectation : accepté', async () => {
    const { service, affEnginRepo } = creer(pelle, [surB]);
    await service.affecterEngin({ enginId: 'e1', projetId: 'A', dateDebut: '2026-10-31' });
    expect(affEnginRepo.save).toHaveBeenCalled();
  });

  it('engin en maintenance : refusé', async () => {
    const { service } = creer({ ...pelle, statut: StatutEngin.EN_MAINTENANCE }, []);
    await expect(service.affecterEngin({ enginId: 'e1', projetId: 'A', dateDebut: '2026-10-31' })).rejects.toThrow(/en maintenance/);
  });

  it('« affecter quand même » après confirmation', async () => {
    const { service, affEnginRepo } = creer(pelle, [surB]);
    await service.affecterEngin({ enginId: 'e1', projetId: 'A', dateDebut: '2026-10-20', forcer: true });
    expect(affEnginRepo.save).toHaveBeenCalled();
  });

  it('analyse du matin : engin sur deux chantiers en cours', async () => {
    const { service } = creer(pelle, [surB, { ...surB, dateDebut: '2026-10-25', dateFin: null, projet: { id: 'A', reference: 'PRJ-A' } }]);
    const conflits = await service.conflitsEnginsEnCours('2026-10-20');
    expect(conflits).toEqual([{ engin: 'Pelle mécanique', projets: [{ id: 'B', reference: 'PRJ-B' }, { id: 'A', reference: 'PRJ-A' }] }]);
  });
});
