import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver, ActivityResolver } from './app.resolver';
import { UserGatewayService, ActivityService } from './app.service';
import { UserRestAdapter } from './user-rest.adapter';

describe('UserResolver', () => {
  let resolver: UserResolver;
  let userService: UserGatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        {
          provide: UserGatewayService,
          useValue: {
            getUsers: jest.fn(),
            addUser: jest.fn(),
            editUser: jest.fn(),
            deleteUser: jest.fn(),
          },
        },
        {
          provide: UserRestAdapter,
          useValue: {
            toCreatePayload: jest.fn((input) => input),
            toUpdatePayload: jest.fn((id, input) => ({ id, ...input })),
          },
        },
      ],
    }).compile();

    resolver = module.get<UserResolver>(UserResolver);
    userService = module.get<UserGatewayService>(UserGatewayService);
  });

  it('should return users from the downstream REST service', async () => {
    const users = [{ name: 'DB' }];
    (userService.getUsers as jest.Mock).mockResolvedValue(users);

    const result = await resolver.users();
    expect(result).toEqual(users);
    expect(userService.getUsers).toHaveBeenCalled();
  });

  it('should add user via the downstream REST service', async () => {
    const input = { name: 'New', gender: 'M', age: 30 };
    const createdUser = { ...input, id: '1' };
    (userService.addUser as jest.Mock).mockResolvedValue(createdUser);

    const result = await resolver.addUser(input);
    expect(result).toEqual(createdUser);
    expect(userService.addUser).toHaveBeenCalledWith(input);
  });

  it('should edit user via the downstream REST service', async () => {
    const input = { name: 'Updated', gender: 'F', age: 31 };
    const updatedUser = { ...input, id: '1' };
    (userService.editUser as jest.Mock).mockResolvedValue(updatedUser);

    const result = await resolver.editUser('1', input);
    expect(result).toEqual(updatedUser);
    expect(userService.editUser).toHaveBeenCalledWith({ ...input, id: '1' });
  });

  it('should delete user via the downstream REST service', async () => {
    const deletedUser = { id: '1', name: 'Deleted' };
    (userService.deleteUser as jest.Mock).mockResolvedValue(deletedUser);

    const result = await resolver.deleteUser('1');
    expect(result).toEqual(deletedUser);
    expect(userService.deleteUser).toHaveBeenCalledWith({ id: '1' });
  });
});

describe('ActivityResolver', () => {
  let resolver: ActivityResolver;
  let activityService: ActivityService;

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
      ],
    }).compile();

    resolver = module.get<ActivityResolver>(ActivityResolver);
    activityService = module.get<ActivityService>(ActivityService);
  });

  it('should return activities from the downstream REST service', async () => {
    const activities = [{ action: 'logout' }];
    (activityService.getActivities as jest.Mock).mockResolvedValue(activities);

    const result = await resolver.activities('1');
    expect(result).toEqual(activities);
    expect(activityService.getActivities).toHaveBeenCalledWith({ id: '1' });
  });
});
