import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UtilisateurCourant } from '../auth/decorators/utilisateur-courant.decorator';
import { ProjetAccesGuard } from '../acces/projet-acces.guard';
import { ProjetAccesService } from '../acces/projet-acces.service';
import type { UtilisateurAcces } from '../acces/projet-acces.service';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';

class VisibiliteClientDto {
  @IsBoolean() visibleClient: boolean;
}

const estClient = (user: UtilisateurAcces) => user.role === RoleUtilisateur.MAITRE_OUVRAGE_EXTERNE;

@Controller()
@UseGuards(JwtAuthGuard, ProjetAccesGuard)
export class DocumentsController {
  constructor(
    private readonly service: DocumentsService,
    private readonly acces: ProjetAccesService,
  ) {}

  @Post('projets/:projetId/documents')
  create(@Param('projetId') projetId: string, @Body() dto: any) { return this.service.create(projetId, dto); }

  // Le client ne reçoit que les documents partagés avec lui
  @Get('projets/:projetId/documents')
  findAll(@Param('projetId') projetId: string, @UtilisateurCourant() user: UtilisateurAcces) {
    return this.service.findAll(projetId, estClient(user));
  }

  // Partager ou retirer un document au client (écriture : le client est déjà refusé par ProjetAccesGuard)
  @Patch('projets/:projetId/documents/:id/visibilite')
  setVisibilite(
    @Param('projetId') projetId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VisibiliteClientDto,
  ) {
    return this.service.setVisibiliteClient(projetId, id, dto.visibleClient);
  }

  // Attestations et cautions qui expirent : suivi interne à l'entreprise
  @Get('documents/expirations')
  async findExpiring(@UtilisateurCourant() user: UtilisateurAcces) {
    if (estClient(user)) return [];
    return this.service.findExpiring(await this.acces.projetIdsAutorises(user));
  }
}
