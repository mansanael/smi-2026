import { BadRequestException } from '@nestjs/common';
import { calculerEstimation, RATIOS_PAR_DEFAUT, TAUX_PAR_DEFAUT } from './estimation.calcul';
import { normaliserParametresDevis } from '../voix/analyse-chantier.service';
import { EstimationService } from './estimation.service';

describe('Calcul du devis estimatif', () => {
  it('l’exemple expliqué : 100 m² à 200 000 FCFA/m² (économique)', () => {
    const e = calculerEstimation(RATIOS_PAR_DEFAUT, TAUX_PAR_DEFAUT, 100, 'economique');
    expect(e.prixM2Travaux).toBe(200000);
    expect(e).toMatchObject({
      coutTravaux: 20_000_000, imprevus: 1_000_000, partEntreprise: 3_000_000,
      totalHT: 24_000_000, tva: 4_320_000, totalTTC: 28_320_000,
    });
  });

  it('villa R+2 de 300 m² en standard : environ 110 millions TTC', () => {
    const e = calculerEstimation(RATIOS_PAR_DEFAUT, TAUX_PAR_DEFAUT, 300, 'standard');
    expect(e).toMatchObject({ coutTravaux: 78_000_000, totalHT: 93_600_000, tva: 16_848_000, totalTTC: 110_448_000 });
    expect(e.fourchetteTTC).toEqual({ min: 99_403_200, max: 121_492_800 });
    expect(e.lots.map((l) => l.code)[0]).toBe('fondations');
  });

  it('les taux de l’entreprise sont appliqués', () => {
    const e = calculerEstimation(RATIOS_PAR_DEFAUT, { tauxImprevus: 0, tauxPartEntreprise: 20, tauxTva: 18 }, 100, 'economique');
    expect(e).toMatchObject({ imprevus: 0, partEntreprise: 4_000_000, totalHT: 24_000_000 });
  });
});

describe('Lecture de la description par l’IA', () => {
  it('garde les paramètres dits, et rien d’autre', () => {
    expect(normaliserParametresDevis({
      typeOuvrage: 'villa', niveaux: 3, surfaceM2: '300', localisation: 'Mbao', finition: 'standard', prix: 1000,
    })).toEqual({ typeOuvrage: 'villa', niveaux: 3, surfaceM2: 300, localisation: 'Mbao', finition: 'standard' });
  });

  it('surface par étage : multipliée par le nombre de niveaux', () => {
    expect(normaliserParametresDevis({ niveaux: 3, surfaceM2: 150, surfaceParNiveau: true }).surfaceM2).toBe(450);
  });

  it('valeurs absurdes ou absentes : vides', () => {
    expect(normaliserParametresDevis({ niveaux: 0, surfaceM2: -5, finition: 'luxe' }))
      .toEqual({ typeOuvrage: null, niveaux: null, surfaceM2: null, localisation: null, finition: null });
  });
});

describe('EstimationService', () => {
  function creer(lots: object[] = RATIOS_PAR_DEFAUT, parametres = { probleme: false }) {
    const ratioRepo = {
      find: jest.fn().mockResolvedValue(lots),
      create: jest.fn((r) => r),
      save: jest.fn((r) => Promise.resolve(r)),
    };
    const params = { get: jest.fn().mockResolvedValue({ ...TAUX_PAR_DEFAUT }), update: jest.fn() };
    const analyse = { extraireParametresDevis: jest.fn().mockResolvedValue(parametres) };
    const budget = { addLigneDevis: jest.fn().mockResolvedValue({}) };
    return { service: new EstimationService(ratioRepo as any, params as any, analyse as any, budget as any), ratioRepo, budget, analyse };
  }

  it('première utilisation : la table est remplie avec les prix d’exemple', async () => {
    const { service, ratioRepo } = creer([]);
    const bareme = await service.getBareme();
    expect(ratioRepo.save).toHaveBeenCalled();
    expect(bareme.lots).toHaveLength(8);
    expect(bareme.taux.tauxTva).toBe(18);
  });

  it('sans surface dite : pas de chiffrage, la finition « standard » est supposée', async () => {
    const { service } = creer(RATIOS_PAR_DEFAUT, { typeOuvrage: 'villa', niveaux: 3, surfaceM2: null, localisation: null, finition: null } as any);
    const r = await service.analyser('une villa R+2');
    expect(r).toMatchObject({ estimation: null, finitionSupposee: true });
  });

  it('créer le devis : une ligne par lot + imprévus + frais, total = prix HT', async () => {
    const { service, budget } = creer();
    const { lignesCreees, estimation } = await service.creerDevis('p1', 300, 'standard');
    expect(lignesCreees).toBe(10);
    const total = budget.addLigneDevis.mock.calls.reduce((s, [, l]) => s + l.quantite * l.prixUnitaire, 0);
    expect(total).toBe(estimation.totalHT);
  });

  it('un lot inconnu est refusé', async () => {
    const { service } = creer();
    await expect(service.updateBareme([{ code: 'piscine', prixEconomique: 1, prixStandard: 1, prixHautStanding: 1 }], TAUX_PAR_DEFAUT))
      .rejects.toThrow(BadRequestException);
  });
});
