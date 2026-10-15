import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Echeance } from './entities/echeance.entity';
import { Paiement } from './entities/paiement.entity';
import { PaiementsService } from './paiements.service';
import { PaiementsController } from './paiements.controller';
import { ProjetsModule } from '../projets/projets.module';

@Module({
  imports: [TypeOrmModule.forFeature([Echeance, Paiement]), ProjetsModule],
  controllers: [PaiementsController],
  providers: [PaiementsService],
  exports: [PaiementsService], // utilisé par les alertes et l'assistant IA
})
export class PaiementsModule {}
