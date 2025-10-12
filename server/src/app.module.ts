import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
//import { UserController, ActivityController } from './app.controller';
import { UserResolver,ActivityResolver } from './app.resolver';
import { UserService, ActivityService, RedisCacheService } from './app.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import * as redisStore from 'cache-manager-redis-store';
import { MongooseModule } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import {UsersModule,} from './user.module';


@Module({
  imports: [
    //MongooseModule.forRoot('mongodb://admin:password@172.18.0.1/mydb?authSource=admin'),
    MongooseModule.forRootAsync({
      useFactory: async () => {
        let retries = 3;
        while (retries > 0) {
          try {
            return {
              uri: 'mongodb://admin:password@172.18.0.1/mydb?authSource=admin', // Your MongoDB connection string
            };
          } catch (error) {
            console.error(`Failed to connect to MongoDB. Retrying (${retries - 1} attempts left)...`, error);
            retries--;
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          }
        }
        throw new Error('Failed to connect to MongoDB after multiple retries.');
      },
    }),
    UsersModule       
  ],
  controllers: [],
  providers:  [],
})
export class AppModule {}
