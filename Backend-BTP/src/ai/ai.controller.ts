// src/ai/ai.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Delete,
  Patch,
  Param,
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

@Controller('api/ai') // ← Changement important : "api/ai"
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
  async chatStream(
    @Body() body: ChatRequestDto,
    @UtilisateurCourant() user: JwtUser,
  ) {
    return this.aiService.chatStream(body.messages, user, body.projetId);
  }

  @Get('history')
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
  async deleteHistory(
    @Query('projetId') projetId: string,
    @UtilisateurCourant() user: JwtUser,
  ) {
    return this.aiService.deleteHistory(user, projetId);
  }
} // src/ai/ai.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Delete,
  Patch,
  Param,
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

@Controller('api/ai') // ← Changement important : "api/ai"
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
  async chatStream(
    @Body() body: ChatRequestDto,
    @UtilisateurCourant() user: JwtUser,
  ) {
    return this.aiService.chatStream(body.messages, user, body.projetId);
  }

  @Get('history')
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
  async deleteHistory(
    @Query('projetId') projetId: string,
    @UtilisateurCourant() user: JwtUser,
  ) {
    return this.aiService.deleteHistory(user, projetId);
  }
}
