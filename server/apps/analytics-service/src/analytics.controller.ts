import { Controller, Get, Param, Sse } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { Observable, interval, map, switchMap, from } from 'rxjs';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('activities/:id')
  async getActivities(@Param('id') id: string) {
    const activities = await this.activityService.getActivities({ id });
    return { activities };
  }

  @Sse('stream/:id')
  streamActivityUpdates(@Param('id') id: string): Observable<any> {
    // Return a stream of updates every 10 seconds
    return from(this.activityService.getActivities({ id })).pipe(
      switchMap(initialActivities => {
        return interval(10000).pipe(
          map(() => {
            const mockData = initialActivities.map((activity) => ({
              ...activity,
              count: Math.floor(Math.random() * 100),
            }));
            return { data: { activities: mockData } };
          })
        );
      })
    );
  }
}
