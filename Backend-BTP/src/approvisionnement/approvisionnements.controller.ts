import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApprovisionnementsService } from './approvisionnements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';
import { ProjetAccesGuard } from '../acces/projet-acces.guard';
import { ROLES_INTERNES } from '../auth/roles';

const ROLES_GESTION_APPRO = [
  RoleUtilisateur.DIRECTEUR_GENERAL,
  RoleUtilisateur.DIRECTEUR_TECHNIQUE,
  RoleUtilisateur.RESPONSABLE_ADMIN_FIN,
  RoleUtilisateur.MAGASINIER,
];

// Lecture : personnel interne ; écriture : précisée par route
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, ProjetAccesGuard)
@Roles(...ROLES_INTERNES)
export class ApprovisionnementsController {
  constructor(private readonly service: ApprovisionnementsService) { }

  @Post('fournisseurs')
  @Roles(...ROLES_GESTION_APPRO)
  createFournisseur(@Body() dto: any) { return this.service.createFournisseur(dto); }

  @Get('fournisseurs') findFournisseurs() { return this.service.findAllFournisseurs(); }

  @Post('projets/:projetId/bons-commande')
  @Roles(...ROLES_GESTION_APPRO)
  createBC(@Param('projetId') id: string, @Body() dto: any) { return this.service.createBonCommande(id, dto); }

  @Get('projets/:projetId/bons-commande') getBCs(@Param('projetId') id: string) { return this.service.getBonsCommande(id); }

  @Post('projets/:projetId/stock')
  @Roles(...ROLES_GESTION_APPRO)
  createMouvement(@Param('projetId') id: string, @Body() dto: any) { return this.service.createMouvement(id, dto); }

  @Get('projets/:projetId/stock') getStock(@Param('projetId') id: string) { return this.service.getStockChantier(id); }
  @Get('projets/:projetId/stock/mouvements') getMouvements(@Param('projetId') id: string) { return this.service.getMouvements(id); }
}