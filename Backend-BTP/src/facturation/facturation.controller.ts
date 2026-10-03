import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { FacturationService } from './facturation.service';
import { ProjetsService } from '../projets/projets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UtilisateurCourant } from '../auth/decorators/utilisateur-courant.decorator';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';

@Controller('projets/:projetId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FacturationController {
  constructor(
    private readonly facturationService: FacturationService,
    private readonly projetsService: ProjetsService,
  ) { }

  @Post('situations')
  @Roles(RoleUtilisateur.DIRECTEUR_GENERAL, RoleUtilisateur.DIRECTEUR_TECHNIQUE, RoleUtilisateur.RESPONSABLE_ADMIN_FIN)
  async createSituation(@Param('projetId') projetId: string, @Body() dto: any) {
    const projet = await this.projetsService.findOne(projetId);
    return this.facturationService.createSituation(projetId, dto, Number(projet.montantMarche));
  }

  @Get('situations')
  getSituations(@Param('projetId') projetId: string) {
    return this.facturationService.getSituations(projetId);
  }

  @Get('situations/recapitulatif')
  getRecap(@Param('projetId') projetId: string) {
    return this.facturationService.getRecapitulatif(projetId);
  }

  // Modifier une situation (brouillon ou rejetée)
  @Patch('situations/:id')
  @Roles(RoleUtilisateur.DIRECTEUR_GENERAL, RoleUtilisateur.DIRECTEUR_TECHNIQUE, RoleUtilisateur.RESPONSABLE_ADMIN_FIN)
  updateSituation(
    @Param('projetId') projetId: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.facturationService.updateSituation(projetId, id, dto);
  }

  // Changer le statut d'une situation
  @Patch('situations/:id/statut')
  @Roles(RoleUtilisateur.DIRECTEUR_GENERAL, RoleUtilisateur.DIRECTEUR_TECHNIQUE, RoleUtilisateur.RESPONSABLE_ADMIN_FIN)
  updateStatut(
    @Param('projetId') projetId: string,
    @Param('id') id: string,
    @Body('statut') statut: string,
    @UtilisateurCourant() utilisateur: any,
  ) {
    return this.facturationService.updateStatut(projetId, id, statut, utilisateur);
  }
}