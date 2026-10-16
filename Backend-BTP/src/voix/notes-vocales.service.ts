import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, MoreThanOrEqual, Repository } from 'typeorm';
import { NoteVocale } from './entities/note-vocale.entity';
import { CreateNoteVocaleDto } from './dto/voix.dto';
import { TranscriptionService } from './transcription.service';
import { AnalyseChantierService, CompteRenduPropose } from './analyse-chantier.service';
import { Alerte, TypeAlerte } from '../ai/alerte.entity';
import { Projet } from '../projets/entities/projet.entity';
import { ROLES_GESTION_PROJET } from '../auth/roles';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';

interface Auteur {
  id: string;
  nom: string;
  prenom: string;
  role: RoleUtilisateur;
}

// Au-delà, le compte rendu ne reprend que les dernières notes de la journée
const NOTES_MAX_PAR_COMPTE_RENDU = 40;

@Injectable()
export class NotesVocalesService {
  constructor(
    @InjectRepository(NoteVocale) private readonly noteRepo: Repository<NoteVocale>,
    @InjectRepository(Alerte) private readonly alerteRepo: Repository<Alerte>,
    @InjectRepository(Projet) private readonly projetRepo: Repository<Projet>,
    private readonly transcription: TranscriptionService,
    private readonly analyse: AnalyseChantierService,
  ) {}

  async create(projetId: string, dto: CreateNoteVocaleDto, auteur: Auteur): Promise<NoteVocale> {
    // Note déjà reçue (renvoi de la file hors ligne) : on ne la retranscrit pas
    if (dto.id) {
      const existante = await this.noteRepo.findOne({ where: { id: dto.id }, relations: { projet: true } });
      if (existante) {
        if (existante.projet.id !== projetId) throw new ConflictException('Identifiant de note déjà utilisé.');
        return existante;
      }
    }

    const texte = await this.transcription.transcrire(dto.audio, dto.mimeType);
    const probleme = await this.analyse.detecterProbleme(texte);
    const auteurNom = `${auteur.prenom} ${auteur.nom}`.trim();
    const note = await this.noteRepo.save(
      this.noteRepo.create({
        id: dto.id,
        projet: { id: projetId },
        texte: texte || '(aucune parole reconnue)',
        dureeSecondes: dto.dureeSecondes,
        enregistreeLe: dto.enregistreeLe ? new Date(dto.enregistreeLe) : new Date(),
        auteurId: auteur.id,
        auteurNom,
        probleme: probleme.probleme,
        resumeProbleme: probleme.probleme ? probleme.resume : null,
      }),
    );

    // Le chef de projet et la direction sont prévenus sans attendre le rapport du soir
    if (probleme.probleme) {
      const projet = await this.projetRepo.findOne({ select: { id: true, reference: true }, where: { id: projetId } });
      await this.alerteRepo.save(
        this.alerteRepo.create({
          type: TypeAlerte.PROBLEME_CHANTIER,
          gravite: probleme.gravite,
          projetId,
          projetReference: projet?.reference,
          message: `🗣️ [${projet?.reference ?? 'Chantier'}] ${probleme.resume} (signalé par ${auteurNom})`,
        }),
      );
    }
    return note;
  }

  findAll(projetId: string): Promise<NoteVocale[]> {
    return this.noteRepo.find({ where: { projet: { id: projetId } }, order: { enregistreeLe: 'DESC' } });
  }

  // Notes enregistrées ce jour-là (heure de Dakar = heure UTC)
  findDuJour(projetId: string, date: string): Promise<NoteVocale[]> {
    const debut = new Date(`${date}T00:00:00.000Z`);
    const fin = new Date(debut.getTime() + 24 * 3600 * 1000 - 1);
    return this.noteRepo.find({
      where: { projet: { id: projetId }, enregistreeLe: Between(debut, fin) },
      order: { enregistreeLe: 'ASC' },
    });
  }

  /** Notes qui signalent un problème, sur les projets donnés (null = tous), les derniers jours */
  problemesRecents(projetIds: string[] | null, jours = 7): Promise<NoteVocale[]> {
    if (projetIds?.length === 0) return Promise.resolve([]);
    return this.noteRepo.find({
      where: {
        probleme: true,
        enregistreeLe: MoreThanOrEqual(new Date(Date.now() - jours * 24 * 3600 * 1000)),
        ...(projetIds ? { projet: { id: In(projetIds) } } : {}),
      },
      relations: { projet: true },
      order: { enregistreeLe: 'DESC' },
      take: 20,
    });
  }

  /** Proposition de rapport journalier à partir des notes du jour (rien n'est enregistré) */
  async preparerCompteRendu(projetId: string, date: string): Promise<CompteRenduPropose> {
    const notes = (await this.findDuJour(projetId, date))
      .filter((n) => n.texte !== '(aucune parole reconnue)')
      .slice(-NOTES_MAX_PAR_COMPTE_RENDU);
    if (notes.length === 0) {
      throw new BadRequestException('Aucune note vocale ce jour-là : enregistrez d’abord vos observations.');
    }
    return this.analyse.preparerCompteRendu(notes, date);
  }

  // L'auteur peut supprimer sa note ; la direction et le chef de projet aussi
  async remove(projetId: string, id: string, user: Auteur): Promise<void> {
    const note = await this.noteRepo.findOne({ where: { id, projet: { id: projetId } } });
    if (!note) throw new NotFoundException('Note vocale introuvable.');
    if (note.auteurId !== user.id && !ROLES_GESTION_PROJET.includes(user.role)) {
      throw new ForbiddenException("Seul l'auteur ou le chef de projet peut supprimer cette note.");
    }
    await this.noteRepo.remove(note);
  }
}
