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
import { Subscription } from 'rxjs';

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
  private subscription: Subscription;

  constructor(private readonly activityService: ActivityService) {}

  async afterInit() {
    // console.log('WebSocket Gateway Initialized');

    // Fetch initial data and start SSE stream for real-time updates
    try {
      this.activities = await this.activityService.getActivities({ id: '1' });
      
      // Subscribe to SSE stream from Analytics Microservice
      this.subscription = this.activityService.streamActivities({ id: '1' }).subscribe({
        next: (data) => {
          this.server.emit('activity_update', data.activities);
        },
        error: (err) => {
          console.error('Analytics SSE stream error:', err.message);
        }
      });

    } catch (error) {
      console.error('Failed to initialize analytics stream:', error.message);
      this.activities = [
        { date: '2018-10-2', count: 0 },
        { date: '2018-10-3', count: 0 },
      ];
    }
  }

  onModuleDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  handleConnection(client: Socket) {
    // console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // console.log(`Client disconnected: ${client.id}`);
  }
}
