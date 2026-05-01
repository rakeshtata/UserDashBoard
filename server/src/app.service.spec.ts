import { Test, TestingModule } from '@nestjs/testing';
import { UserService, ActivityService } from './app.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('UserService', () => {
  let service: UserService;
  let model: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: {
            find: jest.fn().mockReturnThis(),
            exec: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    model = module.get(getModelToken(User.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUsers', () => {
    it('should return users from database', async () => {
      const mockUsers = [{ name: 'John' }];
      model.exec.mockResolvedValue(mockUsers);

      const result = await service.getUsers();
      expect(result).toEqual(mockUsers);
      expect(model.find).toHaveBeenCalled();
    });
  });

  describe('getUser', () => {
    it('should call axios get and return data', async () => {
      const mockUser = { id: '1', name: 'John' };
      mockedAxios.get.mockResolvedValue({ data: mockUser });

      const result = await service.getUser({ id: '1' });
      expect(result).toEqual(mockUser);
      expect(mockedAxios.get).toHaveBeenCalledWith('http://172.18.0.1:8000/data/1', expect.any(Object));
    });
  });

  describe('addUser', () => {
    it('should call axios post and return data', async () => {
      const userData = { name: 'New User', gender: 'M', age: 25 };
      mockedAxios.post.mockResolvedValue({ data: { ...userData, id: '123' } });

      const result = await service.addUser(userData);
      expect(result).toEqual({ ...userData, id: '123' });
      expect(mockedAxios.post).toHaveBeenCalledWith('http://:172.18.0.1:8000/data', userData);
    });
  });
});

describe('ActivityService', () => {
  let service: ActivityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivityService],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getActivities', () => {
    it('should fetch activities and return them', async () => {
      const mockActivities = [{ id: 1, action: 'login' }];
      mockedAxios.get.mockResolvedValue({ data: { activities: mockActivities } });

      const result = await service.getActivities({ id: '1' });
      expect(result).toEqual(mockActivities);
      // (1-1)%10 + 1 = 1
      expect(mockedAxios.get).toHaveBeenCalledWith('http://172.18.0.1:8000/data/1', expect.any(Object));
    });

    it('should handle id wrapping correctly', async () => {
        mockedAxios.get.mockResolvedValue({ data: { activities: [] } });
        
        await service.getActivities({ id: '11' });
        // (11-1)%10 + 1 = 1
        expect(mockedAxios.get).toHaveBeenCalledWith('http://172.18.0.1:8000/data/1', expect.any(Object));
    });

    it('should throw error for invalid id', () => {
      expect(() => service.getActivities({ id: 'abc' })).toThrow('Invalid id');
    });
  });
});
