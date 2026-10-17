import 'reflect-metadata';
import { json } from 'express';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { ApiExceptionFilter } from './common/api-exception.filter.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  
  app.use(json({ limit: '12mb' }));

  
  const allowedOrigins = [
    'http://localhost:4200',
    process.env['CORS_ORIGIN'] 
  ].filter((origin): origin is string => Boolean(origin));

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new ApiExceptionFilter());

  const port = Number(process.env['PORT'] || 3001);

  await app.listen(port, '0.0.0.0');
  console.log(`Spendwise NestJS API listening on port ${port}`);
}

void bootstrap();