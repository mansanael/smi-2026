import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Projet } from './entities/projet.entity';
import { CreateProjetDto } from './dto/create-projet.dto';
import { UpdateProjetDto } from './dto/update-projet.dto';
import { Utilisateur } from '../utilisateurs/entities/utilisateur.entity';
import { ProjetAccesService, UtilisateurAcces } from '../acces/projet-acces.service';

// Code d'erreur PostgreSQL pour violation de contrainte unique
const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class ProjetsService {
  constructor(
    @InjectRepository(Projet)
    private readonly projetRepository: Repository<Projet>,
    @InjectRepository(Utilisateur)
    private readonly utilisateurRepository: Repository<Utilisateur>,
    private readonly acces: ProjetAccesService,
  ) {}

  async create(createProjetDto: CreateProjetDto, createur: UtilisateurAcces): Promise<Projet> {
    try {
      const projet = this.projetRepository.create(createProjetDto);
      // Un chef de projet doit rester membre du projet qu'il crée, sinon il n'y a plus accès
      if (!this.acces.voitTousLesProjets(createur)) {
        projet.membres = [{ id: createur.id } as Utilisateur];
      }
      const saved = await this.projetRepository.save(projet);
      delete (saved as Partial<Projet>).membres;
      return saved;
    } catch (err) {
      if (err.code === PG_UNIQUE_VIOLATION) {
        throw new ConflictException(
          `Un projet avec la référence "${createProjetDto.reference}" existe déjà.`,
        );
      }
      throw err;
    }
  }

  /** Sans utilisateur : tous les projets (usage interne : alertes, IA) */
  async findAll(user?: UtilisateurAcces): Promise<Projet[]> {
    const ids = user ? await this.acces.projetIdsAutorises(user) : null;
    if (ids === null) return this.projetRepository.find();
    if (ids.length === 0) return [];
    return this.projetRepository.find({ where: { id: In(ids) } });
  }

  async findOne(id: string): Promise<Projet> {
    const projet = await this.projetRepository.findOneBy({ id });
    if (!projet) {
      throw new NotFoundException(`Projet avec l'ID "${id}" introuvable.`);
    }
    return projet;
  }

  async update(id: string, updateProjetDto: UpdateProjetDto): Promise<Projet> {
    await this.findOne(id); // vérifie existence → lève 404 si absent
    try {
      await this.projetRepository.update(id, updateProjetDto);
      return this.projetRepository.findOneByOrFail({ id });
    } catch (err) {
      if (err.code === PG_UNIQUE_VIOLATION) {
        throw new ConflictException(
          `Un projet avec cette référence existe déjà.`,
        );
      }
      throw err;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // vérifie existence → lève 404 si absent
    await this.projetRepository.delete(id);
  }

  // ─── Équipe du projet ─────────────────────────────────────────────────────
  async getMembres(id: string) {
    const projet = await this.projetRepository.findOne({ where: { id }, relations: { membres: true } });
    if (!projet) {
      throw new NotFoundException(`Projet avec l'ID "${id}" introuvable.`);
    }
    return projet.membres.map(({ id, nom, prenom, email, role, poste }) => ({ id, nom, prenom, email, role, poste }));
  }

  async setMembres(id: string, utilisateurIds: string[]) {
    const projet = await this.findOne(id);
    const ids = [...new Set(utilisateurIds)];
    const utilisateurs = ids.length ? await this.utilisateurRepository.findBy({ id: In(ids) }) : [];
    if (utilisateurs.length !== ids.length) {
      throw new BadRequestException('Un ou plusieurs utilisateurs sont introuvables.');
    }
    projet.membres = utilisateurs;
    await this.projetRepository.save(projet);
    return this.getMembres(id);
  }
}