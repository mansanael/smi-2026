import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SuiviChantierService } from './suivi-chantier.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('projets/:projetId')
@UseGuards(JwtAuthGuard)
export class SuiviChantierController {
  constructor(private readonly service: SuiviChantierService) {}

  @Post('journaux')
  createJournal(@Param('projetId') id: string, @Body() dto: any) {
    return this.service.createJournal(id, dto);
  }
  @Get('journaux')
  getJournaux(@Param('projetId') id: string) {
    return this.service.getJournaux(id);
  }

  @Post('incidents')
  createIncident(@Param('projetId') id: string, @Body() dto: any) {
    return this.service.createIncident(id, dto);
  }
  @Get('incidents')
  getIncidents(@Param('projetId') id: string) {
    return this.service.getIncidents(id);
  }

  @Post('photos')
  createPhoto(@Param('projetId') id: string, @Body() dto: any) {
    return this.service.createPhoto(id, dto);
  }
  @Get('photos')
  getPhotos(
    @Param('projetId') id: string,
    @Query('categorie') categorie?: any,
  ) {
    return this.service.getPhotos(id, categorie);
  }
  @Delete('photos/:photoId')
  deletePhoto(@Param('photoId') photoId: string) {
    return this.service.deletePhoto(photoId);
  }
}
