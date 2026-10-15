import { Test, TestingModule } from '@nestjs/testing';
import { ProjetsController } from './projets.controller';
import { ProjetsService } from './projets.service';
import { RessourcesService } from '../ressources/ressources.service';
import { ProjetAccesService } from '../acces/projet-acces.service';

describe('ProjetsController', () => {
  let controller: ProjetsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjetsController],
      providers: [
        { provide: ProjetsService, useValue: {} },
        { provide: RessourcesService, useValue: {} },
        { provide: ProjetAccesService, useValue: {} },
      ],
    }).compile();

    controller = module.get<ProjetsController>(ProjetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
