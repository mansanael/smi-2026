import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParametreEntreprise } from './parametre-entreprise.entity';

/**
 * Instant de publication au client du rapport d'un jour donné.
 * Dakar est à l'heure UTC toute l'année : « 2026-10-16 » à « 18:00 » = 2026-10-16T18:00:00Z.
 */
export function instantPublication(date: string | Date, heure: string): Date {
  const jour = typeof date === 'string' ? date.slice(0, 10) : date.toISOString().slice(0, 10);
  return new Date(`${jour}T${heure}:00.000Z`);
}

/** Le client voit le rapport une fois l'heure passée ; validé plus tard, il le voit dès la validation. */
export const estPublieAuClient = (date: string | Date, heure: string, maintenant = new Date()): boolean =>
  instantPublication(date, heure) <= maintenant;

@Injectable()
export class ParametresService {
  constructor(@InjectRepository(ParametreEntreprise) private readonly repo: Repository<ParametreEntreprise>) {}

  async get(): Promise<ParametreEntreprise> {
    return (await this.repo.findOne({ where: { id: 1 } })) ?? this.repo.save(this.repo.create({ id: 1 }));
  }

  /** Réserve l'analyse des alertes du jour : true pour le premier appel de la journée, false ensuite */
  async reserverAnalyseDuJour(jour = new Date().toISOString().slice(0, 10)): Promise<boolean> {
    await this.get(); // la ligne doit exister
    const resultat = await this.repo
      .createQueryBuilder()
      .update(ParametreEntreprise)
      .set({ derniereAnalyseAlertes: jour })
      .where('id = 1')
      .andWhere('("derniereAnalyseAlertes" IS NULL OR "derniereAnalyseAlertes" <> :jour)', { jour })
      .execute();
    return (resultat.affected ?? 0) > 0;
  }

  async update(
    changes: Partial<Pick<ParametreEntreprise, 'heurePublicationClient' | 'tauxImprevus' | 'tauxPartEntreprise' | 'tauxTva'>>,
  ): Promise<ParametreEntreprise> {
    const parametres = await this.get();
    return this.repo.save({ ...parametres, ...changes });
  }
}
