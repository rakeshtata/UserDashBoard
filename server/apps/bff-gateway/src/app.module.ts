import { Module } from '@nestjs/common';
import { UserGatewayModule } from './user.module';
import { AuthModule } from './auth/auth.module';
import { AnalyticsGateway } from './analytics.gateway';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppController } from './app.controller';

@Module({
  imports: [
    UserGatewayModule,
    AuthModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'apps/bff-gateway/src/schemas/schema.gql'),
      sortSchema: true,
      playground: true,
    }),
  ],
  controllers: [AppController],
  providers: [AnalyticsGateway],
})
export class AppModule {}
