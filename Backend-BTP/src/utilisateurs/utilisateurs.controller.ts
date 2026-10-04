import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { UtilisateursService } from './utilisateurs.service';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleUtilisateur } from './entities/utilisateur.entity';

@Controller('admin/utilisateurs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UtilisateursController {
  constructor(private readonly utilisateursService: UtilisateursService) { }

  /**
   * POST /api/admin/utilisateurs
   * Réservé : DG et DT uniquement
   */
  @Post()
  @Roles(RoleUtilisateur.DIRECTEUR_GENERAL, RoleUtilisateur.DIRECTEUR_TECHNIQUE)
  create(@Body() dto: CreateUtilisateurDto) {
    return this.utilisateursService.create(dto);
  }

  /**
   * GET /api/admin/utilisateurs
   * Réservé : DG et DT uniquement
   */
  @Get()
  @Roles(RoleUtilisateur.DIRECTEUR_GENERAL, RoleUtilisateur.DIRECTEUR_TECHNIQUE)
  findAll() {
    return this.utilisateursService.findAll();
  }

  /**
   * GET /api/admin/utilisateurs/:id
   */
  @Get(':id')
  @Roles(RoleUtilisateur.DIRECTEUR_GENERAL, RoleUtilisateur.DIRECTEUR_TECHNIQUE)
  findOne(@Param('id') id: string) {
    return this.utilisateursService.findOneById(id);
  }

  /**
   * DELETE /api/admin/utilisateurs/:id
   * Désactive le compte (soft delete) — réservé DG uniquement
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleUtilisateur.DIRECTEUR_GENERAL)
  desactiver(@Param('id') id: string) {
    return this.utilisateursService.desactiver(id);
  }

  /**
 * PATCH /api/admin/utilisateurs/:id/reactiver
 * Réactive un compte désactivé — réservé DG uniquement
 */
  @Patch(':id/reactiver')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleUtilisateur.DIRECTEUR_GENERAL)
  reactiver(@Param('id') id: string) {
    return this.utilisateursService.reactiver(id);
  }
}
