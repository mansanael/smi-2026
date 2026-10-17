import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParametreEntreprise } from './parametre-entreprise.entity';
import { ParametresService } from './parametres.service';
import { ParametresController } from './parametres.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ParametreEntreprise])],
  controllers: [ParametresController],
  providers: [ParametresService],
  exports: [ParametresService],
})
export class ParametresModule {}
