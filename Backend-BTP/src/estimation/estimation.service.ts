import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RatioDevis } from './ratio-devis.entity';
import { calculerEstimation, Estimation, Finition, RATIOS_PAR_DEFAUT, RatioLot, Taux } from './estimation.calcul';
import { ParametresService } from '../parametres/parametres.service';
import { AnalyseChantierService, ParametresDevis } from '../voix/analyse-chantier.service';
import { BudgetService } from '../budget/budget.service';
import { RubriqueDevis } from '../budget/entities/ligne-devis.entity';

export interface Bareme {
  lots: RatioLot[];
  taux: Taux;
}

@Injectable()
export class EstimationService {
  constructor(
    @InjectRepository(RatioDevis) private readonly ratioRepo: Repository<RatioDevis>,
    private readonly parametres: ParametresService,
    private readonly analyse: AnalyseChantierService,
    private readonly budget: BudgetService,
  ) {}

  // Première utilisation : la table est remplie avec les prix d'exemple
  async getBareme(): Promise<Bareme> {
    let lots = await this.ratioRepo.find({ order: { ordre: 'ASC' } });
    if (lots.length === 0) lots = await this.ratioRepo.save(RATIOS_PAR_DEFAUT.map((r) => this.ratioRepo.create(r)));
    const { tauxImprevus, tauxPartEntreprise, tauxTva } = await this.parametres.get();
    return { lots, taux: { tauxImprevus, tauxPartEntreprise, tauxTva } };
  }

  // Les lots se modifient par leur prix ; on n'ajoute ni ne supprime de lot ici
  async updateBareme(lots: Pick<RatioLot, 'code' | 'prixEconomique' | 'prixStandard' | 'prixHautStanding'>[], taux: Taux): Promise<Bareme> {
    const existants = new Map((await this.getBareme()).lots.map((l) => [l.code, l]));
    const inconnus = lots.filter((l) => !existants.has(l.code)).map((l) => l.code);
    if (inconnus.length) throw new BadRequestException(`Lot inconnu : ${inconnus.join(', ')}`);
    await this.ratioRepo.save(lots.map((l) => ({ ...existants.get(l.code), ...l })));
    await this.parametres.update(taux);
    return this.getBareme();
  }

  async calculer(surfaceM2: number, finition: Finition): Promise<Estimation> {
    const { lots, taux } = await this.getBareme();
    return calculerEstimation(lots, taux, surfaceM2, finition);
  }

  /** La phrase est lue par l'IA ; l'estimation est calculée avec les prix de l'entreprise */
  async analyser(description: string): Promise<{ parametres: ParametresDevis; finitionSupposee: boolean; estimation: Estimation | null }> {
    const parametres = await this.analyse.extraireParametresDevis(description);
    const finition = parametres.finition ?? 'standard';
    return {
      parametres,
      finitionSupposee: parametres.finition === null,
      estimation: parametres.surfaceM2 ? await this.calculer(parametres.surfaceM2, finition) : null,
    };
  }

  /** Transforme l'estimation en lignes de devis du chantier (modifiables ensuite comme les autres) */
  async creerDevis(projetId: string, surfaceM2: number, finition: Finition) {
    const e = await this.calculer(surfaceM2, finition);
    const libelleFinition = { economique: 'économique', standard: 'standard', haut_standing: 'haut standing' }[finition];
    const lignes = [
      ...e.lots.map((l, i) => ({
        rubrique: RubriqueDevis.MATERIAUX,
        designation: `${l.libelle} — fourniture et pose (estimation, finition ${libelleFinition})`,
        unite: 'm²',
        quantite: surfaceM2,
        prixUnitaire: l.prixM2,
        lot: l.libelle,
        ordre: i + 1,
      })),
      { rubrique: RubriqueDevis.IMPREVUS, designation: `Imprévus (${e.taux.tauxImprevus} % des travaux)`, unite: 'forfait', quantite: 1, prixUnitaire: e.imprevus, ordre: 1 },
      { rubrique: RubriqueDevis.FRAIS_GENERAUX, designation: `Frais généraux et bénéfice (${e.taux.tauxPartEntreprise} % des travaux)`, unite: 'forfait', quantite: 1, prixUnitaire: e.partEntreprise, ordre: 1 },
    ];
    for (const ligne of lignes) await this.budget.addLigneDevis(projetId, ligne);
    return { lignesCreees: lignes.length, estimation: e };
  }
}
