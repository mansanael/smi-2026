import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalChantier } from './entities/journal-chantier.entity';
import { Incident } from './entities/incident.entity';
import { PhotoChantier, CategoriePhoto } from './entities/photo-chantier.entity';
import { AnalyseChantierService } from '../voix/analyse-chantier.service';
import { ParametresService, instantPublication } from '../parametres/parametres.service';

@Injectable()
export class SuiviChantierService {
  constructor(
    @InjectRepository(JournalChantier)
    private journalRepo: Repository<JournalChantier>,
    @InjectRepository(Incident)
    private incidentRepo: Repository<Incident>,
    @InjectRepository(PhotoChantier)
    private photoRepo: Repository<PhotoChantier>,
    private readonly analyse: AnalyseChantierService,
    private readonly parametres: ParametresService,
  ) { }

  async createJournal(projetId: string, dto: Partial<JournalChantier>) {
    if (dto.id) {
      const existant = await this.journalRepo.findOne({ where: { id: dto.id } });
      if (existant) return existant; // déjà synchronisé : on ne recrée pas
    }
    const { resumeClient: _r, resumeClientModifie: _m, ...donnees } = dto;
    const journal = await this.journalRepo.save(
      this.journalRepo.create({ ...donnees, projet: { id: projetId } as any }),
    );
    // Le rapport est validé : l'IA prépare tout de suite le message du client (publié à l'heure choisie)
    journal.resumeClient = await this.analyse.resumerPourClient({ ...journal, date: String(journal.date).slice(0, 10) });
    return this.journalRepo.save(journal);
  }

  /** pourClient : seulement les rapports déjà publiés (heure de publication de l'entreprise passée) */
  async getJournaux(projetId: string, pourClient = false) {
    const [journaux, { heurePublicationClient }] = await Promise.all([
      this.journalRepo.find({ where: { projet: { id: projetId } }, order: { date: 'DESC' } }),
      this.parametres.get(),
    ]);
    const maintenant = new Date();
    return journaux
      .map((j) => ({ ...j, publieLe: instantPublication(j.date, heurePublicationClient) }))
      .filter((j) => !pourClient || j.publieLe <= maintenant);
  }

  private async journalDuProjet(projetId: string, id: string) {
    const journal = await this.journalRepo.findOne({ where: { id, projet: { id: projetId } } });
    if (!journal) throw new NotFoundException('Rapport introuvable');
    return journal;
  }

  // Correction à la main du message du client : l'IA ne le réécrira plus
  async setResumeClient(projetId: string, id: string, resumeClient: string) {
    const journal = await this.journalDuProjet(projetId, id);
    journal.resumeClient = resumeClient.trim() || null;
    journal.resumeClientModifie = Boolean(journal.resumeClient);
    return this.journalRepo.save(journal);
  }

  async regenererResumeClient(projetId: string, id: string) {
    const journal = await this.journalDuProjet(projetId, id);
    journal.resumeClient = await this.analyse.resumerPourClient({ ...journal, date: String(journal.date).slice(0, 10) });
    journal.resumeClientModifie = false;
    return this.journalRepo.save(journal);
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

  async deletePhoto(projetId: string, id: string) {
    // La photo doit appartenir au projet de la route (dont l'accès a été vérifié)
    const photo = await this.photoRepo.findOne({ where: { id, projet: { id: projetId } } });
    if (!photo) {
      throw new NotFoundException('Photo non trouvée');
    }
    await this.photoRepo.remove(photo);
    return { success: true };
  }
}