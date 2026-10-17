import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString, Min, Max } from 'class-validator';
import { LotWBS, StatutTache } from '../entities/tache.entity';

export class CreateTacheDto {
  @IsNotEmpty() @IsString()
  nom: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsEnum(LotWBS)
  lot?: LotWBS;

  @IsOptional() @IsDateString()
  dateDebutPrevue?: string;

  @IsOptional() @IsDateString()
  dateFinPrevue?: string;

  // Tâche saisie après coup : dates réelles connues (sinon, date du jour au passage en cours / terminée)
  @IsOptional() @IsDateString()
  dateDebutReelle?: string;

  @IsOptional() @IsDateString()
  dateFinReelle?: string;

  @IsOptional() @IsNumber()
  dureeJours?: number;

  @IsOptional() @IsEnum(StatutTache)
  statut?: StatutTache;

  @IsOptional() @IsNumber() @Min(0) @Max(100)
  pourcentageAvancement?: number;

  @IsOptional() @IsString()
  tachePrecedenteId?: string;

  @IsOptional() @IsString()
  responsable?: string;
}
