import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UtilisateurCourant } from '../auth/decorators/utilisateur-courant.decorator';
import { RoleUtilisateur } from '../utilisateurs/entities/utilisateur.entity';

interface ChatMessageDto {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestDto {
  messages: ChatMessageDto[];
  projetId?: string;
}

type JwtUser = {
  id: string;
  email: string;
  role: RoleUtilisateur;
  nom: string;
  prenom: string;
};

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(
    @Body() body: ChatRequestDto,
    @UtilisateurCourant() user: JwtUser,
  ) {
    return this.aiService.chat(body.messages, user, body.projetId);
  }
}
