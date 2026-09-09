import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

let cachedApp: any;

async function bootstrap() {
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

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    cachedApp = app;
  }

  return cachedApp;
}

export default async function handler(req: any, res: any) {
  const app = await bootstrap();
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp(req, res);
}
