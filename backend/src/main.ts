import './env-bootstrap';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 22379;
  await app.listen(port);
  console.log(`Backend server running on http://localhost:${port}`);
}

bootstrap();
