import { BadRequestException, ConflictException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { TranscriptionService } from './transcription.service';
import { NotesVocalesService } from './notes-vocales.service';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';
import { GraviteAlerte, TypeAlerte } from '../ai/alerte.entity';
import {
  AnalyseChantierService, extraireJson, normaliserCompteRendu, normaliserProbleme,
} from './analyse-chantier.service';

const AUDIO = Buffer.from('faux audio').toString('base64');
const config = (cle = 'cle-test') => ({ get: () => cle }) as any;
const reponse = (status: number, corps: object | string) =>
  ({ ok: status < 300, status, json: async () => corps, text: async () => JSON.stringify(corps) }) as Response;

describe('TranscriptionService', () => {
  const fetchOriginal = global.fetch;
  afterEach(() => { global.fetch = fetchOriginal; });

  it('renvoie le texte transcrit, en français, avec le vocabulaire de chantier', async () => {
    const fetchMock = jest.fn().mockResolvedValue(reponse(200, { text: ' Le carrelage est terminé. ' }));
    global.fetch = fetchMock;
    const texte = await new TranscriptionService(config()).transcrire(AUDIO, 'audio/webm;codecs=opus');
    expect(texte).toBe('Le carrelage est terminé.');
    const form = fetchMock.mock.calls[0][1].body as FormData;
    expect(form.get('model')).toBe('whisper-large-v3');
    expect(form.get('language')).toBe('fr');
    expect(String(form.get('prompt'))).toContain('carrelage');
    expect((form.get('file') as File).name).toBe('note.webm');
  });

  it('accepte le préfixe data: et le format mp4 de l’iPhone', async () => {
    const fetchMock = jest.fn().mockResolvedValue(reponse(200, { text: 'ok' }));
    global.fetch = fetchMock;
    await new TranscriptionService(config()).transcrire(`data:audio/mp4;base64,${AUDIO}`, 'audio/mp4');
    expect((fetchMock.mock.calls[0][1].body.get('file') as File).name).toBe('note.mp4');
  });

  it('passe au modèle turbo quand la limite est atteinte', async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(reponse(429, { error: 'rate limit' }))
      .mockResolvedValueOnce(reponse(200, { text: 'secours' }));
    global.fetch = fetchMock;
    expect(await new TranscriptionService(config()).transcrire(AUDIO, 'audio/webm')).toBe('secours');
    expect(fetchMock.mock.calls[1][1].body.get('model')).toBe('whisper-large-v3-turbo');
  });

  it('renvoie 503 (réessai plus tard) si tous les modèles sont saturés', async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse(429, { error: 'rate limit' }));
    await expect(new TranscriptionService(config()).transcrire(AUDIO, 'audio/webm')).rejects.toThrow(ServiceUnavailableException);
  });

  it('renvoie 503 si Groq est injoignable (pas de réseau côté serveur)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNRESET'));
    await expect(new TranscriptionService(config()).transcrire(AUDIO, 'audio/webm')).rejects.toThrow(ServiceUnavailableException);
  });

  it('refuse un format non audio sans appeler Groq', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock;
    await expect(new TranscriptionService(config()).transcrire(AUDIO, 'audio/aac')).rejects.toThrow(BadRequestException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('signale l’absence de clé Groq', async () => {
    await expect(new TranscriptionService(config('')).transcrire(AUDIO, 'audio/webm')).rejects.toThrow(ServiceUnavailableException);
  });
});

describe('NotesVocalesService', () => {
  const auteur = { id: 'u1', nom: 'Diop', prenom: 'Awa', role: RoleUtilisateur.CONDUCTEUR_TRAVAUX };

  const pasDeProbleme = { probleme: false, gravite: GraviteAlerte.WARNING, resume: '' };

  function creer(existante: object | null = null, probleme = pasDeProbleme, notesDuJour: object[] = []) {
    const noteRepo = {
      findOne: jest.fn().mockResolvedValue(existante),
      find: jest.fn().mockResolvedValue(notesDuJour),
      create: jest.fn((n) => n),
      save: jest.fn((n) => Promise.resolve(n)),
      remove: jest.fn(),
    };
    const alerteRepo = { create: jest.fn((a) => a), save: jest.fn((a) => Promise.resolve(a)) };
    const projetRepo = { findOne: jest.fn().mockResolvedValue({ id: 'p1', reference: 'PRJ-001' }) };
    const transcription = { transcrire: jest.fn().mockResolvedValue('Coffrage des poteaux terminé') };
    const analyse = {
      detecterProbleme: jest.fn().mockResolvedValue(probleme),
      preparerCompteRendu: jest.fn().mockResolvedValue({ travauxRealises: '- Coffrage' }),
    };
    const service = new NotesVocalesService(noteRepo as any, alerteRepo as any, projetRepo as any, transcription as any, analyse as any);
    return { service, noteRepo, alerteRepo, transcription, analyse };
  }

  it('transcrit et enregistre la note avec son auteur', async () => {
    const { service, alerteRepo } = creer();
    const note = await service.create('p1', { audio: AUDIO, mimeType: 'audio/webm', dureeSecondes: 12 }, auteur);
    expect(note).toMatchObject({ texte: 'Coffrage des poteaux terminé', auteurNom: 'Awa Diop', dureeSecondes: 12, probleme: false });
    expect(alerteRepo.save).not.toHaveBeenCalled();
  });

  it('un problème signalé dans la note crée une alerte pour le chef de projet et la direction', async () => {
    const { service, alerteRepo } = creer(null, { probleme: true, gravite: GraviteAlerte.DANGER, resume: 'Un ouvrier blessé à la main' });
    const note = await service.create('p1', { audio: AUDIO, mimeType: 'audio/webm' }, auteur);
    expect(note).toMatchObject({ probleme: true, resumeProbleme: 'Un ouvrier blessé à la main' });
    expect(alerteRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      type: TypeAlerte.PROBLEME_CHANTIER, gravite: GraviteAlerte.DANGER, projetId: 'p1', projetReference: 'PRJ-001',
      message: expect.stringContaining('Un ouvrier blessé à la main (signalé par Awa Diop)'),
    }));
  });

  it('le compte rendu demande au moins une note ce jour-là', async () => {
    const { service, analyse } = creer();
    await expect(service.preparerCompteRendu('p1', '2026-10-16')).rejects.toThrow(BadRequestException);
    expect(analyse.preparerCompteRendu).not.toHaveBeenCalled();
  });

  it('le compte rendu ignore les notes sans parole', async () => {
    const notes = [{ texte: '(aucune parole reconnue)' }, { texte: 'Dalle coulée', auteurNom: 'Awa Diop', enregistreeLe: new Date() }];
    const { service, analyse } = creer(null, pasDeProbleme, notes);
    await service.preparerCompteRendu('p1', '2026-10-16');
    expect(analyse.preparerCompteRendu).toHaveBeenCalledWith([notes[1]], '2026-10-16');
  });

  it('une note renvoyée par la file hors ligne n’est pas retranscrite', async () => {
    const { service, transcription } = creer({ id: 'n1', projet: { id: 'p1' } });
    await service.create('p1', { id: 'n1', audio: AUDIO, mimeType: 'audio/webm' }, auteur);
    expect(transcription.transcrire).not.toHaveBeenCalled();
  });

  it('refuse de réutiliser l’identifiant d’une note d’un autre chantier', async () => {
    const { service } = creer({ id: 'n1', projet: { id: 'p2' } });
    await expect(service.create('p1', { id: 'n1', audio: AUDIO, mimeType: 'audio/webm' }, auteur)).rejects.toThrow(ConflictException);
  });

  it('seul l’auteur ou le chef de projet supprime une note', async () => {
    const { service } = creer({ id: 'n1', auteurId: 'autre' });
    await expect(service.remove('p1', 'n1', auteur)).rejects.toThrow(ForbiddenException);
    await expect(service.remove('p1', 'n1', { ...auteur, role: RoleUtilisateur.CHEF_PROJET })).resolves.toBeUndefined();
  });
});

describe('Analyse des notes par l’IA', () => {
  const fetchOriginal = global.fetch;
  afterEach(() => { global.fetch = fetchOriginal; });
  const reponseIa = (contenu: string, status = 200) => reponse(status, { choices: [{ message: { content: contenu } }] });

  it('ne garde que les champs et valeurs permis dans le compte rendu', () => {
    const cr = normaliserCompteRendu({
      travauxRealises: ['Coffrage poteaux', 'Ferraillage dalle'],
      resteAFaire: '- Coulage dalle',
      meteo: 'canicule',
      nombreOuvriers: '12',
      incidents: [{ type: 'securite', gravite: 'enorme', description: 'Chute d’un manœuvre' }, { type: 'qualite', description: '' }],
      champInvente: 'à ignorer',
    }, '2026-10-16', 3);
    expect(cr).toMatchObject({
      date: '2026-10-16', travauxRealises: '- Coffrage poteaux\n- Ferraillage dalle', resteAFaire: '- Coulage dalle',
      meteo: null, nombreOuvriers: 12, nombreNotes: 3, problemes: '',
      incidents: [{ type: 'securite', gravite: 'moyen', description: 'Chute d’un manœuvre' }],
    });
    expect(cr).not.toHaveProperty('champInvente');
  });

  it('nombre d’ouvriers non dit : vide, pas zéro', () => {
    expect(normaliserCompteRendu({ nombreOuvriers: null }, '2026-10-16', 1).nombreOuvriers).toBeNull();
    expect(normaliserCompteRendu({ nombreOuvriers: '' }, '2026-10-16', 1).nombreOuvriers).toBeNull();
    expect(normaliserCompteRendu({ nombreOuvriers: 0 }, '2026-10-16', 1).nombreOuvriers).toBe(0);
  });

  it('un problème sans description n’est pas signalé', () => {
    expect(normaliserProbleme({ probleme: true, resume: '' }).probleme).toBe(false);
    expect(normaliserProbleme({ probleme: true, gravite: 'danger', resume: 'Panne de bétonnière' }))
      .toEqual({ probleme: true, gravite: GraviteAlerte.DANGER, resume: 'Panne de bétonnière' });
  });

  it('lit le JSON même entouré de texte', () => {
    expect(extraireJson('<think>…</think>Voici : {"probleme": false} merci')).toEqual({ probleme: false });
  });

  it('détecte un problème avec le modèle de secours si le premier est saturé', async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(reponse(429, { error: 'rate limit' }))
      .mockResolvedValueOnce(reponseIa('{"probleme": true, "gravite": "warning", "resume": "Il manque du fer de 10"}'));
    global.fetch = fetchMock;
    const res = await new AnalyseChantierService(config()).detecterProbleme('Il manque du fer de 10 pour la dalle');
    expect(res).toMatchObject({ probleme: true, resume: 'Il manque du fer de 10' });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).model).toBe('openai/gpt-oss-20b');
  });

  it('si l’IA est injoignable, la note est gardée sans alerte', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNRESET'));
    const res = await new AnalyseChantierService(config()).detecterProbleme('Il manque du ciment');
    expect(res.probleme).toBe(false);
  });

  it('le compte rendu échoue proprement (503) si l’IA ne répond pas', async () => {
    global.fetch = jest.fn().mockResolvedValue(reponse(500, { error: 'panne' }));
    await expect(new AnalyseChantierService(config()).preparerCompteRendu(
      [{ texte: 'Dalle coulée', auteurNom: 'Awa Diop', enregistreeLe: new Date() }], '2026-10-16',
    )).rejects.toThrow(ServiceUnavailableException);
  });
});
