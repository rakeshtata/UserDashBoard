import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { AuthenicatorService } from '../app.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let authenticatorService: AuthenicatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test_token'),
          },
        },
        {
          provide: AuthenicatorService,
          useValue: {
            getAuthentication: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    authenticatorService = module.get<AuthenicatorService>(AuthenicatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if credentials match', async () => {
      const mockUser = { name: 'testuser', password: 'testpassword', userId: '1' };
      (authenticatorService.getAuthentication as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.validateUser('testuser', 'testpassword');
      expect(result).toEqual({ name: 'testuser', userId: '1' });
      expect(result.password).toBeUndefined();
    });

    it('should return null if password does not match', async () => {
      const mockUser = { name: 'testuser', password: 'wrongpassword', userId: '1' };
      (authenticatorService.getAuthentication as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.validateUser('testuser', 'testpassword');
      expect(result).toBeNull();
    });

    it('should return null if user is not found', async () => {
      (authenticatorService.getAuthentication as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'pass');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return an access token', async () => {
      const user = { username: 'testuser', userId: '1' };
      const result = await service.login(user);
      expect(result).toEqual({ access_token: 'test_token' });
      expect(jwtService.sign).toHaveBeenCalledWith({ username: 'testuser', sub: '1' });
    });
  });
});
