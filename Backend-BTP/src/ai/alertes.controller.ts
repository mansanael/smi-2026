import { Controller, Get, Patch, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { AlertesService } from './alertes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai/alertes')
@UseGuards(JwtAuthGuard)
export class AlertesController {
  constructor(private readonly alertesService: AlertesService) {}

  // GET /api/ai/alertes — toutes les alertes (optionnel ?lu=false)
  @Get()
  getAlertes(@Query('lu') lu?: string) {
    const luBool = lu === undefined ? undefined : lu === 'true';
    return this.alertesService.getAlertes(luBool);
  }

  // GET /api/ai/alertes/count — nombre d'alertes non lues
  @Get('count')
  getNombreNonLues() {
    return this.alertesService.getNombreNonLues().then(count => ({ count }));
  }

  // POST /api/ai/alertes/analyser — déclencher manuellement l'analyse
  @Get('analyser')
  analyserMaintenant() {
    return this.alertesService.analyserMaintenant();
  }

  // PATCH /api/ai/alertes/tout-lu — marquer tout comme lu
  @Patch('tout-lu')
  marquerToutCommeLu() {
    return this.alertesService.marquerToutCommeLu().then(() => ({ message: 'Toutes les alertes marquées comme lues.' }));
  }

  // PATCH /api/ai/alertes/:id/lu — marquer une alerte comme lue
  @Patch(':id/lu')
  marquerCommeLu(@Param('id') id: string) {
    return this.alertesService.marquerCommeLu(id).then(() => ({ message: 'Alerte marquée comme lue.' }));
  }

  // DELETE /api/ai/alertes — effacer toutes les alertes
  @Delete()
  toutEffacer() {
    return this.alertesService.toutEffacer().then(() => ({ message: 'Alertes effacées.' }));
  }
}
