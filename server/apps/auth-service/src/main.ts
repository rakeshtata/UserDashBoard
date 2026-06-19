import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  await app.listen(4001);
  console.log(`Auth microservice is listening on REST port 4001`);
}
bootstrap();
