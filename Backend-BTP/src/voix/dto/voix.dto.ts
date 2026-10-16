import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength, Min } from 'class-validator';

// Corps maximal accepté par Vercel : 4,5 Mo → environ 3 Mo d'audio, soit plus de 10 min de voix
const AUDIO_BASE64_MAX = 4_000_000;

export class AudioDto {
  @IsString() @IsNotEmpty()
  @MaxLength(AUDIO_BASE64_MAX, { message: 'Enregistrement trop long (3 minutes maximum).' })
  audio: string; // base64

  @IsString() @Matches(/^audio\//, { message: 'Le fichier doit être un enregistrement audio.' })
  mimeType: string;
}

export class CreateNoteVocaleDto extends AudioDto {
  @IsOptional() @IsUUID() id?: string; // fourni par l'application : pas de doublon à la resynchronisation

  @IsOptional() @IsInt() @Min(0) dureeSecondes?: number;

  @IsOptional() @IsDateString() enregistreeLe?: string;
}

export class CompteRenduDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date attendue au format AAAA-MM-JJ.' })
  @IsDateString()
  date: string;
}
