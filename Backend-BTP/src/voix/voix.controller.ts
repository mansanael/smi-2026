import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UtilisateurCourant } from '../auth/decorators/utilisateur-courant.decorator';
import { ProjetAccesGuard } from '../acces/projet-acces.guard';
import { ROLES_INTERNES } from '../auth/roles';
import { AudioDto, CompteRenduDto, CreateNoteVocaleDto } from './dto/voix.dto';
import { TranscriptionService } from './transcription.service';
import { NotesVocalesService } from './notes-vocales.service';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';

type UtilisateurConnecte = { id: string; nom: string; prenom: string; role: RoleUtilisateur };

// Dictée simple : renvoie le texte sans rien enregistrer. Ouverte à tous les
// utilisateurs connectés, client compris (il peut dicter une question à l'assistant).
@Controller('voix')
@UseGuards(JwtAuthGuard)
export class TranscriptionController {
  constructor(private readonly transcription: TranscriptionService) {}

  @Post('transcription')
  @HttpCode(HttpStatus.OK)
  async transcrire(@Body() dto: AudioDto) {
    return { texte: await this.transcription.transcrire(dto.audio, dto.mimeType) };
  }
}

// Notes vocales d'un chantier : personnel interne, membre du projet
@Controller('projets/:projetId/notes-vocales')
@UseGuards(JwtAuthGuard, RolesGuard, ProjetAccesGuard)
@Roles(...ROLES_INTERNES)
export class NotesVocalesController {
  constructor(private readonly notes: NotesVocalesService) {}

  @Post()
  createNote(
    @Param('projetId') projetId: string,
    @Body() dto: CreateNoteVocaleDto,
    @UtilisateurCourant() user: UtilisateurConnecte,
  ) {
    return this.notes.create(projetId, dto, user);
  }

  @Get()
  getNotes(@Param('projetId') projetId: string) {
    return this.notes.findAll(projetId);
  }

  // Prépare le rapport journalier à partir des notes du jour ; l'utilisateur le valide ensuite
  @Post('compte-rendu')
  @HttpCode(HttpStatus.OK)
  preparerCompteRendu(@Param('projetId') projetId: string, @Body() dto: CompteRenduDto) {
    return this.notes.preparerCompteRendu(projetId, dto.date);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeNote(
    @Param('projetId') projetId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @UtilisateurCourant() user: UtilisateurConnecte,
  ) {
    return this.notes.remove(projetId, id, user);
  }
}
