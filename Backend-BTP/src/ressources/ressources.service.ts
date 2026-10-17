import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Personnel, SMIG_JOURNALIER_2026 } from './entities/personnel.entity';
import { Pointage, StatutPresence } from './entities/pointage.entity';
import { Engin, StatutEngin } from './entities/engin.entity';
import { conflitPointage, decrirePeriode, periodesSeChevauchent } from './conflits';
import { SousTraitant } from './entities/sous-traitant.entity';
import { AffectationEngin } from './entities/affectation-engin.entity';
import { AffectationSousTraitant } from './entities/affectation-sous-traitant.entity';

@Injectable()
export class RessourcesService {
  constructor(
    @InjectRepository(Personnel) private personnelRepo: Repository<Personnel>,
    @InjectRepository(Pointage) private pointageRepo: Repository<Pointage>,
    @InjectRepository(Engin) private enginRepo: Repository<Engin>,
    @InjectRepository(SousTraitant) private sousTraitantRepo: Repository<SousTraitant>,
    @InjectRepository(AffectationEngin) private affEnginRepo: Repository<AffectationEngin>,
    @InjectRepository(AffectationSousTraitant) private affSTRepo: Repository<AffectationSousTraitant>,
  ) { }

  // ─── PERSONNEL ────────────────────────────────────────────────────────────
  createPersonnel(dto: Partial<Personnel>) { return this.personnelRepo.save(this.personnelRepo.create(dto)); }
  findAllPersonnel() { return this.personnelRepo.find({ where: { actif: true } }); }
  async findPersonnel(id: string) {
    const p = await this.personnelRepo.findOneBy({ id });
    if (!p) throw new NotFoundException(`Personnel "${id}" introuvable.`);
    return p;
  }
  async updatePersonnel(id: string, dto: Partial<Personnel>) {
    await this.findPersonnel(id);
    await this.personnelRepo.update(id, dto);
    return this.personnelRepo.findOneBy({ id });
  }

  // Personnel affecté à un projet (déduit des pointages)
  async getPersonnelProjet(projetId: string): Promise<Personnel[]> {
    const pointages = await this.pointageRepo.find({
      where: { projet: { id: projetId } },
      relations: { personnel: true },
    });
    // Dédoublonner par personnel ID
    const map = new Map<string, Personnel>();
    for (const pt of pointages) {
      if (pt.personnel && !map.has(pt.personnel.id)) {
        map.set(pt.personnel.id, pt.personnel);
      }
    }
    return Array.from(map.values());
  }

  // ─── POINTAGE ─────────────────────────────────────────────────────────────
  // forcer : l'utilisateur a vu le conflit et confirme (ex. ouvrier réellement passé sur deux chantiers)
  async createPointage(dto: Partial<Pointage> & { personnelId: string; projetId: string; forcer?: boolean }): Promise<Pointage> {
    if (dto.id) {
      const existant = await this.pointageRepo.findOne({ where: { id: dto.id } });
      if (existant) return existant;
    }
    const personnel = await this.findPersonnel(dto.personnelId);

    if (!dto.forcer && dto.date) {
      const memeJour = await this.pointageRepo.find({
        where: { personnel: { id: dto.personnelId }, date: String(dto.date).slice(0, 10) as any },
        relations: { projet: true },
      });
      const conflit = conflitPointage(
        { statut: dto.statut, projetId: dto.projetId },
        memeJour.map((p) => ({ statut: p.statut, projetId: p.projet.id, projetReference: p.projet.reference })),
      );
      if (conflit) {
        throw new ConflictException({
          statusCode: 409,
          conflit: true,
          message: `Conflit d'affectation : ${personnel.prenom} ${personnel.nom}, le ${new Date(String(dto.date).slice(0, 10)).toLocaleDateString('fr-FR', { timeZone: 'UTC' })} — ${conflit}.`,
        });
      }
    }
    const { forcer: _forcer, ...donnees } = dto;
    dto = donnees;
    // Calcul automatique du montant journalier (SMIG si pas de taux spécifique)
    const tauxJour = Number(personnel.tauxJournalier) || SMIG_JOURNALIER_2026;
    let montantJournalier = dto.statut === StatutPresence.DEMI_JOURNEE ? tauxJour / 2 : tauxJour;
    if (dto.statut === StatutPresence.ABSENT || dto.statut === StatutPresence.CONGE) montantJournalier = 0;
    // Heures sup +25%
    const hSup = Number(dto.heuresSupplementaires || 0);
    montantJournalier += hSup * (tauxJour / 8) * 1.25;

    // Extraire les IDs pour éviter de les passer comme colonnes brutes
    const { personnelId, projetId, ...rest } = dto;
    const pointage = this.pointageRepo.create({
      ...rest,
      personnel: { id: personnelId } as any,
      projet: { id: projetId } as any,
      montantJournalier: Math.round(montantJournalier),
    });
    return this.pointageRepo.save(pointage);
  }

  getPointagesProjet(projetId: string) {
    return this.pointageRepo.find({ where: { projet: { id: projetId } }, relations: { personnel: true }, order: { date: 'DESC' } });
  }

  // Calcul feuille de paie hebdomadaire/mensuelle
  async getMasseSalariale(projetId: string, debut: string, fin: string) {
    const pointages = await this.pointageRepo.find({ where: { projet: { id: projetId } }, relations: { personnel: true } });
    const total = pointages.reduce((s, p) => s + Number(p.montantJournalier || 0), 0);
    return { projetId, debut, fin, totalFCFA: total, nombrePointages: pointages.length };
  }

  // ─── ENGINS ───────────────────────────────────────────────────────────────
  createEngin(dto: Partial<Engin>) { return this.enginRepo.save(this.enginRepo.create(dto)); }
  findAllEngins() { return this.enginRepo.find(); }

  // Affectation engins ↔ projet
  // Un engin ne peut pas être sur deux chantiers à la fois, ni partir s'il est en panne ou en maintenance
  async verifierDisponibiliteEngin(enginId: string, dateDebut: string, dateFin?: string | null): Promise<string[]> {
    const engin = await this.enginRepo.findOne({ where: { id: enginId } });
    if (!engin) throw new NotFoundException('Engin introuvable');
    const conflits: string[] = [];
    if (engin.statut === StatutEngin.EN_MAINTENANCE || engin.statut === StatutEngin.HORS_SERVICE) {
      conflits.push(`${engin.designation} est ${engin.statut === StatutEngin.EN_MAINTENANCE ? 'en maintenance' : 'hors service'}`);
    }
    const affectations = await this.affEnginRepo.find({ where: { engin: { id: enginId } }, relations: { projet: true } });
    for (const a of affectations.filter((x) => periodesSeChevauchent(x, { dateDebut, dateFin }))) {
      conflits.push(`${engin.designation} est déjà affecté à ${a.projet?.reference ?? 'un autre chantier'} ${decrirePeriode(a.dateDebut, a.dateFin)}`);
    }
    return conflits;
  }

  /** Engins affectés à deux chantiers en même temps, aujourd'hui ou plus tard (pour l'analyse du matin) */
  async conflitsEnginsEnCours(aujourdhui = new Date().toISOString().slice(0, 10)) {
    const affectations = (await this.affEnginRepo.find({ relations: { projet: true } }))
      .filter((a) => !a.dateFin || String(a.dateFin).slice(0, 10) >= aujourdhui);
    const conflits: { engin: string; projets: { id: string; reference: string }[] }[] = [];
    for (let i = 0; i < affectations.length; i++) {
      for (let j = i + 1; j < affectations.length; j++) {
        const [a, b] = [affectations[i], affectations[j]];
        if (a.engin?.id === b.engin?.id && a.projet?.id !== b.projet?.id && periodesSeChevauchent(a, b)) {
          conflits.push({ engin: a.engin.designation, projets: [a.projet, b.projet].map((p) => ({ id: p.id, reference: p.reference })) });
        }
      }
    }
    return conflits;
  }

  async affecterEngin(dto: { enginId: string; projetId: string; dateDebut: string; dateFin?: string; observations?: string; forcer?: boolean }) {
    if (!dto.forcer) {
      const conflits = await this.verifierDisponibiliteEngin(dto.enginId, dto.dateDebut, dto.dateFin);
      if (conflits.length) {
        throw new ConflictException({ statusCode: 409, conflit: true, message: `Conflit d'affectation : ${conflits.join(' ; ')}.` });
      }
    }
    const aff = this.affEnginRepo.create({
      engin: { id: dto.enginId } as any,
      projet: { id: dto.projetId } as any,
      dateDebut: dto.dateDebut as any,
      dateFin: dto.dateFin as any,
      observations: dto.observations,
    });
    return this.affEnginRepo.save(aff);
  }

  getEnginsProjet(projetId: string) {
    return this.affEnginRepo.find({
      where: { projet: { id: projetId } },
      order: { dateDebut: 'DESC' },
    });
  }

  // ─── SOUS-TRAITANTS ───────────────────────────────────────────────────────
  createSousTraitant(dto: Partial<SousTraitant>) { return this.sousTraitantRepo.save(this.sousTraitantRepo.create(dto)); }
  findAllSousTraitants() { return this.sousTraitantRepo.find({ where: { actif: true } }); }

  // Affectation sous-traitants ↔ projet
  async affecterSousTraitant(dto: { sousTraitantId: string; projetId: string; dateDebut: string; dateFin?: string; montantContrat?: number; observations?: string }) {
    const aff = this.affSTRepo.create({
      sousTraitant: { id: dto.sousTraitantId } as any,
      projet: { id: dto.projetId } as any,
      dateDebut: dto.dateDebut as any,
      dateFin: dto.dateFin as any,
      montantContrat: dto.montantContrat,
      observations: dto.observations,
    });
    return this.affSTRepo.save(aff);
  }

  getSousTraitantsProjet(projetId: string) {
    return this.affSTRepo.find({
      where: { projet: { id: projetId } },
      order: { dateDebut: 'DESC' },
    });
  }
}
