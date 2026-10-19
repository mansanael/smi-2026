import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RechercheService } from './recherche.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UtilisateurCourant } from '../auth/decorators/utilisateur-courant.decorator';
import type { UtilisateurAcces } from '../acces/projet-acces.service';

// Barre de recherche du haut : GET /recherche?q=ferraillage
@Controller('recherche')
@UseGuards(JwtAuthGuard)
export class RechercheController {
  constructor(private readonly service: RechercheService) {}

  @Get()
  rechercher(@Query('q') q: string, @UtilisateurCourant() user: UtilisateurAcces) {
    return this.service.rechercher(String(q ?? '').slice(0, 100), user);
  }
}
