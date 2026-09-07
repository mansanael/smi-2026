import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiContextService } from './ai-context.service';
import { AlertesController } from './alertes.controller';
import { AlertesService } from './alertes.service';
import { ConversationsService } from './conversations.service';
import { Alerte } from './alerte.entity';
import { Conversation } from './conversation.entity';
import { DashboardModule } from '../dashboard/dashboard.module';
import { ProjetsModule } from '../projets/projets.module';
import { BudgetModule } from '../budget/budget.module';
import { PlanningModule } from '../planning/planning.module';
import { SuiviChantierModule } from '../suivi-chantier/suivi-chantier.module';
import { FacturationModule } from '../facturation/facturation.module';
import { DocumentsModule } from '../documents/documents.module';
import { ApprovisionnementsModule } from '../approvisionnement/approvisionnements.module';
import { RessourcesModule } from '../ressources/ressources.module';
import { UtilisateursModule } from '../utilisateurs/utilisateurs.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Alerte, Conversation]),
    DashboardModule,
    ProjetsModule,
    BudgetModule,
    PlanningModule,
    SuiviChantierModule,
    FacturationModule,
    DocumentsModule,
    ApprovisionnementsModule,
    RessourcesModule,
    UtilisateursModule,
  ],
  controllers: [AiController, AlertesController],
  providers: [
    AiService,
    AiContextService,
    AlertesService,
    ConversationsService,
  ],
})
export class AiModule {}
