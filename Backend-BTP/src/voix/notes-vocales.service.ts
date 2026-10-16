import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NoteVocale } from './entities/note-vocale.entity';
import { CreateNoteVocaleDto } from './dto/voix.dto';
import { TranscriptionService } from './transcription.service';
import { ROLES_GESTION_PROJET } from '../auth/roles';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';

interface Auteur {
  id: string;
  nom: string;
  prenom: string;
  role: RoleUtilisateur;
}

@Injectable()
export class NotesVocalesService {
  constructor(
    @InjectRepository(NoteVocale) private readonly noteRepo: Repository<NoteVocale>,
    private readonly transcription: TranscriptionService,
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
    return this.noteRepo.save(
      this.noteRepo.create({
        id: dto.id,
        projet: { id: projetId },
        texte: texte || '(aucune parole reconnue)',
        dureeSecondes: dto.dureeSecondes,
        enregistreeLe: dto.enregistreeLe ? new Date(dto.enregistreeLe) : new Date(),
        auteurId: auteur.id,
        auteurNom: `${auteur.prenom} ${auteur.nom}`.trim(),
      }),
    );
  }

  findAll(projetId: string): Promise<NoteVocale[]> {
    return this.noteRepo.find({ where: { projet: { id: projetId } }, order: { enregistreeLe: 'DESC' } });
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
