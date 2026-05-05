import * as dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}
import 'reflect-metadata';
import { initSentry } from './sentry';
initSentry();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:8081',
  ];
  app.enableCors({ origin: allowedOrigins });

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);

  console.log(`Server ready at http://localhost:${port}/graphql`);
  console.log(`Health check at http://localhost:${port}/health`);
}

bootstrap();
