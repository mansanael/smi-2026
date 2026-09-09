import { NestFactory } from '@nestjs/core';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';

let cachedApp: INestApplication | undefined;

async function bootstrap(): Promise<INestApplication> {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule);

    // CORS — autorise le frontend React (dev: 5173, prod: configurable)
    app.enableCors({
      origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });

    // Préfixe global : toutes les routes → /api/*
    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    // Indispensable en serverless : initialise réellement l'adaptateur HTTP
    // (branche les routes des contrôleurs sur l'instance Express interne).
    // Sans ça, l'app est instanciée mais Express ne connaît aucune route,
    // d'où l'erreur "Cannot POST /api/..." même si tout compile sans erreur.
    await app.init();

    cachedApp = app;
  }

  return cachedApp;
}

export default async function handler(
  req: unknown,
  res: unknown,
): Promise<void> {
  const app = await bootstrap();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const expressApp = app.getHttpAdapter().getInstance();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  expressApp(req, res);
}
