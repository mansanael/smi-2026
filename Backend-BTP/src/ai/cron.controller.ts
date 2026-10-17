import { Controller, ForbiddenException, Get, Headers, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AlertesService } from './alertes.service';

/**
 * Tâches programmées déclenchées de l'extérieur (ex. cron-job.org, chaque matin à 7 h).
 * Sur l'offre gratuite de Render, le serveur s'endort sans visite : @Cron ne s'exécute pas,
 * cet appel le réveille et lance l'analyse. L'appelant envoie « Authorization: Bearer <CRON_SECRET> ».
 */
@Controller('cron')
export class CronController {
  constructor(
    private readonly config: ConfigService,
    private readonly alertesService: AlertesService,
  ) {}

  private verifier(authorization?: string) {
    const secret = this.config.get<string>('CRON_SECRET');
    if (!secret) throw new ServiceUnavailableException('CRON_SECRET non configuré.');
    if (authorization !== `Bearer ${secret}`) throw new ForbiddenException();
  }

  // Chaque matin : alertes de budget, retards, impayés, documents, incidents (une fois par jour)
  @Get('alertes')
  async alertes(@Headers('authorization') authorization?: string) {
    this.verifier(authorization);
    return this.alertesService.analyserUneFoisParJour();
  }
}
