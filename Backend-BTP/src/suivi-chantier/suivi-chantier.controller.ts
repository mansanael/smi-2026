import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  Patch,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsString, MaxLength } from 'class-validator';
import { SuiviChantierService } from './suivi-chantier.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjetAccesGuard } from '../acces/projet-acces.guard';
import { UtilisateurCourant } from '../auth/decorators/utilisateur-courant.decorator';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';

class ResumeClientDto {
  @IsString() @MaxLength(3000) resumeClient: string;
}

@Controller('projets/:projetId')
@UseGuards(JwtAuthGuard, ProjetAccesGuard)
export class SuiviChantierController {
  constructor(private readonly service: SuiviChantierService) {}

  @Post('journaux')
  createJournal(
    @Param('projetId') id: string,
    @Body() dto: any,
    @UtilisateurCourant() user: { nom: string; prenom: string },
  ) {
    // « Rédigé par » : la personne connectée, si le champ n'est pas rempli
    if (!dto?.redige_par?.trim?.()) dto = { ...dto, redige_par: `${user.prenom} ${user.nom}`.trim() };
    return this.service.createJournal(id, dto);
  }
  // Le client ne reçoit le rapport du jour qu'à l'heure de publication choisie par l'entreprise
  @Get('journaux')
  getJournaux(@Param('projetId') id: string, @UtilisateurCourant() user: { role: RoleUtilisateur }) {
    return this.service.getJournaux(id, user.role === RoleUtilisateur.MAITRE_OUVRAGE_EXTERNE);
  }

  // Message du client : l'équipe le corrige avant publication, ou demande à l'IA de le réécrire
  // (écritures : le client est déjà refusé par ProjetAccesGuard)
  @Patch('journaux/:journalId/resume-client')
  setResumeClient(
    @Param('projetId') id: string,
    @Param('journalId', ParseUUIDPipe) journalId: string,
    @Body() dto: ResumeClientDto,
  ) {
    return this.service.setResumeClient(id, journalId, dto.resumeClient);
  }

  @Post('journaux/:journalId/resume-client/regenerer')
  @HttpCode(HttpStatus.OK)
  regenererResumeClient(@Param('projetId') id: string, @Param('journalId', ParseUUIDPipe) journalId: string) {
    return this.service.regenererResumeClient(id, journalId);
  }

  @Post('incidents')
  createIncident(@Param('projetId') id: string, @Body() dto: any) {
    return this.service.createIncident(id, dto);
  }
  // Incidents (accidents, pannes, malfaçons) : internes à l'entreprise, pas pour le client
  @Get('incidents')
  getIncidents(@Param('projetId') id: string, @UtilisateurCourant() user: { role: RoleUtilisateur }) {
    if (user.role === RoleUtilisateur.MAITRE_OUVRAGE_EXTERNE) {
      throw new ForbiddenException('Les incidents sont réservés à l’équipe du chantier.');
    }
    return this.service.getIncidents(id);
  }

  @Post('photos')
  createPhoto(@Param('projetId') id: string, @Body() dto: any) {
    return this.service.createPhoto(id, dto);
  }
  @Get('photos')
  getPhotos(
    @Param('projetId') id: string,
    @Query('categorie') categorie?: any,
  ) {
    return this.service.getPhotos(id, categorie);
  }
  @Delete('photos/:photoId')
  deletePhoto(@Param('projetId') id: string, @Param('photoId') photoId: string) {
    return this.service.deletePhoto(id, photoId);
  }
}
