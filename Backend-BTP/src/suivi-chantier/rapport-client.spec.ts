import { ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { SuiviChantierService } from './suivi-chantier.service';
import { estPublieAuClient, instantPublication } from '../parametres/parametres.service';
import { AnalyseChantierService } from '../voix/analyse-chantier.service';
import { CronController } from '../ai/cron.controller';

// @nestjs/schedule (chargé par AlertesService) n'est pas lisible par Jest : on le remplace ici
jest.mock('../ai/alertes.service', () => ({ AlertesService: class {} }));

describe('Heure de publication du rapport au client', () => {
  it('le rapport du 16/10 est publié le 16/10 à l’heure choisie (heure de Dakar = UTC)', () => {
    expect(instantPublication('2026-10-16', '18:00').toISOString()).toBe('2026-10-16T18:00:00.000Z');
    expect(estPublieAuClient('2026-10-16', '18:00', new Date('2026-10-16T17:59:00Z'))).toBe(false);
    expect(estPublieAuClient('2026-10-16', '18:00', new Date('2026-10-16T18:00:00Z'))).toBe(true);
  });

  it('l’entreprise peut choisir une autre heure', () => {
    expect(estPublieAuClient('2026-10-16', '17:00', new Date('2026-10-16T17:30:00Z'))).toBe(true);
  });
});

describe('Rapport journalier et message du client', () => {
  function creer(journaux: object[] = [], resume: string | null = 'Aujourd’hui sur votre chantier, la dalle a été coulée.') {
    const journalRepo = {
      find: jest.fn().mockResolvedValue(journaux),
      findOne: jest.fn().mockResolvedValue(journaux[0] ?? null),
      create: jest.fn((j) => j),
      save: jest.fn((j) => Promise.resolve({ id: 'j1', ...j })),
    };
    const analyse = { resumerPourClient: jest.fn().mockResolvedValue(resume) };
    const parametres = { get: jest.fn().mockResolvedValue({ heurePublicationClient: '18:00' }) };
    const service = new SuiviChantierService(journalRepo as any, {} as any, {} as any, analyse as any, parametres as any);
    return { service, journalRepo, analyse };
  }

  it('à la validation, l’IA prépare le message du client', async () => {
    const { service, analyse } = creer();
    const j = await service.createJournal('p1', { date: '2026-10-16' as any, travauxRealises: '- Coulage dalle R+1' });
    expect(analyse.resumerPourClient).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-10-16', travauxRealises: '- Coulage dalle R+1' }));
    expect(j.resumeClient).toContain('la dalle a été coulée');
  });

  it('le message envoyé par l’application ne remplace pas celui de l’IA', async () => {
    const { service } = creer();
    const j = await service.createJournal('p1', { date: '2026-10-16' as any, travauxRealises: 'x', resumeClient: 'texte forcé' } as any);
    expect(j.resumeClient).not.toBe('texte forcé');
  });

  it('IA indisponible : le rapport est enregistré quand même, sans message', async () => {
    const { service, journalRepo } = creer([], null);
    const j = await service.createJournal('p1', { date: '2026-10-16' as any, travauxRealises: 'x' });
    expect(journalRepo.save).toHaveBeenCalled();
    expect(j.resumeClient).toBeNull();
  });

  it('le client ne voit pas le rapport du jour avant l’heure de publication', async () => {
    const aujourdhui = new Date().toISOString().slice(0, 10);
    const demain = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const { service } = creer([{ id: 'futur', date: demain }, { id: 'hier', date: '2026-10-15' }, { id: 'jour', date: aujourdhui }]);
    const client = (await service.getJournaux('p1', true)).map((j) => j.id);
    expect(client).toContain('hier');
    expect(client).not.toContain('futur');
    expect((await service.getJournaux('p1')).map((j) => j.id)).toEqual(['futur', 'hier', 'jour']);
  });

  it('une correction à la main est conservée, la régénération repasse par l’IA', async () => {
    const { service, analyse } = creer([{ id: 'j1', date: '2026-10-16', travauxRealises: 'x' }]);
    const corrige = await service.setResumeClient('p1', 'j1', '  Message relu par le chef de projet  ');
    expect(corrige).toMatchObject({ resumeClient: 'Message relu par le chef de projet', resumeClientModifie: true });
    const regenere = await service.regenererResumeClient('p1', 'j1');
    expect(analyse.resumerPourClient).toHaveBeenCalled();
    expect(regenere.resumeClientModifie).toBe(false);
  });
});

describe('Message du client rédigé par l’IA', () => {
  const fetchOriginal = global.fetch;
  afterEach(() => { global.fetch = fetchOriginal; });
  const config = { get: () => 'cle-test' } as any;

  it('envoie le rapport validé et les consignes (pas de blessés, vocabulaire expliqué)', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ choices: [{ message: { content: '{"resume": "Aujourd’hui sur votre chantier, la dalle a été coulée."}' } }] }),
    });
    global.fetch = fetchMock;
    const resume = await new AnalyseChantierService(config).resumerPourClient({
      date: '2026-10-16', travauxRealises: '- Coulage dalle', problemes: '- Manœuvre blessé',
    });
    expect(resume).toBe('Aujourd’hui sur votre chantier, la dalle a été coulée.');
    const corps = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(corps.messages[0].content).toMatch(/Ne parle JAMAIS de blessures/);
    expect(corps.messages[1].content).toContain('Coulage dalle');
  });

  it('rapport vide : pas d’appel à l’IA', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock;
    expect(await new AnalyseChantierService(config).resumerPourClient({ date: '2026-10-16' })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('Réveil externe du serveur (alertes de 7 h)', () => {
  const alertes = { analyserUneFoisParJour: jest.fn().mockResolvedValue({ lancee: true }) };
  const controleur = (secret?: string) => new CronController({ get: () => secret } as any, alertes as any);

  it('refuse un appel sans le secret', async () => {
    await expect(controleur('s3cret').alertes('Bearer faux')).rejects.toThrow(ForbiddenException);
    await expect(controleur(undefined).alertes('Bearer x')).rejects.toThrow(ServiceUnavailableException);
  });

  it('lance l’analyse avec le bon secret', async () => {
    expect(await controleur('s3cret').alertes('Bearer s3cret')).toEqual({ lancee: true });
  });
});
