import { AiContextService } from './ai-context.service';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';

const user = (role: RoleUtilisateur) => ({ id: 'u', email: 'u@test.sn', nom: 'Test', prenom: 'U', role });

function creerService(aAcces: boolean) {
  const dashboardService = { getDashboardGlobal: jest.fn().mockResolvedValue({}) };
  const planningService = { findTachesProjet: jest.fn().mockResolvedValue([]) };
  const approService = { getStockChantier: jest.fn().mockResolvedValue([]), getBonsCommande: jest.fn().mockResolvedValue([]) };
  const paiementsService = { getSuivi: jest.fn().mockResolvedValue({ echeances: [], paiements: [] }) };
  const notesVocalesService = {
    findAll: jest.fn().mockResolvedValue([]),
    findDuJour: jest.fn().mockResolvedValue([]),
  };
  const acces = {
    aAcces: jest.fn().mockResolvedValue(aAcces),
    projetIdsAutorises: jest.fn().mockResolvedValue(['p1']),
  };
  const service = new AiContextService(
    dashboardService as any, {} as any, {} as any, planningService as any, {} as any,
    {} as any, {} as any, approService as any, {} as any, {} as any, acces as any, paiementsService as any,
    notesVocalesService as any,
  );
  return { service, dashboardService, planningService, paiementsService, notesVocalesService };
}

describe('AiContextService.executeTool — droits d’accès', () => {
  it('refuse les données d’un projet non autorisé', async () => {
    const { service, planningService } = creerService(false);
    const res = JSON.parse(await service.executeTool('get_project_tasks', { projetId: 'p2' }, user(RoleUtilisateur.CHEF_PROJET)));
    expect(res.error).toBeDefined();
    expect(planningService.findTachesProjet).not.toHaveBeenCalled();
  });

  it('répond sur un projet autorisé', async () => {
    const { service, planningService } = creerService(true);
    await service.executeTool('get_project_tasks', { projetId: 'p1' }, user(RoleUtilisateur.CHEF_PROJET));
    expect(planningService.findTachesProjet).toHaveBeenCalledWith('p1');
  });

  it('limite le portefeuille aux projets accessibles', async () => {
    const { service, dashboardService } = creerService(true);
    await service.executeTool('get_portfolio', {}, user(RoleUtilisateur.CHEF_PROJET));
    expect(dashboardService.getDashboardGlobal).toHaveBeenCalledWith(['p1']);
  });

  it('le client peut demander les paiements de son chantier', async () => {
    const { service, paiementsService } = creerService(true);
    await service.executeTool('get_project_payments', { projetId: 'p1' }, user(RoleUtilisateur.MAITRE_OUVRAGE_EXTERNE));
    expect(paiementsService.getSuivi).toHaveBeenCalledWith('p1');
  });

  it('le conducteur de travaux n’a pas accès aux paiements', async () => {
    const { service, paiementsService } = creerService(true);
    const res = JSON.parse(await service.executeTool('get_project_payments', { projetId: 'p1' }, user(RoleUtilisateur.CONDUCTEUR_TRAVAUX)));
    expect(res.error).toBeDefined();
    expect(paiementsService.getSuivi).not.toHaveBeenCalled();
  });

  it('le client n’a pas accès au stock, même de son chantier', async () => {
    const { service } = creerService(true);
    const res = JSON.parse(await service.executeTool('get_project_stock', { projetId: 'p1' }, user(RoleUtilisateur.MAITRE_OUVRAGE_EXTERNE)));
    expect(res.error).toBeDefined();
  });

  it('le conducteur lit les notes vocales d’un jour précis', async () => {
    const { service, notesVocalesService } = creerService(true);
    await service.executeTool('get_project_voice_notes', { projetId: 'p1', date: '2026-10-16' }, user(RoleUtilisateur.CONDUCTEUR_TRAVAUX));
    expect(notesVocalesService.findDuJour).toHaveBeenCalledWith('p1', '2026-10-16');
  });

  it('le client ne lit pas les notes vocales internes', async () => {
    const { service, notesVocalesService } = creerService(true);
    const res = JSON.parse(await service.executeTool('get_project_voice_notes', { projetId: 'p1' }, user(RoleUtilisateur.MAITRE_OUVRAGE_EXTERNE)));
    expect(res.error).toBeDefined();
    expect(notesVocalesService.findAll).not.toHaveBeenCalled();
  });
});
