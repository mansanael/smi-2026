import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// ─── Modules métier BATIPME-SN ───────────────────────────────────────────────
import { ProjetsModule } from './projets/projets.module'; // M1
import { PlanningModule } from './planning/planning.module'; // M2
import { BudgetModule } from './budget/budget.module'; // M3
import { RessourcesModule } from './ressources/ressources.module'; // M4
import { SuiviChantierModule } from './suivi-chantier/suivi-chantier.module'; // M5
import { DocumentsModule } from './documents/documents.module'; // M6
import { ApprovisionnementsModule } from './approvisionnement/approvisionnements.module'; // M7
import { FacturationModule } from './facturation/facturation.module'; // M8
import { PaiementsModule } from './paiements/paiements.module'; // M8 – paiements du client
import { DashboardModule } from './dashboard/dashboard.module'; // M9
import { AuthModule } from './auth/auth.module'; // M10
import { UtilisateursModule } from './utilisateurs/utilisateurs.module'; // M10
import { AiModule } from './ai/ai.module';
import { AccesModule } from './acces/acces.module';
import { VoixModule } from './voix/voix.module'; // Commande vocale
import { ParametresModule } from './parametres/parametres.module'; // Réglages de l'entreprise
import { EstimationModule } from './estimation/estimation.module'; // Devis estimatif par l'IA
import { ScheduleModule } from '@nestjs/schedule'; // M11 – Assistant IA

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', ''),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_DATABASE', ''),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // ⚠️ À remplacer par des migrations en production
        ssl:
          config.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
    AccesModule,
    RessourcesModule,
    ProjetsModule,
    PlanningModule,
    BudgetModule,
    SuiviChantierModule,
    DocumentsModule,
    ApprovisionnementsModule,
    FacturationModule,
    PaiementsModule,
    DashboardModule,
    AuthModule,
    UtilisateursModule,
    AiModule,
    VoixModule,
    ParametresModule,
    EstimationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
