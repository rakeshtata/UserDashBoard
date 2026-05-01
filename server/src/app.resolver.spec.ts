import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver, ActivityResolver } from './app.resolver';
import { UserService, ActivityService, RedisCacheService } from './app.service';
import { NotFoundException } from '@nestjs/common';

describe('UserResolver', () => {
  let resolver: UserResolver;
  let userService: UserService;
  let cacheManager: RedisCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        {
          provide: UserService,
          useValue: {
            getUsers: jest.fn(),
            addUser: jest.fn(),
            editUser: jest.fn(),
            deleteUser: jest.fn(),
          },
        },
        {
          provide: RedisCacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<UserResolver>(UserResolver);
    userService = module.get<UserService>(UserService);
    cacheManager = module.get<RedisCacheService>(RedisCacheService);
  });

  describe('users', () => {
    it('should return cached users if available', async () => {
      const cachedUsers = [{ name: 'Cached' }];
      (cacheManager.get as jest.Mock).mockResolvedValue(cachedUsers);

      const result = await resolver.users();
      expect(result).toEqual(cachedUsers);
      expect(userService.getUsers).not.toHaveBeenCalled();
    });

    it('should fetch from service and cache if not in cache', async () => {
      const dbUsers = [{ name: 'DB' }];
      (cacheManager.get as jest.Mock).mockResolvedValue(null);
      (userService.getUsers as jest.Mock).mockResolvedValue(dbUsers);

      const result = await resolver.users();
      expect(result).toEqual(dbUsers);
      expect(userService.getUsers).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith('data', dbUsers);
    });

    it('should throw NotFoundException if no users found', async () => {
      (cacheManager.get as jest.Mock).mockResolvedValue(null);
      (userService.getUsers as jest.Mock).mockResolvedValue(null);

      await expect(resolver.users()).rejects.toThrow(NotFoundException);
    });
  });

  describe('addUser', () => {
    it('should add user via service', async () => {
      const input = { name: 'New', gender: 'M', age: 30 };
      const createdUser = { ...input, id: '1' };
      (userService.addUser as jest.Mock).mockResolvedValue(createdUser);

      const result = await resolver.addUser(input);
      expect(result).toEqual(createdUser);
      expect(userService.addUser).toHaveBeenCalledWith(input);
    });
  });
});

describe('ActivityResolver', () => {
  let resolver: ActivityResolver;
  let activityService: ActivityService;
  let cacheManager: RedisCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityResolver,
        {
          provide: ActivityService,
          useValue: {
            getActivities: jest.fn(),
          },
        },
        {
          provide: RedisCacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<ActivityResolver>(ActivityResolver);
    activityService = module.get<ActivityService>(ActivityService);
    cacheManager = module.get<RedisCacheService>(RedisCacheService);
  });

  describe('activities', () => {
    it('should return cached activities', async () => {
      const cached = [{ action: 'login' }];
      (cacheManager.get as jest.Mock).mockResolvedValue(cached);

      const result = await resolver.activities('1');
      expect(result).toEqual(cached);
      expect(activityService.getActivities).not.toHaveBeenCalled();
    });

    it('should fetch from service and cache', async () => {
      const activities = [{ action: 'logout' }];
      (cacheManager.get as jest.Mock).mockResolvedValue(null);
      (activityService.getActivities as jest.Mock).mockResolvedValue(activities);

      const result = await resolver.activities('1');
      expect(result).toEqual(activities);
      expect(cacheManager.set).toHaveBeenCalledWith('activity1', activities);
    });
  });
});
