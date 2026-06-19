import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { ActivityService } from './activity.service';

@Module({
  controllers: [AnalyticsController],
  providers: [ActivityService],
})
export class AnalyticsModule {}
