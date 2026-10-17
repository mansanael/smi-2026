import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsInt, IsNumber, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProjetAccesGuard } from '../acces/projet-acces.guard';
import { ROLES_BUDGET, ROLES_FACTURATION, ROLES_GESTION_MEMBRES } from '../auth/roles';
import { FINITIONS } from './estimation.calcul';
import type { Finition } from './estimation.calcul';
import { EstimationService } from './estimation.service';

class DescriptionDto {
  @IsString() @MinLength(5) @MaxLength(1000) description: string;
}

class CalculDto {
  @IsNumber() @Min(1) @Max(1_000_000) surfaceM2: number;
  @IsIn(FINITIONS) finition: Finition;
}

class PrixLotDto {
  @IsString() code: string;
  @IsInt() @Min(0) prixEconomique: number;
  @IsInt() @Min(0) prixStandard: number;
  @IsInt() @Min(0) prixHautStanding: number;
}

class BaremeDto {
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => PrixLotDto) lots: PrixLotDto[];
  @IsNumber() @Min(0) @Max(100) tauxImprevus: number;
  @IsNumber() @Min(0) @Max(100) tauxPartEntreprise: number;
  @IsNumber() @Min(0) @Max(100) tauxTva: number;
}

// Devis estimatif : consultation pour les rôles budget ; les prix sont réglés par la direction (DG, DT)
@Controller('estimation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ROLES_BUDGET)
export class EstimationController {
  constructor(private readonly estimation: EstimationService) {}

  @Get('bareme')
  getBareme() {
    return this.estimation.getBareme();
  }

  @Put('bareme')
  @Roles(...ROLES_GESTION_MEMBRES)
  updateBareme(@Body() dto: BaremeDto) {
    const { lots, ...taux } = dto;
    return this.estimation.updateBareme(lots, taux);
  }

  // « Villa R+2 de 300 m² à Mbao » → paramètres lus par l'IA + estimation
  @Post('analyser')
  @HttpCode(HttpStatus.OK)
  analyser(@Body() dto: DescriptionDto) {
    return this.estimation.analyser(dto.description);
  }

  // Recalcul quand on corrige la surface ou la finition
  @Post('calculer')
  @HttpCode(HttpStatus.OK)
  calculer(@Body() dto: CalculDto) {
    return this.estimation.calculer(dto.surfaceM2, dto.finition);
  }
}

// Ajout des lignes au devis d'un chantier : mêmes droits que la saisie du devis (DG, DT, RAF)
@Controller('projets/:projetId/estimation')
@UseGuards(JwtAuthGuard, RolesGuard, ProjetAccesGuard)
@Roles(...ROLES_FACTURATION)
export class EstimationProjetController {
  constructor(private readonly estimation: EstimationService) {}

  @Post('devis')
  creerDevis(@Param('projetId') projetId: string, @Body() dto: CalculDto) {
    return this.estimation.creerDevis(projetId, dto.surfaceM2, dto.finition);
  }
}
