import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UtilisateurCourant } from '../auth/decorators/utilisateur-courant.decorator';
import { ProjetAccesGuard } from '../acces/projet-acces.guard';
import { ProjetAccesService } from '../acces/projet-acces.service';
import type { UtilisateurAcces } from '../acces/projet-acces.service';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, ProjetAccesGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly acces: ProjetAccesService,
  ) {}

  @Get()
  async getDashboardGlobal(@UtilisateurCourant() user: UtilisateurAcces) {
    return this.dashboardService.getDashboardGlobal(await this.acces.projetIdsAutorises(user));
  }

  @Get('projets/:projetId')
  async getDashboardProjet(@Param('projetId') projetId: string, @UtilisateurCourant() user: UtilisateurAcces) {
    const dashboard = await this.dashboardService.getDashboardProjet(projetId);
    // Le client ne voit pas les coûts internes de l'entreprise
    if (dashboard && user.role === RoleUtilisateur.MAITRE_OUVRAGE_EXTERNE) {
      const { budget: _budget, alertes: _alertes, ...vueClient } = dashboard;
      return { ...vueClient, avancement: { ...dashboard.avancement, financier: undefined } };
    }
    return dashboard;
  }
}
