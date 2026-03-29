import { Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { useContainer } from 'class-validator';
import { AppModule } from 'src/app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const apiPrefix = configService.get<string>('app.apiPrefix') ?? 'api';
  const apiVersion = configService.get<string>('app.apiVersion') ?? '1';
  const port = configService.get<number>('app.port') ?? 3000;

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: apiVersion,
  });

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Application is running on port ${port}`);
}

bootstrap();
