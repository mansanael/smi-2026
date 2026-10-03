import { Controller, Post, Body, Get, Patch, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { UpdateProfilDto } from '../utilisateurs/dto/update-profil.dto';
import { ChangerMotDePasseDto } from '../utilisateurs/dto/changer-mot-de-passe.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UtilisateurCourant } from './decorators/utilisateur-courant.decorator';
import { UtilisateursService } from '../utilisateurs/utilisateurs.service';
import { CreateUtilisateurDto } from '../utilisateurs/dto/create-utilisateur.dto';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly utilisateursService: UtilisateursService,
  ) { }

  /**
   * POST /api/auth/login
   * Corps : { email, motDePasse }
   * Retourne : { access_token, utilisateur }
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * POST /api/auth/register-initial
   * Crée le premier utilisateur (Directeur Général) sans authentification.
   * ⚠️ Bloqué automatiquement si un utilisateur existe déjà en base.
   */
  @Post('register-initial')
  async registerInitial(@Body() dto: CreateUtilisateurDto) {
    const utilisateurs = await this.utilisateursService.findAll();
    if (utilisateurs.length > 0) {
      return {
        message: 'Un administrateur existe déjà. Utilisez /api/auth/login pour vous connecter.',
      };
    }
    // Force le rôle DG pour le premier compte
    dto.role = RoleUtilisateur.DIRECTEUR_GENERAL;
    const utilisateur = await this.utilisateursService.create(dto);
    return {
      message: 'Compte administrateur créé avec succès.',
      utilisateur,
    };
  }

  /**
   * GET /api/auth/me
   * Retourne l'utilisateur actuellement connecté (décodé du JWT)
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@UtilisateurCourant() user: any) {
    return this.utilisateursService.findOneById(user.id);
  }
  /**
   * PATCH /api/auth/profil
   * Modifie son propre profil (nom, prénom, téléphone, poste)
   */
  @UseGuards(JwtAuthGuard)
  @Patch('profil')
  updateProfil(@UtilisateurCourant() user: any, @Body() dto: UpdateProfilDto) {
    return this.utilisateursService.updateProfil(user.id, dto);
  }

  /**
   * PATCH /api/auth/mot-de-passe
   * Change son propre mot de passe (ancien mot de passe requis)
   */
  @UseGuards(JwtAuthGuard)
  @Patch('mot-de-passe')
  changerMotDePasse(@UtilisateurCourant() user: any, @Body() dto: ChangerMotDePasseDto) {
    return this.utilisateursService.changerMotDePasse(user.id, dto.ancienMotDePasse, dto.nouveauMotDePasse);
  }
}

