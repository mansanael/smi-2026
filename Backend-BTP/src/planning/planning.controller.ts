import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { PlanningService } from './planning.service';
import { CreateTacheDto } from './dto/create-tache.dto';
import { CreateJalonDto } from './dto/create-jalon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UtilisateurCourant } from '../auth/decorators/utilisateur-courant.decorator';
import { ProjetAccesGuard } from '../acces/projet-acces.guard';
import { ProjetAccesService } from '../acces/projet-acces.service';
import type { UtilisateurAcces } from '../acces/projet-acces.service';

@Controller()
@UseGuards(JwtAuthGuard, ProjetAccesGuard)
export class PlanningController {
  constructor(
    private readonly planningService: PlanningService,
    private readonly acces: ProjetAccesService,
  ) {}

  // ─── TÂCHES ────────────────────────────────────────────────────────────
  @Post('projets/:projetId/taches')
  createTache(@Param('projetId') projetId: string, @Body() dto: CreateTacheDto) {
    return this.planningService.createTache(projetId, dto);
  }

  @Get('projets/:projetId/taches')
  getTaches(@Param('projetId') projetId: string) {
    return this.planningService.findTachesProjet(projetId);
  }

  // Les routes par id de tâche/jalon ne contiennent pas le projet : on le retrouve pour vérifier l'accès
  @Patch('taches/:id')
  async updateTache(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateTacheDto>,
    @UtilisateurCourant() user: UtilisateurAcces,
  ) {
    await this.acces.verifier(user, await this.planningService.findProjetIdTache(id));
    return this.planningService.updateTache(id, dto);
  }

  @Delete('taches/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTache(@Param('id', ParseUUIDPipe) id: string, @UtilisateurCourant() user: UtilisateurAcces) {
    await this.acces.verifier(user, await this.planningService.findProjetIdTache(id));
    return this.planningService.removeTache(id);
  }

  // ─── JALONS ────────────────────────────────────────────────────────────
  @Post('projets/:projetId/jalons')
  createJalon(@Param('projetId') projetId: string, @Body() dto: CreateJalonDto) {
    return this.planningService.createJalon(projetId, dto);
  }

  @Get('projets/:projetId/jalons')
  getJalons(@Param('projetId') projetId: string) {
    return this.planningService.findJalonsProjet(projetId);
  }

  @Patch('jalons/:id')
  async updateJalon(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateJalonDto>,
    @UtilisateurCourant() user: UtilisateurAcces,
  ) {
    await this.acces.verifier(user, await this.planningService.findProjetIdJalon(id));
    return this.planningService.updateJalon(id, dto);
  }

  @Delete('jalons/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeJalon(@Param('id', ParseUUIDPipe) id: string, @UtilisateurCourant() user: UtilisateurAcces) {
    await this.acces.verifier(user, await this.planningService.findProjetIdJalon(id));
    return this.planningService.removeJalon(id);
  }
}
