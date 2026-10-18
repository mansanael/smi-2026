import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { UtilisateursService } from '../utilisateurs/utilisateurs.service';
import { LoginDto } from './dto/login.dto';
import { Alerte, GraviteAlerte, TypeAlerte } from '../ai/alerte.entity';

// Durée de la session quand l'utilisateur coche « Se souvenir de moi »
export const DUREE_SESSION_MEMORISEE = '30d';

// Même réponse que l'email existe ou non : on ne révèle pas quels comptes existent
export const REPONSE_MOT_DE_PASSE_OUBLIE = {
  message: 'Si ce compte existe, la direction a été prévenue. Elle vous donnera un nouveau mot de passe.',
};

@Injectable()
export class AuthService {
  constructor(
    private readonly utilisateursService: UtilisateursService,
    private readonly jwtService: JwtService,
    @InjectRepository(Alerte) private readonly alerteRepo: Repository<Alerte>,
  ) { }

  async login(dto: LoginDto) {
    // Récupère l'utilisateur avec son mot de passe hashé
    const utilisateur = await this.utilisateursService.findByEmailAvecMotDePasse(dto.email);

    if (!utilisateur) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    const motDePasseValide = await utilisateur.verifierMotDePasse(dto.motDePasse);
    if (!motDePasseValide) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    // Payload JWT
    const payload = {
      sub: utilisateur.id,
      email: utilisateur.email,
      role: utilisateur.role,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
    };

    return {
      access_token: dto.seSouvenir
        ? this.jwtService.sign(payload, { expiresIn: DUREE_SESSION_MEMORISEE })
        : this.jwtService.sign(payload),
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        role: utilisateur.role,
        telephone: utilisateur.telephone,
        poste: utilisateur.poste,
        photo: utilisateur.photo,
      },
    };
  }

  /**
   * « Mot de passe oublié » sans envoi d'email : une alerte prévient la direction (DG, DT),
   * qui donne un nouveau mot de passe depuis Administration.
   * Une seule alerte par compte et par jour, pour éviter les doublons.
   */
  async demanderReinitialisation(email: string) {
    const utilisateur = await this.utilisateursService.findByEmailAvecMotDePasse(email);
    if (!utilisateur) return REPONSE_MOT_DE_PASSE_OUBLIE;

    const message =
      `🔑 ${utilisateur.prenom} ${utilisateur.nom} (${utilisateur.email}) a oublié son mot de passe. ` +
      'Donnez-lui un nouveau mot de passe dans Administration.';
    const dejaSignale = await this.alerteRepo.exists({
      where: {
        type: TypeAlerte.DEMANDE_MOT_DE_PASSE,
        message,
        lu: false,
        creeLe: MoreThan(new Date(Date.now() - 24 * 3600 * 1000)),
      },
    });
    if (!dejaSignale) {
      await this.alerteRepo.save(this.alerteRepo.create({
        type: TypeAlerte.DEMANDE_MOT_DE_PASSE,
        gravite: GraviteAlerte.INFO,
        message,
      }));
    }
    return REPONSE_MOT_DE_PASSE_OUBLIE;
  }
}
