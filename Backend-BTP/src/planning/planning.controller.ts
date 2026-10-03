import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { PlanningService } from './planning.service';
import { CreateTacheDto } from './dto/create-tache.dto';
import { CreateJalonDto } from './dto/create-jalon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  // ─── TÂCHES ────────────────────────────────────────────────────────────
  @Post('projets/:projetId/taches')
  createTache(@Param('projetId') projetId: string, @Body() dto: CreateTacheDto) {
    return this.planningService.createTache(projetId, dto);
  }

  @Get('projets/:projetId/taches')
  getTaches(@Param('projetId') projetId: string) {
    return this.planningService.findTachesProjet(projetId);
  }

  @Patch('taches/:id')
  updateTache(@Param('id') id: string, @Body() dto: Partial<CreateTacheDto>) {
    return this.planningService.updateTache(id, dto);
  }

  @Delete('taches/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTache(@Param('id') id: string) {
    return this.planningService.removeTache(id);
  }

  // ─── JALONS ────────────────────────────────────────────────────────────
  @Post('projets/:projetId/jalons')
  createJalon(@Param('projetId') projetId: string, @Body() dto: CreateJalonDto) {
    return this.planningService.createJalon(projetId, dto);
  }

  @Get('projets/:projetId/jalons')
  getJalons(@Param('projetId') projetId: string) {
    return this.planningService.findJalonsProjet(projetId);
  }

  @Patch('jalons/:id')
  updateJalon(@Param('id') id: string, @Body() dto: Partial<CreateJalonDto>) {
    return this.planningService.updateJalon(id, dto);
  }

  @Delete('jalons/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeJalon(@Param('id') id: string) {
    return this.planningService.removeJalon(id);
  }
}
