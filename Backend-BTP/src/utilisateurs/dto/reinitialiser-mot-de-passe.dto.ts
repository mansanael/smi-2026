import { IsNotEmpty, MinLength } from 'class-validator';

export class ReinitialiserMotDePasseDto {
  @IsNotEmpty()
  @MinLength(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' })
  nouveauMotDePasse: string;
}
