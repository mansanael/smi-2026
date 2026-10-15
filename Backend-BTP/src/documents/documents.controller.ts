import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UtilisateurCourant } from '../auth/decorators/utilisateur-courant.decorator';
import { ProjetAccesGuard } from '../acces/projet-acces.guard';
import { ProjetAccesService } from '../acces/projet-acces.service';
import type { UtilisateurAcces } from '../acces/projet-acces.service';

@Controller()
@UseGuards(JwtAuthGuard, ProjetAccesGuard)
export class DocumentsController {
  constructor(
    private readonly service: DocumentsService,
    private readonly acces: ProjetAccesService,
  ) {}

  @Post('projets/:projetId/documents')
  create(@Param('projetId') projetId: string, @Body() dto: any) { return this.service.create(projetId, dto); }

  @Get('projets/:projetId/documents')
  findAll(@Param('projetId') projetId: string) { return this.service.findAll(projetId); }

  @Get('documents/expirations')
  async findExpiring(@UtilisateurCourant() user: UtilisateurAcces) {
    return this.service.findExpiring(await this.acces.projetIdsAutorises(user));
  }
}
