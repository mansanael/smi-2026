import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Echeance } from './entities/echeance.entity';
import { Paiement } from './entities/paiement.entity';
import { CreateEcheanceDto, CreatePaiementDto, UpdateEcheanceDto } from './dto/paiements.dto';
import { ProjetsService } from '../projets/projets.service';

export type StatutEcheance = 'payee' | 'partielle' | 'en_retard' | 'a_venir';

const arrondi = (n: number) => Math.round(n * 100) / 100;
const aujourdhui = () => new Date().toISOString().slice(0, 10); // Sénégal : UTC+0

/**
 * Les versements remboursent les échéances dans l'ordre des dates limites :
 * une échéance est payée quand le total reçu couvre elle et toutes les précédentes.
 */
export function calculerSuivi(
  montantMarche: number,
  echeances: Echeance[],
  paiements: Paiement[],
  dateDuJour: string = aujourdhui(),
) {
  const totalRecu = arrondi(paiements.reduce((s, p) => s + Number(p.montant), 0));
  let disponible = totalRecu;

  const lignes = [...echeances]
    .sort((a, b) => String(a.dateLimite).localeCompare(String(b.dateLimite)))
    .map((e) => {
      const montant = Number(e.montant);
      const montantRegle = arrondi(Math.min(montant, disponible));
      disponible = arrondi(disponible - montantRegle);
      const resteDu = arrondi(montant - montantRegle);
      const depassee = String(e.dateLimite) < dateDuJour;
      const statut: StatutEcheance =
        resteDu === 0 ? 'payee' : depassee ? 'en_retard' : montantRegle > 0 ? 'partielle' : 'a_venir';
      const joursRetard = statut === 'en_retard'
        ? Math.floor((Date.parse(dateDuJour) - Date.parse(String(e.dateLimite))) / 86400000)
        : 0;
      return { ...e, montant, montantRegle, resteDu, statut, joursRetard };
    });

  const enRetard = lignes.filter((l) => l.statut === 'en_retard');
  return {
    montantMarche,
    totalEcheancier: arrondi(lignes.reduce((s, l) => s + l.montant, 0)),
    totalRecu,
    resteAPayer: arrondi(Math.max(0, montantMarche - totalRecu)),
    tauxEncaissement: montantMarche > 0 ? arrondi((totalRecu / montantMarche) * 100) : 0,
    montantEnRetard: arrondi(enRetard.reduce((s, l) => s + l.resteDu, 0)),
    nombreEcheancesEnRetard: enRetard.length,
    echeances: lignes,
    paiements: [...paiements].sort((a, b) => String(b.date).localeCompare(String(a.date))),
  };
}

@Injectable()
export class PaiementsService {
  constructor(
    @InjectRepository(Echeance) private readonly echeanceRepo: Repository<Echeance>,
    @InjectRepository(Paiement) private readonly paiementRepo: Repository<Paiement>,
    private readonly projetsService: ProjetsService,
  ) {}

  async getSuivi(projetId: string) {
    const projet = await this.projetsService.findOne(projetId);
    const [echeances, paiements] = await Promise.all([
      this.echeanceRepo.find({ where: { projet: { id: projetId } } }),
      this.paiementRepo.find({ where: { projet: { id: projetId } } }),
    ]);
    return calculerSuivi(Number(projet.montantMarche), echeances, paiements);
  }

  // ─── Versements ───────────────────────────────────────────────────────────
  addPaiement(projetId: string, dto: CreatePaiementDto, enregistrePar: string) {
    return this.paiementRepo.save(
      this.paiementRepo.create({ ...dto, enregistrePar, projet: { id: projetId } }),
    );
  }

  async removePaiement(projetId: string, id: string): Promise<void> {
    const paiement = await this.paiementRepo.findOne({ where: { id, projet: { id: projetId } } });
    if (!paiement) throw new NotFoundException('Versement introuvable.');
    await this.paiementRepo.remove(paiement);
  }

  // ─── Échéancier ───────────────────────────────────────────────────────────
  private async trouverEcheance(projetId: string, id: string): Promise<Echeance> {
    const echeance = await this.echeanceRepo.findOne({ where: { id, projet: { id: projetId } } });
    if (!echeance) throw new NotFoundException('Échéance introuvable.');
    return echeance;
  }

  addEcheance(projetId: string, dto: CreateEcheanceDto) {
    return this.echeanceRepo.save(this.echeanceRepo.create({ ...dto, projet: { id: projetId } }));
  }

  async updateEcheance(projetId: string, id: string, dto: UpdateEcheanceDto) {
    const echeance = await this.trouverEcheance(projetId, id);
    Object.assign(echeance, dto);
    return this.echeanceRepo.save(echeance);
  }

  async removeEcheance(projetId: string, id: string): Promise<void> {
    await this.echeanceRepo.remove(await this.trouverEcheance(projetId, id));
  }

  async relancer(projetId: string, id: string) {
    const echeance = await this.trouverEcheance(projetId, id);
    echeance.nombreRelances += 1;
    echeance.derniereRelanceLe = aujourdhui();
    return this.echeanceRepo.save(echeance);
  }
}
