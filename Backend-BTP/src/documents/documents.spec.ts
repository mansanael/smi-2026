import { NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { TypeDocument, estVisibleClient } from './entities/document.entity';

const doc = (id: string, type: TypeDocument, visibleClient: boolean | null = null) => ({ id, nom: id, type, visibleClient });

describe('Documents partagés avec le client', () => {
  it('par défaut : pièces du marché et plans partagés, offres et attestations internes', () => {
    expect(estVisibleClient(doc('a', TypeDocument.PLAN))).toBe(true);
    expect(estVisibleClient(doc('b', TypeDocument.PV_REUNION))).toBe(true);
    expect(estVisibleClient(doc('c', TypeDocument.ATTESTATION_FISCALE))).toBe(false);
    expect(estVisibleClient(doc('d', TypeDocument.CAUTION))).toBe(false);
    expect(estVisibleClient(doc('e', TypeDocument.AUTRE))).toBe(false);
  });

  it('le choix de l’équipe l’emporte sur le type', () => {
    expect(estVisibleClient(doc('a', TypeDocument.PLAN, false))).toBe(false);
    expect(estVisibleClient(doc('b', TypeDocument.AUTRE, true))).toBe(true);
  });

  function creer(documents: object[]) {
    const repo = {
      find: jest.fn().mockResolvedValue(documents),
      findOne: jest.fn().mockResolvedValue(documents[0] ?? null),
      save: jest.fn((d) => Promise.resolve(d)),
    };
    return { service: new DocumentsService(repo as any), repo };
  }

  it('le client ne reçoit que les documents partagés ; l’équipe reçoit tout, avec l’indication', async () => {
    const { service } = creer([doc('plan', TypeDocument.PLAN), doc('caution', TypeDocument.CAUTION), doc('note', TypeDocument.AUTRE, true)]);
    expect((await service.findAll('p1', true)).map((d) => d.id)).toEqual(['plan', 'note']);
    const equipe = await service.findAll('p1');
    expect(equipe.map((d) => [d.id, d.visibleClient])).toEqual([['plan', true], ['caution', false], ['note', true]]);
  });

  it('partager ou retirer un document', async () => {
    const { service, repo } = creer([doc('caution', TypeDocument.CAUTION)]);
    await service.setVisibiliteClient('p1', 'caution', true);
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'caution', visibleClient: true }));
  });

  it('document d’un autre chantier : introuvable', async () => {
    const { service } = creer([]);
    await expect(service.setVisibiliteClient('p1', 'x', true)).rejects.toThrow(NotFoundException);
  });
});
