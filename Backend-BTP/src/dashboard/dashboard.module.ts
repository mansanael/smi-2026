import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Projet } from '../projets/entities/projet.entity';
import { Tache } from '../planning/entities/tache.entity';
import { Depense } from '../budget/entities/depense.entity';
import { Incident } from '../suivi-chantier/entities/incident.entity';
import { SituationTravaux } from '../facturation/entities/situation-travaux.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Projet, Tache, Depense, Incident, SituationTravaux])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
