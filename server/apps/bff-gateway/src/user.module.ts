import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UserResolver, ActivityResolver } from './app.resolver';
import { ActivityService, UserGatewayService } from './app.service';
import { UserRestAdapter } from './user-rest.adapter';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [UserGatewayService, ActivityService, UserResolver, ActivityResolver, UserRestAdapter],
  exports: [UserGatewayService, ActivityService],
})
export class UserGatewayModule {}
