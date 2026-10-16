import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Vocabulaire de chantier donné au modèle pour mieux l'orthographier (224 jetons max)
const VOCABULAIRE_CHANTIER =
  'Compte rendu de chantier BTP au Sénégal : maçonnerie, agglos, coffrage, ferraillage, ' +
  'fer de 10, béton, dalle, poteaux, longrines, chape, enduit, carrelage, faïence, plomberie, ' +
  'sanitaires, électricité, étanchéité, peinture, faux plafond, R+1, R+2, FCFA, tâcheron, ' +
  'manœuvre, ciment, sable, gravier, hivernage, harmattan, Dakar, Thiès, Mbao, Rufisque.';

const EXTENSIONS: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'mp4',
  'audio/x-m4a': 'm4a',
  'audio/m4a': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/flac': 'flac',
};

/** Transcription de la voix en texte avec Whisper (API Groq) */
@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);
  private readonly apiKey: string;
  private readonly url = 'https://api.groq.com/openai/v1/audio/transcriptions';
  // Le plus précis d'abord ; la version turbo sert de secours en cas de limite atteinte
  private readonly modeles = ['whisper-large-v3', 'whisper-large-v3-turbo'];

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('GROQ_API_KEY', '');
  }

  /** audio : contenu en base64 (avec ou sans préfixe data:) */
  async transcrire(audioBase64: string, mimeType: string): Promise<string> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('Transcription indisponible : clé GROQ_API_KEY absente.');
    }
    const type = mimeType.split(';')[0].trim().toLowerCase();
    const extension = EXTENSIONS[type];
    if (!extension) throw new BadRequestException(`Format audio non pris en charge : ${type}.`);

    const audio = Buffer.from(audioBase64.replace(/^data:[^,]*,/, ''), 'base64');
    if (audio.length === 0) throw new BadRequestException('Enregistrement vide.');

    for (const modele of this.modeles) {
      const form = new FormData();
      form.append('file', new Blob([audio], { type }), `note.${extension}`);
      form.append('model', modele);
      form.append('language', 'fr');
      form.append('prompt', VOCABULAIRE_CHANTIER);
      form.append('response_format', 'json');

      let res: Response;
      try {
        res = await fetch(this.url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.apiKey}` },
          body: form,
        });
      } catch (err) {
        this.logger.error('Groq injoignable pour la transcription', err);
        break;
      }

      if (res.ok) {
        const data = (await res.json()) as { text?: string };
        return (data.text ?? '').trim();
      }
      const detail = await res.text();
      if (res.status === 429) {
        this.logger.warn(`Limite atteinte sur ${modele}, passage au modèle suivant`);
        continue;
      }
      if (res.status === 400) {
        this.logger.warn(`Audio refusé par Groq : ${detail}`);
        throw new BadRequestException("L'enregistrement n'a pas pu être lu. Réessayez.");
      }
      this.logger.error(`Erreur Groq ${res.status} sur ${modele} : ${detail}`);
      break;
    }
    // 503 : la file hors ligne de l'application réessaiera plus tard
    throw new ServiceUnavailableException('Transcription momentanément indisponible, réessayez plus tard.');
  }
}
