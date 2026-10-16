import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoteVocale } from './entities/note-vocale.entity';
import { TranscriptionService } from './transcription.service';
import { NotesVocalesService } from './notes-vocales.service';
import { NotesVocalesController, TranscriptionController } from './voix.controller';

// Commande vocale : transcription (Whisper via Groq) et notes vocales de chantier
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([NoteVocale])],
  controllers: [TranscriptionController, NotesVocalesController],
  providers: [TranscriptionService, NotesVocalesService],
  exports: [TranscriptionService, NotesVocalesService],
})
export class VoixModule {}
