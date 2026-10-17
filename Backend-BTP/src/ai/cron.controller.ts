import { Controller, ForbiddenException, Get, Headers, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AlertesService } from './alertes.service';

/**
 * Tâches programmées appelées par Vercel Cron (voir vercel.json).
 * Sur Vercel, le serveur s'arrête entre deux requêtes : @Cron ne s'y exécute pas.
 * Vercel envoie « Authorization: Bearer <CRON_SECRET> » ; sans ce secret, l'appel est refusé.
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

  // Chaque matin : alertes de budget, retards, impayés, documents, incidents
  @Get('alertes')
  async alertes(@Headers('authorization') authorization?: string) {
    this.verifier(authorization);
    return this.alertesService.analyserMaintenant();
  }
}
