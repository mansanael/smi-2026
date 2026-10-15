import { Controller, Get, Patch, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { AlertesService } from './alertes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UtilisateurCourant } from '../auth/decorators/utilisateur-courant.decorator';
import { ProjetAccesService } from '../acces/projet-acces.service';
import type { UtilisateurAcces } from '../acces/projet-acces.service';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';

@Controller('ai/alertes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertesController {
  constructor(
    private readonly alertesService: AlertesService,
    private readonly acces: ProjetAccesService,
  ) {}

  // Les alertes sont un outil interne : le client n'en reçoit pas
  private async perimetre(user: UtilisateurAcces): Promise<string[] | null> {
    if (user.role === RoleUtilisateur.MAITRE_OUVRAGE_EXTERNE) return [];
    return this.acces.projetIdsAutorises(user);
  }

  // GET /api/ai/alertes — alertes des projets accessibles (optionnel ?lu=false)
  @Get()
  async getAlertes(@UtilisateurCourant() user: UtilisateurAcces, @Query('lu') lu?: string) {
    const luBool = lu === undefined ? undefined : lu === 'true';
    return this.alertesService.getAlertes(await this.perimetre(user), luBool);
  }

  // GET /api/ai/alertes/count — nombre d'alertes non lues
  @Get('count')
  async getNombreNonLues(@UtilisateurCourant() user: UtilisateurAcces) {
    return { count: await this.alertesService.getNombreNonLues(await this.perimetre(user)) };
  }

  // GET /api/ai/alertes/analyser — déclencher manuellement l'analyse
  @Get('analyser')
  @Roles(RoleUtilisateur.DIRECTEUR_GENERAL, RoleUtilisateur.DIRECTEUR_TECHNIQUE)
  analyserMaintenant() {
    return this.alertesService.analyserMaintenant();
  }

  // PATCH /api/ai/alertes/tout-lu — marquer comme lues les alertes accessibles
  @Patch('tout-lu')
  async marquerToutCommeLu(@UtilisateurCourant() user: UtilisateurAcces) {
    await this.alertesService.marquerToutCommeLu(await this.perimetre(user));
    return { message: 'Toutes les alertes marquées comme lues.' };
  }

  // PATCH /api/ai/alertes/:id/lu — marquer une alerte comme lue
  @Patch(':id/lu')
  async marquerCommeLu(@Param('id') id: string, @UtilisateurCourant() user: UtilisateurAcces) {
    await this.alertesService.marquerCommeLu(id, await this.perimetre(user));
    return { message: 'Alerte marquée comme lue.' };
  }

  // DELETE /api/ai/alertes — effacer toutes les alertes
  @Delete()
  @Roles(RoleUtilisateur.DIRECTEUR_GENERAL, RoleUtilisateur.DIRECTEUR_TECHNIQUE)
  toutEffacer() {
    return this.alertesService.toutEffacer().then(() => ({ message: 'Alertes effacées.' }));
  }
}
