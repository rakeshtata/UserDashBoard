import { Test, TestingModule } from '@nestjs/testing';
import { UserService, ActivityService } from './app.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('UserService', () => {
  let service: UserService;

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUser', () => {
    it('should call httpService.get and return user data', async () => {
      const mockUser = { id: '1', name: 'John' };
      mockHttpService.get.mockReturnValue(of({ data: mockUser }));

      const result = await service.getUser({ id: '1' });
      expect(result).toEqual(mockUser);
      expect(mockHttpService.get).toHaveBeenCalledWith('http://localhost:4002/users/1');
    });
  });

  describe('getUsers', () => {
    it('should call httpService.get and return list of users', async () => {
      const mockUsers = [{ id: '1', name: 'John' }];
      mockHttpService.get.mockReturnValue(of({ data: { users: mockUsers } }));

      const result = await service.getUsers();
      expect(result).toEqual(mockUsers);
      expect(mockHttpService.get).toHaveBeenCalledWith('http://localhost:4002/users');
    });
  });

  describe('addUser', () => {
    it('should call httpService.post and return new user data', async () => {
      const userData = { name: 'New User', gender: 'M', age: 25 };
      const responseData = { ...userData, id: '123' };
      mockHttpService.post.mockReturnValue(of({ data: responseData }));

      const result = await service.addUser(userData);
      expect(result).toEqual(responseData);
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://localhost:4002/users',
        userData,
      );
    });
  });

  describe('editUser', () => {
    it('should call httpService.put and return updated user data', async () => {
      const userData = { id: '123', name: 'Updated User', gender: 'M', age: 26 };
      mockHttpService.put.mockReturnValue(of({ data: userData }));

      const result = await service.editUser(userData);
      expect(result).toEqual(userData);
      expect(mockHttpService.put).toHaveBeenCalledWith(
        'http://localhost:4002/users/123',
        { name: 'Updated User', gender: 'M', age: 26 },
      );
    });
  });

  describe('deleteUser', () => {
    it('should call httpService.delete and return success status', async () => {
      mockHttpService.delete.mockReturnValue(of({ data: { success: true } }));

      const result = await service.deleteUser({ id: '123' });
      expect(result).toEqual({ success: true });
      expect(mockHttpService.delete).toHaveBeenCalledWith('http://localhost:4002/users/123');
    });
  });
});

describe('ActivityService', () => {
  let service: ActivityService;

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getActivities', () => {
    it('should fetch activities and return them', async () => {
      const mockActivities = [{ id: 1, action: 'login' }];
      mockHttpService.get.mockReturnValue(
        of({ data: { activities: mockActivities } }),
      );

      const result = await service.getActivities({ id: '1' });
      expect(result).toEqual(mockActivities);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'http://localhost:4003/analytics/activities/1',
      );
    });
  });

  describe('streamActivities', () => {
    it('should call httpService.get with stream response type', () => {
      const mockObservable = of({});
      mockHttpService.get.mockReturnValue(mockObservable);

      const result = service.streamActivities({ id: '1' });
      expect(result).toBeDefined();

      const sub = result.subscribe();
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'http://localhost:4003/analytics/stream/1',
        expect.objectContaining({ responseType: 'stream' }),
      );
      sub.unsubscribe();
    });
  });
});
