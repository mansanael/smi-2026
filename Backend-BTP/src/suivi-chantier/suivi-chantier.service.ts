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
  ) {}

  createJournal(projetId: string, dto: Partial<JournalChantier>) {
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

  createIncident(projetId: string, dto: Partial<Incident>) {
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

  createPhoto(projetId: string, dto: Partial<PhotoChantier>) {
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
