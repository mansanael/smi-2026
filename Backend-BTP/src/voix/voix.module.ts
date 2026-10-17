import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoteVocale } from './entities/note-vocale.entity';
import { Alerte } from '../ai/alerte.entity';
import { Projet } from '../projets/entities/projet.entity';
import { TranscriptionService } from './transcription.service';
import { AnalyseChantierService } from './analyse-chantier.service';
import { NotesVocalesService } from './notes-vocales.service';
import { NotesVocalesController, TranscriptionController } from './voix.controller';

// Commande vocale : transcription (Whisper via Groq), notes vocales de chantier,
// détection des problèmes et compte rendu préparé par l'IA
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([NoteVocale, Alerte, Projet])],
  controllers: [TranscriptionController, NotesVocalesController],
  providers: [TranscriptionService, AnalyseChantierService, NotesVocalesService],
  exports: [TranscriptionService, NotesVocalesService, AnalyseChantierService],
})
export class VoixModule {}
