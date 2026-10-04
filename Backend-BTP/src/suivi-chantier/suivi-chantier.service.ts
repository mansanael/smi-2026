import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalChantier } from './entities/journal-chantier.entity';
import { Incident } from './entities/incident.entity';
import { PhotoChantier, CategoriePhoto } from './entities/photo-chantier.entity';

@Injectable()
export class SuiviChantierService {
  constructor(
    @InjectRepository(JournalChantier)
    private journalRepo: Repository<JournalChantier>,
    @InjectRepository(Incident)
    private incidentRepo: Repository<Incident>,
    @InjectRepository(PhotoChantier)
    private photoRepo: Repository<PhotoChantier>,
  ) { }

  async createJournal(projetId: string, dto: Partial<JournalChantier>) {
    if (dto.id) {
      const existant = await this.journalRepo.findOne({ where: { id: dto.id } });
      if (existant) return existant; // déjà synchronisé : on ne recrée pas
    }
    return this.journalRepo.save(
      this.journalRepo.create({ ...dto, projet: { id: projetId } as any }),
    );
  }
  getJournaux(projetId: string) {
    return this.journalRepo.find({
      where: { projet: { id: projetId } },
      order: { date: 'DESC' },
    });
  }

  async createIncident(projetId: string, dto: Partial<Incident>) {
    if (dto.id) {
      const existant = await this.incidentRepo.findOne({ where: { id: dto.id } });
      if (existant) return existant;
    }
    return this.incidentRepo.save(
      this.incidentRepo.create({ ...dto, projet: { id: projetId } as any }),
    );
  }
  getIncidents(projetId: string) {
    return this.incidentRepo.find({
      where: { projet: { id: projetId } },
      order: { date: 'DESC' },
    });
  }

  async createPhoto(projetId: string, dto: Partial<PhotoChantier>) {
    if (dto.id) {
      const existant = await this.photoRepo.findOne({ where: { id: dto.id } });
      if (existant) return existant;
    }
    return this.photoRepo.save(
      this.photoRepo.create({ ...dto, projet: { id: projetId } as any }),
    );
  }

  getPhotos(projetId: string, categorie?: CategoriePhoto) {
    const where: any = { projet: { id: projetId } };
    if (categorie) {
      where.categorie = categorie;
    }
    return this.photoRepo.find({
      where,
      order: { datePrise: 'DESC', creeLe: 'DESC' },
    });
  }

  async deletePhoto(id: string) {
    const photo = await this.photoRepo.findOne({ where: { id } });
    if (!photo) {
      throw new NotFoundException('Photo non trouvée');
    }
    await this.photoRepo.remove(photo);
    return { success: true };
  }
}