import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';

@Injectable()
export class DocumentsService {
  constructor(@InjectRepository(Document) private documentRepo: Repository<Document>) {}

  create(projetId: string, dto: Partial<Document>) {
    return this.documentRepo.save(this.documentRepo.create({ ...dto, projet: { id: projetId } as any }));
  }
  findAll(projetId: string) {
    return this.documentRepo.find({ where: { projet: { id: projetId } }, order: { creeLe: 'DESC' } });
  }
  // projetIds : projets accessibles à l'utilisateur, null = tous les projets
  async findExpiring(projetIds: string[] | null = null) {
    if (projetIds !== null && projetIds.length === 0) return [];
    const inThirtyDays = new Date();
    inThirtyDays.setDate(inThirtyDays.getDate() + 30);
    const query = this.documentRepo
      .createQueryBuilder('d')
      .where('d.dateExpiration IS NOT NULL')
      .andWhere('d.dateExpiration <= :date', { date: inThirtyDays });
    if (projetIds !== null) query.andWhere('d.projet_id IN (:...projetIds)', { projetIds });
    return query.orderBy('d.dateExpiration', 'ASC').getMany();
  }
}
