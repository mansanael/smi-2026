import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Conversation } from './conversation.entity';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly repo: Repository<Conversation>,
  ) {}

  async saveMessage(userId: string, projetId: string | undefined, role: 'user' | 'assistant', content: string): Promise<void> {
    const entity = this.repo.create({ userId, role, content });
    if (projetId) entity.projetId = projetId;
    await this.repo.save(entity);
  }

  async getHistory(userId: string, projetId?: string, limit = 20): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
    const where = projetId
      ? { userId, projetId }
      : { userId, projetId: IsNull() as unknown as string };
    const messages = await this.repo.find({
      where,
      order: { creeLe: 'DESC' },
      take: limit,
    });
    return messages.reverse().map(m => ({ role: m.role, content: m.content }));
  }

  async clearHistory(userId: string, projetId?: string): Promise<void> {
    const where = projetId
      ? { userId, projetId }
      : { userId, projetId: IsNull() as unknown as string };
    await this.repo.delete(where);
  }

  async getRecentSessions(userId: string): Promise<{ projetId: string; lastMessage: Date }[]> {
    const result = await this.repo
      .createQueryBuilder('c')
      .select('c.projetId', 'projetId')
      .addSelect('MAX(c.creeLe)', 'lastMessage')
      .where('c.userId = :userId', { userId })
      .groupBy('c.projetId')
      .orderBy('lastMessage', 'DESC')
      .getRawMany();
    return result;
  }
}
