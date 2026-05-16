import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AnalyticsGateway } from './analytics.gateway';
import { ActivityService } from './app.service';
import { io, Socket as ClientSocket } from 'socket.io-client';

describe('AnalyticsGateway', () => {
  let gateway: AnalyticsGateway;
  let module: TestingModule;
  let app: INestApplication;
  let activityService: ActivityService;
  let clientSocket: ClientSocket;
  const port = 3001;
  const url = `http://localhost:${port}`;

  // Spies that need to be set up before gateway initialization
  let handleConnectionSpy: jest.SpyInstance;
  let handleDisconnectSpy: jest.SpyInstance;

  beforeAll(async () => {
    // Set up spies on the prototype so they catch calls even if Nest binds them
    handleConnectionSpy = jest.spyOn(AnalyticsGateway.prototype, 'handleConnection');
    handleDisconnectSpy = jest.spyOn(AnalyticsGateway.prototype, 'handleDisconnect');

    const mockActivityService = {
      getActivities: jest.fn().mockResolvedValue([
        { date: '2024-01-01', count: 10 },
        { date: '2024-01-02', count: 20 },
        { date: '2024-01-03', count: 30 },
      ]),
    };

    module = await Test.createTestingModule({
      providers: [
        AnalyticsGateway,
        {
          provide: ActivityService,
          useValue: mockActivityService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    gateway = module.get<AnalyticsGateway>(AnalyticsGateway);
    activityService = module.get<ActivityService>(ActivityService);

    await app.listen(port);
  });

  afterAll(async () => {
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }
    handleConnectionSpy.mockRestore();
    handleDisconnectSpy.mockRestore();
    await gateway.onModuleDestroy();
    await app.close();
  });

  beforeEach(() => {
    handleConnectionSpy.mockClear();
    handleDisconnectSpy.mockClear();
  });

  const ensureConnected = (): Promise<ClientSocket> => {
    return new Promise((resolve) => {
      if (clientSocket?.connected) {
        resolve(clientSocket);
        return;
      }
      clientSocket = io(url, {
        reconnection: true,
        reconnectionDelay: 10,
        reconnectionDelayMax: 100,
      });
      clientSocket.on('connect', () => {
        resolve(clientSocket);
      });
    });
  };

  describe('Gateway Initialization', () => {
    it('should initialize the gateway', async () => {
      const initSpy = jest.spyOn(gateway, 'afterInit');
      await gateway.afterInit();
      expect(initSpy).toHaveBeenCalled();
    });

    it('should fetch initial activities on initialization', async () => {
      await gateway.afterInit();
      expect(activityService.getActivities).toHaveBeenCalledWith({ id: '1' });
    });

    it('should emit activity_update events periodically', (done) => {
      if (!gateway.server) {
        gateway.server = { emit: jest.fn() } as any;
      }
      
      const serverEmitSpy = jest.spyOn(gateway.server, 'emit');

      setTimeout(() => {
        expect(serverEmitSpy).toHaveBeenCalledWith(
          'activity_update',
          expect.any(Array),
        );
        done();
      }, 1500); 
    }, 5000);
  });

  describe('Client Connection', () => {
    it('should handle client connection', async () => {
      await ensureConnected();
      expect(clientSocket.connected).toBe(true);
      expect(handleConnectionSpy).toHaveBeenCalled();
    });

    it('should have a valid socket id after connection', async () => {
      await ensureConnected();
      expect(clientSocket.id).toBeDefined();
    });
  });

  describe('Activity Updates', () => {
    it('should receive activity_update events from server', (done) => {
      ensureConnected().then((socket) => {
        const onActivityUpdate = (data: any) => {
          expect(Array.isArray(data)).toBe(true);
          socket.off('activity_update', onActivityUpdate);
          done();
        };
        socket.on('activity_update', onActivityUpdate);
      });
    }, 10000);
  });

  describe('Client Disconnection', () => {
    it('should handle client disconnection', async () => {
      const socket = await ensureConnected();
      
      const disconnectPromise = new Promise<void>((resolve) => {
        socket.on('disconnect', () => {
          resolve();
        });
      });

      socket.disconnect();
      await disconnectPromise;

      // Give it a small buffer for the server to register the disconnect
      await new Promise(resolve => setTimeout(resolve, 500));
      expect(handleDisconnectSpy).toHaveBeenCalled();
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should handle ActivityService errors gracefully', async () => {
      const mockActivityServiceWithError = {
        getActivities: jest.fn().mockRejectedValue(new Error('Service error')),
      };

      const testModule = await Test.createTestingModule({
        providers: [
          AnalyticsGateway,
          {
            provide: ActivityService,
            useValue: mockActivityServiceWithError,
          },
        ],
      }).compile();

      const testGateway = testModule.get<AnalyticsGateway>(AnalyticsGateway);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await testGateway.afterInit();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(testGateway['activities']).toEqual([
        { date: '2018-10-2', count: 0 },
        { date: '2018-10-3', count: 0 },
      ]);

      consoleErrorSpy.mockRestore();
      await testGateway.onModuleDestroy();
      await testModule.close();
    });
  });
});
