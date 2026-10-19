import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Projet } from '../projets/entities/projet.entity';
import { Tache } from '../planning/entities/tache.entity';
import { Document } from '../documents/entities/document.entity';
import { RechercheService } from './recherche.service';
import { RechercheController } from './recherche.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Projet, Tache, Document])],
  controllers: [RechercheController],
  providers: [RechercheService],
})
export class RechercheModule {}
