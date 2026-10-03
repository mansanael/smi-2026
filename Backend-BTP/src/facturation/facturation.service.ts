import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SituationTravaux, StatutSituation,
  TVA_TAUX, TCS_TAUX, RETENUE_GARANTIE, AVANCE_DEMARRAGE,
} from './entities/situation-travaux.entity';

// Circuit de validation : passages de statut autorisés
const TRANSITIONS: Record<StatutSituation, StatutSituation[]> = {
  [StatutSituation.BROUILLON]: [StatutSituation.SOUMISE],
  [StatutSituation.SOUMISE]: [StatutSituation.VALIDEE, StatutSituation.REJETEE],
  [StatutSituation.VALIDEE]: [StatutSituation.PAYEE, StatutSituation.REJETEE],
  [StatutSituation.PAYEE]: [],
  [StatutSituation.REJETEE]: [StatutSituation.BROUILLON],
};

@Injectable()
export class FacturationService {
  constructor(@InjectRepository(SituationTravaux) private situationRepo: Repository<SituationTravaux>) { }

  // Calculs automatiques conformes CDC §10.1 (marchés publics sénégalais)
  private calculer(montantHTNouveau: number) {
    const avanceDeduire = montantHTNouveau * AVANCE_DEMARRAGE; // remboursement de l'avance au prorata des travaux
    const retenueGarantie = montantHTNouveau * RETENUE_GARANTIE;
    const montantTVA = montantHTNouveau * TVA_TAUX;
    const montantTCS = montantHTNouveau * TCS_TAUX; // précompte retenu à la source
    const netAPayer = montantHTNouveau - avanceDeduire - retenueGarantie + montantTVA - montantTCS;
    return {
      avanceDeduire: Math.round(avanceDeduire),
      retenueGarantie: Math.round(retenueGarantie),
      montantTVA: Math.round(montantTVA),
      montantTCS: Math.round(montantTCS),
      netAPayer: Math.round(netAPayer),
    };
  }

  private async trouver(projetId: string, id: string): Promise<SituationTravaux> {
    const situation = await this.situationRepo.findOne({ where: { id, projet: { id: projetId } } });
    if (!situation) throw new NotFoundException('Situation de travaux introuvable.');
    return situation;
  }

  async createSituation(projetId: string, dto: any, _montantMarche?: number): Promise<SituationTravaux> {
    const montantHTNouveau = Number(dto.montantHTNouveau);
    const situation = this.situationRepo.create({
      ...dto,
      projet: { id: projetId } as any,
      ...this.calculer(montantHTNouveau),
    });
    return this.situationRepo.save(situation) as unknown as SituationTravaux;
  }

  // Modification : possible uniquement en brouillon ou après rejet, avec recalcul des montants
  async updateSituation(projetId: string, id: string, dto: any): Promise<SituationTravaux> {
    const situation = await this.trouver(projetId, id);
    if (![StatutSituation.BROUILLON, StatutSituation.REJETEE].includes(situation.statut)) {
      throw new BadRequestException('Seules les situations en brouillon ou rejetées peuvent être modifiées.');
    }
    if (dto.numero !== undefined) situation.numero = Number(dto.numero);
    if (dto.mois !== undefined) situation.mois = dto.mois;
    if (dto.montantHTCumul !== undefined) situation.montantHTCumul = Number(dto.montantHTCumul);
    if (dto.montantHTNouveau !== undefined) situation.montantHTNouveau = Number(dto.montantHTNouveau);
    if (dto.pourcentageAvancement !== undefined) situation.pourcentageAvancement = Number(dto.pourcentageAvancement);
    Object.assign(situation, this.calculer(Number(situation.montantHTNouveau)));
    return this.situationRepo.save(situation);
  }

  // Changement de statut selon le circuit : brouillon → soumise → validée → payée (ou rejetée)
  async updateStatut(projetId: string, id: string, nouveauStatut: string, utilisateur: any): Promise<SituationTravaux> {
    const situation = await this.trouver(projetId, id);
    if (!Object.values(StatutSituation).includes(nouveauStatut as StatutSituation)) {
      throw new BadRequestException('Statut invalide.');
    }
    const cible = nouveauStatut as StatutSituation;
    if (!TRANSITIONS[situation.statut].includes(cible)) {
      throw new BadRequestException(`Passage de « ${situation.statut} » à « ${cible} » non autorisé.`);
    }
    situation.statut = cible;
    if (cible === StatutSituation.VALIDEE) {
      situation.validePar = `${utilisateur?.prenom ?? ''} ${utilisateur?.nom ?? ''}`.trim();
      situation.dateValidation = new Date();
    }
    if (cible === StatutSituation.PAYEE) {
      situation.datePaiement = new Date();
    }
    if (cible === StatutSituation.BROUILLON || cible === StatutSituation.REJETEE) {
      situation.validePar = null as any;
      situation.dateValidation = null as any;
    }
    return this.situationRepo.save(situation);
  }

  getSituations(projetId: string) {
    return this.situationRepo.find({ where: { projet: { id: projetId } }, order: { numero: 'ASC' } });
  }

  // Récapitulatif financier : total encaissé vs total à encaisser
  async getRecapitulatif(projetId: string) {
    const situations = await this.getSituations(projetId);
    const totalNetAPayer = situations.reduce((s, sit) => s + Number(sit.netAPayer), 0);
    const totalEncaisse = situations
      .filter(s => s.statut === 'payee')
      .reduce((s, sit) => s + Number(sit.netAPayer), 0);
    return {
      nombreSituations: situations.length,
      totalNetAPayer,
      totalEncaisse,
      restantAEncaisser: totalNetAPayer - totalEncaisse,
    };
  }
}