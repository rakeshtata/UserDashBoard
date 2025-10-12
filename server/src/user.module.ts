import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
//import { UserController, ActivityController } from './app.controller';
import { UserResolver,ActivityResolver } from './app.resolver';
import { UserService, ActivityService, RedisCacheService } from './app.service';
import { CacheModule } from '@nestjs/cache-manager';
import Redis from 'ioredis';
import * as redisStore from 'cache-manager-redis-store';
import { Logger } from '@nestjs/common';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    CacheModule.registerAsync({
                useFactory: async () => {
                let retryCount = 0;
                const maxRetries = 3;
                const redisHost = process.env.REDIS_HOST || '172.18.0.1';
                const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
                const redisClient = new Redis({
                  host: redisHost,
                  port: redisPort,
                  retryStrategy: (times) => {
                    retryCount++;
                    if (retryCount > maxRetries) {
                      Logger.error('Max Redis retry attempts reached', '', 'Redis');
                      return null; // Stop retrying
                    }
                    Logger.warn(`Redis retry attempt #${retryCount}`, 'Redis');
                    return Math.min(times * 100, 2000); // Wait before next retry
                  },
                });

                redisClient.on('connect', () => {
                  Logger.log('Redis connection established', 'Redis');
                });

                redisClient.on('error', (err) => {
                  Logger.error('Redis connection failed: ' + err.message, '', 'Redis');
                });

                return {
                  store: redisStore,
                  redisInstance: redisClient,
                  ttl: 60000,
                };
              },
              
            }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
    }),
  ],
  
  controllers: [],
  providers: [ UserService, ActivityService, RedisCacheService,UserResolver,ActivityResolver],
})
export class UsersModule {}