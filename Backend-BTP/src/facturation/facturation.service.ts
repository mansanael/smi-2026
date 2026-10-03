import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SituationTravaux, TVA_TAUX, TCS_TAUX, RETENUE_GARANTIE, AVANCE_DEMARRAGE } from './entities/situation-travaux.entity';

@Injectable()
export class FacturationService {
  constructor(@InjectRepository(SituationTravaux) private situationRepo: Repository<SituationTravaux>) { }

  async createSituation(projetId: string, dto: any, montantMarche: number): Promise<SituationTravaux> {
    const montantHTNouveau = Number(dto.montantHTNouveau);
    const montantHTCumul = Number(dto.montantHTCumul);

    // Calculs automatiques conformes CDC §10.1 (marchés publics sénégalais)
    const avanceDeduire = montantHTNouveau * AVANCE_DEMARRAGE;
    const retenueGarantie = montantHTNouveau * RETENUE_GARANTIE;
    const montantTVA = montantHTNouveau * TVA_TAUX;
    const montantTCS = montantHTNouveau * TCS_TAUX;
    const netAPayer = montantHTNouveau - avanceDeduire - retenueGarantie + montantTVA - montantTCS;

    const situation = this.situationRepo.create({
      ...dto,
      projet: { id: projetId } as any,
      avanceDeduire: Math.round(avanceDeduire),
      retenueGarantie: Math.round(retenueGarantie),
      montantTVA: Math.round(montantTVA),
      montantTCS: Math.round(montantTCS),
      netAPayer: Math.round(netAPayer),
    });
    return this.situationRepo.save(situation) as unknown as SituationTravaux;
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
