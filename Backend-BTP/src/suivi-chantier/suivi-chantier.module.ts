import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JournalChantier } from './entities/journal-chantier.entity';
import { Incident } from './entities/incident.entity';
import { PhotoChantier } from './entities/photo-chantier.entity';
import { SuiviChantierService } from './suivi-chantier.service';
import { SuiviChantierController } from './suivi-chantier.controller';

@Module({
  imports: [TypeOrmModule.forFeature([JournalChantier, Incident, PhotoChantier])],
  controllers: [SuiviChantierController],
  providers: [SuiviChantierService],
  exports: [SuiviChantierService],
})
export class SuiviChantierModule {}
