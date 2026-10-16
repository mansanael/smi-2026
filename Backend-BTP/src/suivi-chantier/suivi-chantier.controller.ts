import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SuiviChantierService } from './suivi-chantier.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjetAccesGuard } from '../acces/projet-acces.guard';
import { UtilisateurCourant } from '../auth/decorators/utilisateur-courant.decorator';

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
  @Get('journaux')
  getJournaux(@Param('projetId') id: string) {
    return this.service.getJournaux(id);
  }

  @Post('incidents')
  createIncident(@Param('projetId') id: string, @Body() dto: any) {
    return this.service.createIncident(id, dto);
  }
  @Get('incidents')
  getIncidents(@Param('projetId') id: string) {
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
