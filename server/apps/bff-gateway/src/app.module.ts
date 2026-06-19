import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './user.module';
import { AuthModule } from './auth/auth.module';
import { AnalyticsGateway } from './analytics.gateway';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'apps/bff-gateway/src/schemas/schema.gql'),
      sortSchema: true,
      playground: true,
    }),
  ],
  controllers: [],
  providers: [AnalyticsGateway],
})
export class AppModule {}
