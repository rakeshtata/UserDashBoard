import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';

async function bootstrap() {
  const app = await NestFactory.create(UserModule);
  await app.listen(4002);
  console.log(`User microservice is listening on REST port 4002`);
}
bootstrap();
