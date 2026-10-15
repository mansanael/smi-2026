import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Projet } from '../projets/entities/projet.entity';
import { ProjetAccesService } from './projet-acces.service';
import { ProjetAccesGuard } from './projet-acces.guard';

// Global : le guard est utilisable dans tous les modules sans import
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Projet])],
  providers: [ProjetAccesService, ProjetAccesGuard],
  exports: [ProjetAccesService, ProjetAccesGuard],
})
export class AccesModule {}
