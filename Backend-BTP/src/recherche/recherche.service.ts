import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { Projet } from '../projets/entities/projet.entity';
import { Tache } from '../planning/entities/tache.entity';
import { Document, estVisibleClient } from '../documents/entities/document.entity';
import { ProjetAccesService } from '../acces/projet-acces.service';
import type { UtilisateurAcces } from '../acces/projet-acces.service';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';

const PAR_CATEGORIE = 5;
const AVEC_ACCENTS = 'àâäáãéèêëíìîïóòôöõúùûüçñ';
const SANS_ACCENTS = 'aaaaaeeeeiiiiooooouuuucn';

/** Texte comparé sans majuscules ni accents (« beton » trouve « Béton ») */
export const normaliser = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

/** Motif LIKE : les caractères spéciaux % _ \ tapés par l'utilisateur sont cherchés tels quels */
export const motifLike = (q: string) => `%${normaliser(q).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

// Colonne SQL ramenée en minuscules sans accents, comme la saisie (pas besoin de l'extension unaccent)
const sansAccents = (colonne: string) => `translate(lower(coalesce(${colonne}, '')), '${AVEC_ACCENTS}', '${SANS_ACCENTS}')`;

/**
 * Recherche de la barre du haut : chantiers, tâches et documents, dans le périmètre de l'utilisateur
 * (mêmes règles que le reste de l'application ; le client ne voit que les documents partagés avec lui).
 */
@Injectable()
export class RechercheService {
  constructor(
    @InjectRepository(Projet) private readonly projetRepo: Repository<Projet>,
    @InjectRepository(Tache) private readonly tacheRepo: Repository<Tache>,
    @InjectRepository(Document) private readonly documentRepo: Repository<Document>,
    private readonly acces: ProjetAccesService,
  ) {}

  async rechercher(q: string, user: UtilisateurAcces) {
    const vide = { projets: [], taches: [], documents: [] };
    if (normaliser(q ?? '').length < 2) return vide;
    const ids = await this.acces.projetIdsAutorises(user);
    if (ids !== null && ids.length === 0) return vide;
    const motif = motifLike(q);

    // Filtre « une des colonnes contient le motif », limité aux projets autorisés
    const filtrer = <T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, colonnes: string[], colonneProjet: string) => {
      qb.where(new Brackets((w) => colonnes.forEach((c) => w.orWhere(`${sansAccents(c)} LIKE :motif ESCAPE '\\'`, { motif }))));
      if (ids !== null) qb.andWhere(`${colonneProjet} IN (:...ids)`, { ids });
      return qb;
    };

    const [projets, taches, documents] = await Promise.all([
      filtrer(this.projetRepo.createQueryBuilder('p'), ['p.reference', 'p.intitule', 'p.commune', 'p.maitreOuvrage'], 'p.id')
        .orderBy('p.reference', 'ASC').take(PAR_CATEGORIE).getMany(),
      filtrer(this.tacheRepo.createQueryBuilder('t').leftJoinAndSelect('t.projet', 'tp'), ['t.nom'], 'tp.id')
        .orderBy('t.dateFinPrevue', 'ASC', 'NULLS LAST').take(PAR_CATEGORIE).getMany(),
      // Un peu plus de documents que nécessaire : ceux que le client ne doit pas voir sont retirés ensuite
      filtrer(this.documentRepo.createQueryBuilder('d').leftJoinAndSelect('d.projet', 'dp'), ['d.nom'], 'dp.id')
        .orderBy('d.creeLe', 'DESC').take(PAR_CATEGORIE * 4).getMany(),
    ]);

    const client = user.role === RoleUtilisateur.MAITRE_OUVRAGE_EXTERNE;
    const projetCourt = (p?: Projet) => (p ? { id: p.id, reference: p.reference, intitule: p.intitule } : null);
    return {
      projets: projets.map((p) => ({ id: p.id, reference: p.reference, intitule: p.intitule, commune: p.commune, statut: p.statut })),
      taches: taches.map((t) => ({ id: t.id, nom: t.nom, statut: t.statut, projet: projetCourt(t.projet) })),
      documents: documents
        .filter((d) => !client || estVisibleClient(d))
        .slice(0, PAR_CATEGORIE)
        .map((d) => ({ id: d.id, nom: d.nom, type: d.type, projet: projetCourt(d.projet) })),
    };
  }
}
