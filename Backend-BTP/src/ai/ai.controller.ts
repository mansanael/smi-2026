// src/ai/ai.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Delete,
  Query,
} from '@nestjs/common';
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

@Controller('ai') // Le préfixe global "api" (défini dans vercel.ts / main.ts) donne déjà /api/ai/*
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

  @Post('chat/stream')
  // eslint-disable-next-line @typescript-eslint/require-await
  async chatStream(
    @Body() body: ChatRequestDto,
    @UtilisateurCourant() user: JwtUser,
  ) {
    return this.aiService.chatStream(body.messages, user, body.projetId);
  }

  @Get('history')
  // eslint-disable-next-line @typescript-eslint/require-await
  async getHistory(
    @Query('projetId') projetId: string,
    @Query('limit') limit: string,
    @UtilisateurCourant() user: JwtUser,
  ) {
    return this.aiService.getHistory(
      user,
      projetId,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Delete('history')
  // eslint-disable-next-line @typescript-eslint/require-await
  async deleteHistory(
    @Query('projetId') projetId: string,
    @UtilisateurCourant() user: JwtUser,
  ) {
    return this.aiService.deleteHistory(user, projetId);
  }
}
