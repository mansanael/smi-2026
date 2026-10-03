import { IsOptional, IsString } from 'class-validator';

export class UpdateProfilDto {
    @IsOptional()
    @IsString()
    nom?: string;

    @IsOptional()
    @IsString()
    prenom?: string;

    @IsOptional()
    @IsString()
    telephone?: string;

    @IsOptional()
    @IsString()
    poste?: string;

    @IsOptional()
    @IsString()
    photo?: string | null;
}