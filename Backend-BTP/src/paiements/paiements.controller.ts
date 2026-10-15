import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { PaiementsService } from './paiements.service';
import { CreateEcheanceDto, CreatePaiementDto, UpdateEcheanceDto } from './dto/paiements.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UtilisateurCourant } from '../auth/decorators/utilisateur-courant.decorator';
import { ProjetAccesGuard } from '../acces/projet-acces.guard';
import { ROLES_LECTURE_PAIEMENTS, ROLES_SAISIE_PAIEMENTS } from '../auth/roles';

// Lecture : direction, finance, chef de projet et client ; saisie : DG et resp. admin & finance
@Controller('projets/:projetId/paiements')
@UseGuards(JwtAuthGuard, RolesGuard, ProjetAccesGuard)
@Roles(...ROLES_LECTURE_PAIEMENTS)
export class PaiementsController {
  constructor(private readonly service: PaiementsService) {}

  // Échéancier, versements, total reçu, reste à payer, retards
  @Get()
  getSuivi(@Param('projetId') projetId: string) {
    return this.service.getSuivi(projetId);
  }

  // ─── Versements ───────────────────────────────────────────────────────────
  @Post('versements')
  @Roles(...ROLES_SAISIE_PAIEMENTS)
  addPaiement(
    @Param('projetId') projetId: string,
    @Body() dto: CreatePaiementDto,
    @UtilisateurCourant() user: { nom: string; prenom: string },
  ) {
    return this.service.addPaiement(projetId, dto, `${user.prenom} ${user.nom}`.trim());
  }

  @Delete('versements/:id')
  @Roles(...ROLES_SAISIE_PAIEMENTS)
  @HttpCode(HttpStatus.NO_CONTENT)
  removePaiement(@Param('projetId') projetId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.removePaiement(projetId, id);
  }

  // ─── Échéancier ───────────────────────────────────────────────────────────
  @Post('echeances')
  @Roles(...ROLES_SAISIE_PAIEMENTS)
  addEcheance(@Param('projetId') projetId: string, @Body() dto: CreateEcheanceDto) {
    return this.service.addEcheance(projetId, dto);
  }

  @Patch('echeances/:id')
  @Roles(...ROLES_SAISIE_PAIEMENTS)
  updateEcheance(
    @Param('projetId') projetId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEcheanceDto,
  ) {
    return this.service.updateEcheance(projetId, id, dto);
  }

  @Delete('echeances/:id')
  @Roles(...ROLES_SAISIE_PAIEMENTS)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeEcheance(@Param('projetId') projetId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeEcheance(projetId, id);
  }

  // Note la date d'une relance faite auprès du client
  @Post('echeances/:id/relance')
  @Roles(...ROLES_SAISIE_PAIEMENTS)
  relancer(@Param('projetId') projetId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.relancer(projetId, id);
  }
}
