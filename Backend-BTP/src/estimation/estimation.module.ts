import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatioDevis } from './ratio-devis.entity';
import { EstimationService } from './estimation.service';
import { EstimationController, EstimationProjetController } from './estimation.controller';
import { ParametresModule } from '../parametres/parametres.module';
import { VoixModule } from '../voix/voix.module';
import { BudgetModule } from '../budget/budget.module';

// Devis estimatif par l'IA : la phrase est lue par l'IA, le calcul utilise les prix de l'entreprise
@Module({
  imports: [TypeOrmModule.forFeature([RatioDevis]), ParametresModule, VoixModule, BudgetModule],
  controllers: [EstimationController, EstimationProjetController],
  providers: [EstimationService],
})
export class EstimationModule {}
