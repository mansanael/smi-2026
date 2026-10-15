import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateLigneDevisDto } from './dto/create-ligne-devis.dto';
import { CreateDepenseDto } from './dto/create-depense.dto';
import { CreateAvenantDto } from './dto/create-avenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';
import { ProjetsService } from '../projets/projets.service';
import { ProjetAccesGuard } from '../acces/projet-acces.guard';
import { ROLES_BUDGET } from '../auth/roles';

// Lecture : rôles budget (le chef de projet, seulement sur ses projets) ; écriture : précisée par route
@Controller('projets/:projetId')
@UseGuards(JwtAuthGuard, RolesGuard, ProjetAccesGuard)
@Roles(...ROLES_BUDGET)
export class BudgetController {
  constructor(
    private readonly budgetService: BudgetService,
    private readonly projetsService: ProjetsService,
  ) { }

  // ─── DEVIS ──────────────────────────────────────────────────────────────
  @Post('devis')
  @Roles(RoleUtilisateur.DIRECTEUR_GENERAL, RoleUtilisateur.DIRECTEUR_TECHNIQUE, RoleUtilisateur.RESPONSABLE_ADMIN_FIN)
  addLigneDevis(@Param('projetId') projetId: string, @Body() dto: CreateLigneDevisDto) {
    return this.budgetService.addLigneDevis(projetId, dto);
  }

  @Get('devis')
  getDevis(@Param('projetId') projetId: string) {
    return this.budgetService.getDevis(projetId);
  }

  // ─── DÉPENSES ───────────────────────────────────────────────────────────
  @Post('depenses')
  @Roles(RoleUtilisateur.DIRECTEUR_GENERAL, RoleUtilisateur.DIRECTEUR_TECHNIQUE, RoleUtilisateur.RESPONSABLE_ADMIN_FIN)
  addDepense(@Param('projetId') projetId: string, @Body() dto: CreateDepenseDto) {
    return this.budgetService.addDepense(projetId, dto);
  }

  @Get('depenses')
  getDepenses(@Param('projetId') projetId: string) {
    return this.budgetService.getDepenses(projetId);
  }

  // ─── AVENANTS ───────────────────────────────────────────────────────────
  @Post('avenants')
  @Roles(RoleUtilisateur.DIRECTEUR_GENERAL, RoleUtilisateur.DIRECTEUR_TECHNIQUE, RoleUtilisateur.RESPONSABLE_ADMIN_FIN)
  addAvenant(@Param('projetId') projetId: string, @Body() dto: CreateAvenantDto) {
    return this.budgetService.addAvenant(projetId, dto);
  }

  @Get('avenants')
  getAvenants(@Param('projetId') projetId: string) {
    return this.budgetService.getAvenants(projetId);
  }

  // ─── KPIs BUDGÉTAIRES ───────────────────────────────────────────────────
  @Get('budget')
  async getBudget(@Param('projetId') projetId: string) {
    const projet = await this.projetsService.findOne(projetId);
    return this.budgetService.getKpiBudget(projetId, Number(projet.montantMarche));
  }
}