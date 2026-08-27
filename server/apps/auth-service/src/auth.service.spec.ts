import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { AuthService } from './auth.service';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('AuthService', () => {
  let service: AuthService;
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: { sign: jest.fn(() => 'test-token') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('uses the local JSON server URL by default for validation', async () => {
    mockedAxios.get.mockResolvedValue({ data: { username: 'admin', password: 'password', userId: 1 } });

    await service.validateUser('admin', 'password');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://localhost:8000/auth/admin',
      expect.objectContaining({ headers: { connection: 'keep-alive' } }),
    );
  });

  it('falls back to the container JSON server URL when localhost is unavailable', async () => {
    mockedAxios.get
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce({ data: { username: 'admin', password: 'password', userId: 1 } });

    await service.validateUser('admin', 'password');

    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      1,
      'http://localhost:8000/auth/admin',
      expect.objectContaining({ headers: { connection: 'keep-alive' } }),
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      'http://jsonServer-app:8000/auth/admin',
      expect.objectContaining({ headers: { connection: 'keep-alive' } }),
    );
  });
});
