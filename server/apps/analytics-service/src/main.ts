import { NestFactory } from '@nestjs/core';
import { AnalyticsModule } from './analytics.module';

async function bootstrap() {
  const app = await NestFactory.create(AnalyticsModule);
  await app.listen(4003);
  console.log(`Analytics microservice is listening on REST port 4003`);
}
bootstrap();
