import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JournalChantier } from './entities/journal-chantier.entity';
import { Incident } from './entities/incident.entity';
import { PhotoChantier } from './entities/photo-chantier.entity';
import { SuiviChantierService } from './suivi-chantier.service';
import { SuiviChantierController } from './suivi-chantier.controller';
import { VoixModule } from '../voix/voix.module';
import { ParametresModule } from '../parametres/parametres.module';

@Module({
  // VoixModule : l'IA rédige le résumé du rapport pour le client ; ParametresModule : heure de publication
  imports: [TypeOrmModule.forFeature([JournalChantier, Incident, PhotoChantier]), VoixModule, ParametresModule],
  controllers: [SuiviChantierController],
  providers: [SuiviChantierService],
  exports: [SuiviChantierService],
})
export class SuiviChantierModule {}
