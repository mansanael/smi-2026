import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  motDePasse: string;

  // « Se souvenir de moi » : session de 30 jours, utilisable hors ligne sur cet appareil
  @IsOptional()
  @IsBoolean()
  seSouvenir?: boolean;
}

export class MotDePasseOublieDto {
  @IsEmail({}, { message: 'Adresse email invalide.' })
  email: string;
}
