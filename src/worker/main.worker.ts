import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from 'src/worker/worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  const logger = new Logger('ZaloWorker');
  logger.log('Zalo worker bootstrapped (single-instance listener)');

  const shutdown = async (signal: string) => {
    logger.warn(`Received ${signal}, shutting down worker...`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch(error => {
  const logger = new Logger('ZaloWorker');
  logger.error(`Worker failed to start: ${String(error)}`);
  process.exit(1);
});
