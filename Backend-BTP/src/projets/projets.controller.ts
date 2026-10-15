import { Controller, Get, Post, Patch, Put, Delete, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ProjetsService } from './projets.service';
import { CreateProjetDto } from './dto/create-projet.dto';
import { UpdateProjetDto } from './dto/update-projet.dto';
import { UpdateMembresDto } from './dto/update-membres.dto';
import { RessourcesService } from '../ressources/ressources.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UtilisateurCourant } from '../auth/decorators/utilisateur-courant.decorator';
import { ProjetAccesGuard, ProjetParam } from '../acces/projet-acces.guard';
import type { UtilisateurAcces } from '../acces/projet-acces.service';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';
import { ROLES_GESTION_MEMBRES, ROLES_GESTION_PROJET, ROLES_INTERNES } from '../auth/roles';

@Controller('projets')
@UseGuards(JwtAuthGuard, RolesGuard, ProjetAccesGuard)
@ProjetParam('id')
export class ProjetsController {
    constructor(
        private readonly projetsService: ProjetsService,
        private readonly ressourcesService: RessourcesService,
    ) { }

    @Post()
    @Roles(...ROLES_GESTION_PROJET)
    create(@Body() createProjetDto: CreateProjetDto, @UtilisateurCourant() user: UtilisateurAcces) {
        return this.projetsService.create(createProjetDto, user);
    }

    @Get()
    findAll(@UtilisateurCourant() user: UtilisateurAcces) {
        return this.projetsService.findAll(user);
    }

    // ─── Équipe du projet ───────────────────────────────────────────────────
    @Get(':id/membres')
    @Roles(...ROLES_INTERNES)
    getMembres(@Param('id') id: string) {
        return this.projetsService.getMembres(id);
    }

    @Put(':id/membres')
    @Roles(...ROLES_GESTION_MEMBRES)
    setMembres(@Param('id') id: string, @Body() dto: UpdateMembresDto) {
        return this.projetsService.setMembres(id, dto.utilisateurIds);
    }

    // ─── Ressources du projet ───────────────────────────────────────────────
    @Get(':id/personnel')
    @Roles(...ROLES_INTERNES)
    getPersonnelProjet(@Param('id') id: string) {
        return this.ressourcesService.getPersonnelProjet(id);
    }

    @Get(':id/engins')
    @Roles(...ROLES_INTERNES)
    getEnginsProjet(@Param('id') id: string) {
        return this.ressourcesService.getEnginsProjet(id);
    }

    @Post(':id/engins')
    @Roles(...ROLES_INTERNES)
    affecterEngin(@Param('id') id: string, @Body() dto: any) {
        return this.ressourcesService.affecterEngin({ ...dto, projetId: id });
    }

    @Get(':id/sous-traitants')
    @Roles(...ROLES_INTERNES)
    getSousTraitantsProjet(@Param('id') id: string) {
        return this.ressourcesService.getSousTraitantsProjet(id);
    }

    @Post(':id/sous-traitants')
    @Roles(...ROLES_INTERNES)
    affecterSousTraitant(@Param('id') id: string, @Body() dto: any) {
        return this.ressourcesService.affecterSousTraitant({ ...dto, projetId: id });
    }

    @Get(':id/pointages')
    @Roles(...ROLES_INTERNES)
    getPointages(@Param('id') id: string) {
        return this.ressourcesService.getPointagesProjet(id);
    }

    @Post(':id/pointages')
    @Roles(...ROLES_INTERNES)
    createPointage(@Param('id') id: string, @Body() dto: any) {
        return this.ressourcesService.createPointage({ ...dto, projetId: id });
    }

    // ─── CRUD de base (DOIT être après les sous-routes) ────────────────────
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.projetsService.findOne(id);
    }

    @Patch(':id')
    @Roles(...ROLES_GESTION_PROJET)
    update(@Param('id') id: string, @Body() updateProjetDto: UpdateProjetDto) {
        return this.projetsService.update(id, updateProjetDto);
    }

    @Delete(':id')
    @Roles(RoleUtilisateur.DIRECTEUR_GENERAL)
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string) {
        return this.projetsService.remove(id);
    }
}
