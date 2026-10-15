import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ModePaiement } from '../entities/paiement.entity';

export class CreateEcheanceDto {
  @IsNotEmpty() @IsString() libelle: string;
  @IsNumber() @IsPositive() montant: number;
  @IsDateString() dateLimite: string;
}

export class UpdateEcheanceDto extends PartialType(CreateEcheanceDto) {}

export class CreatePaiementDto {
  @IsDateString() date: string;
  @IsNumber() @IsPositive() montant: number;
  @IsEnum(ModePaiement) mode: ModePaiement;
  @IsOptional() @IsString() reference?: string;
  @IsOptional() @IsString() observations?: string;
}
