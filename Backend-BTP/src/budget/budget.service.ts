import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LigneDevis } from './entities/ligne-devis.entity';
import { Depense, TypeDepense } from './entities/depense.entity';
import { Avenant, StatutAvenant } from './entities/avenant.entity';
import { CreateLigneDevisDto } from './dto/create-ligne-devis.dto';
import { CreateDepenseDto } from './dto/create-depense.dto';
import { CreateAvenantDto } from './dto/create-avenant.dto';

@Injectable()
export class BudgetService {
  constructor(
    @InjectRepository(LigneDevis) private ligneDevisRepo: Repository<LigneDevis>,
    @InjectRepository(Depense) private depenseRepo: Repository<Depense>,
    @InjectRepository(Avenant) private avenantRepo: Repository<Avenant>,
  ) { }

  // ─── DEVIS ────────────────────────────────────────────────────────────────
  async addLigneDevis(projetId: string, dto: CreateLigneDevisDto): Promise<LigneDevis> {
    const montantHT = dto.quantite * dto.prixUnitaire;
    const ligne = this.ligneDevisRepo.create({ ...dto, montantHT, projet: { id: projetId } as any });
    return this.ligneDevisRepo.save(ligne);
  }

  async getDevis(projetId: string): Promise<LigneDevis[]> {
    return this.ligneDevisRepo.find({ where: { projet: { id: projetId } }, order: { rubrique: 'ASC', ordre: 'ASC' } });
  }

  // ─── DÉPENSES ─────────────────────────────────────────────────────────────
  async addDepense(projetId: string, dto: CreateDepenseDto): Promise<Depense> {
    const depense = this.depenseRepo.create({ ...dto, projet: { id: projetId } as any });
    return this.depenseRepo.save(depense);
  }

  async getDepenses(projetId: string): Promise<Depense[]> {
    return this.depenseRepo.find({ where: { projet: { id: projetId } }, order: { date: 'DESC' } });
  }

  // ─── AVENANTS ─────────────────────────────────────────────────────────────
  async addAvenant(projetId: string, dto: CreateAvenantDto): Promise<Avenant> {
    const avenant = this.avenantRepo.create({ ...dto, projet: { id: projetId } as any });
    return this.avenantRepo.save(avenant);
  }

  async getAvenants(projetId: string): Promise<Avenant[]> {
    return this.avenantRepo.find({ where: { projet: { id: projetId } }, order: { numero: 'ASC' } });
  }

  // ─── KPI BUDGÉTAIRES (CDC §5.3) ───────────────────────────────────────────
  async getKpiBudget(projetId: string, montantMarche: number) {
    const lignes = await this.ligneDevisRepo.find({ where: { projet: { id: projetId } } });
    const depenses = await this.depenseRepo.find({ where: { projet: { id: projetId } } });
    const avenants = await this.avenantRepo.find({
      where: { projet: { id: projetId }, statut: StatutAvenant.APPROUVE },
    });

    const budgetInitial = montantMarche;
    const montantDevise = lignes.reduce((s, l) => s + Number(l.montantHT), 0);
    const totalAvenants = avenants.reduce((s, a) => s + Number(a.montant), 0);
    const budgetRevise = budgetInitial + totalAvenants;

    const depensesEngagees = depenses
      .filter(d => d.type === TypeDepense.ENGAGEMENT)
      .reduce((s, d) => s + Number(d.montant), 0);

    const depensesRealisees = depenses
      .filter(d => d.type === TypeDepense.REALISATION)
      .reduce((s, d) => s + Number(d.montant), 0);

    const resteADepenser = budgetRevise - depensesEngagees;
    const tauxConsommation = budgetRevise > 0 ? (depensesRealisees / budgetRevise) * 100 : 0;

    return {
      // champs utilisés par la page Budget
      montantMarche: budgetRevise,
      montantDevise,
      montantDepense: depensesRealisees,
      budgetInitial,
      totalAvenants,
      budgetRevise,
      depensesEngagees,
      depensesRealisees,
      resteADepenser,
      tauxConsommation: Math.round(tauxConsommation * 100) / 100,
      alertes: {
        depassement: depensesRealisees > budgetRevise,
        riskDepassement: depensesEngagees > budgetRevise * 0.8,
        resteNegatif: resteADepenser < 0,
      },
    };
  }
}
