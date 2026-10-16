import { BadRequestException, ConflictException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { TranscriptionService } from './transcription.service';
import { NotesVocalesService } from './notes-vocales.service';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';

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

  function creer(existante: object | null = null) {
    const noteRepo = {
      findOne: jest.fn().mockResolvedValue(existante),
      create: jest.fn((n) => n),
      save: jest.fn((n) => Promise.resolve(n)),
      remove: jest.fn(),
    };
    const transcription = { transcrire: jest.fn().mockResolvedValue('Coffrage des poteaux terminé') };
    return { service: new NotesVocalesService(noteRepo as any, transcription as any), noteRepo, transcription };
  }

  it('transcrit et enregistre la note avec son auteur', async () => {
    const { service } = creer();
    const note = await service.create('p1', { audio: AUDIO, mimeType: 'audio/webm', dureeSecondes: 12 }, auteur);
    expect(note).toMatchObject({ texte: 'Coffrage des poteaux terminé', auteurNom: 'Awa Diop', dureeSecondes: 12 });
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
