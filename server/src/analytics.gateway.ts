import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ActivityService } from './app.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AnalyticsGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleDestroy
{
  @WebSocketServer() server: Server;
  private activities: any[] = [];
  private intervalId: NodeJS.Timeout;

  constructor(private readonly activityService: ActivityService) {}

  async afterInit() {
    // console.log('WebSocket Gateway Initialized');

    // Fetch initial data from ActivityService
    try {
      // Fetching activities for a default user (ID: 1)
      this.activities = await this.activityService.getActivities({ id: '1' });
      // console.log(`Initial activities fetched: ${this.activities.length}`);
    } catch (error) {
      // console.error('Failed to fetch initial activities:', error);
      // Fallback to some default data if service fails
      this.activities = [
        { date: '2018-10-2', count: 0 },
        { date: '2018-10-3', count: 0 },
      ];
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      if (this.activities.length > 0) {
        // Randomize the 'count' for each activity to make the graph "keep changing"
        const mockData = this.activities.map((activity) => ({
          ...activity,
          count: Math.floor(Math.random() * 100),
        }));
        this.server.emit('activity_update', mockData);
      }
    }, 10000);
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  handleConnection(client: Socket) {
    // console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // console.log(`Client disconnected: ${client.id}`);
  }
}
