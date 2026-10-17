import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Matches } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLES_GESTION_MEMBRES } from '../auth/roles';
import { ParametresService } from './parametres.service';

class UpdateParametresDto {
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Heure attendue au format HH:MM (ex. 18:00).' })
  heurePublicationClient: string;
}

@Controller('parametres')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParametresController {
  constructor(private readonly parametres: ParametresService) {}

  // Lu par tous (le client voit à quelle heure son rapport arrive)
  @Get()
  get() {
    return this.parametres.get();
  }

  // Réglé par la direction (DG, DT)
  @Patch()
  @Roles(...ROLES_GESTION_MEMBRES)
  update(@Body() dto: UpdateParametresDto) {
    return this.parametres.update(dto);
  }
}
