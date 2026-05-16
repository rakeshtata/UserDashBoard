import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';
import { UserResolver } from '../src/app.resolver';
import { UserService, RedisCacheService } from '../src/app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/schemas/user.schema';

describe('GraphQL (e2e isolation)', () => {
  let app: INestApplication;
  let userService: UserService;
  let cacheManager: RedisCacheService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
        }),
      ],
      providers: [
        UserResolver,
        {
          provide: UserService,
          useValue: {
            getUsers: jest
              .fn()
              .mockResolvedValue([{ name: 'Test User', gender: 'M', age: 30 }]),
          },
        },
        {
          provide: RedisCacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GraphQL users query', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ users { name } }',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.users).toBeDefined();
        expect(res.body.data.users[0].name).toBe('Test User');
      });
  });
});
