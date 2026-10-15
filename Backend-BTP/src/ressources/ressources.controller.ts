import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RessourcesService } from './ressources.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProjetAccesGuard } from '../acces/projet-acces.guard';
import { ROLES_INTERNES } from '../auth/roles';

// Données internes (salaires, CNI…) : jamais visibles par le client
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, ProjetAccesGuard)
@Roles(...ROLES_INTERNES)
export class RessourcesController {
  constructor(private readonly ressourcesService: RessourcesService) {}

  // ─── PERSONNEL (global) ──────────────────────────────────────────────────
  @Post('personnel') createPersonnel(@Body() dto: any) { return this.ressourcesService.createPersonnel(dto); }
  @Get('personnel') findAllPersonnel() { return this.ressourcesService.findAllPersonnel(); }
  @Get('personnel/:id') findPersonnel(@Param('id') id: string) { return this.ressourcesService.findPersonnel(id); }
  @Patch('personnel/:id') updatePersonnel(@Param('id') id: string, @Body() dto: any) { return this.ressourcesService.updatePersonnel(id, dto); }

  // Personnel d'un projet (via pointages)
  @Get('projets/:projetId/personnel')
  getPersonnelProjet(@Param('projetId') projetId: string) {
    return this.ressourcesService.getPersonnelProjet(projetId);
  }

  // ─── POINTAGE ─────────────────────────────────────────────────────────────
  @Post('projets/:projetId/pointages')
  createPointage(@Param('projetId') projetId: string, @Body() dto: any) {
    return this.ressourcesService.createPointage({ ...dto, projetId });
  }

  @Get('projets/:projetId/pointages')
  getPointages(@Param('projetId') projetId: string) {
    return this.ressourcesService.getPointagesProjet(projetId);
  }

  @Get('projets/:projetId/masse-salariale')
  getMasseSalariale(
    @Param('projetId') projetId: string,
    @Query('debut') debut: string,
    @Query('fin') fin: string,
  ) {
    return this.ressourcesService.getMasseSalariale(projetId, debut, fin);
  }

  // ─── ENGINS (global) ──────────────────────────────────────────────────────
  @Post('engins') createEngin(@Body() dto: any) { return this.ressourcesService.createEngin(dto); }
  @Get('engins') findAllEngins() { return this.ressourcesService.findAllEngins(); }

  // Engins affectés à un projet
  @Post('projets/:projetId/engins')
  affecterEngin(@Param('projetId') projetId: string, @Body() dto: any) {
    return this.ressourcesService.affecterEngin({ ...dto, projetId });
  }

  @Get('projets/:projetId/engins')
  getEnginsProjet(@Param('projetId') projetId: string) {
    return this.ressourcesService.getEnginsProjet(projetId);
  }

  // ─── SOUS-TRAITANTS (global) ──────────────────────────────────────────────
  @Post('sous-traitants') createSousTraitant(@Body() dto: any) { return this.ressourcesService.createSousTraitant(dto); }
  @Get('sous-traitants') findAllSousTraitants() { return this.ressourcesService.findAllSousTraitants(); }

  // Sous-traitants affectés à un projet
  @Post('projets/:projetId/sous-traitants')
  affecterSousTraitant(@Param('projetId') projetId: string, @Body() dto: any) {
    return this.ressourcesService.affecterSousTraitant({ ...dto, projetId });
  }

  @Get('projets/:projetId/sous-traitants')
  getSousTraitantsProjet(@Param('projetId') projetId: string) {
    return this.ressourcesService.getSousTraitantsProjet(projetId);
  }
}
