import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, Observable, map } from 'rxjs';
import { Readable } from 'stream';

interface UserResponse {
  id: string;
  name: string;
  age: number;
  gender: string;
}

interface UsersList {
  users: UserResponse[];
}

interface DeleteResponse {
  success: boolean;
}

interface Activity {
  date: string;
  count: number;
}

interface ActivityList {
  activities: Activity[];
}

@Injectable()
export class ActivityService {
  private readonly baseUrl = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:4003';

  constructor(private readonly httpService: HttpService) {}

  async getActivities(args: { id: string }): Promise<any> {
    const { data } = await firstValueFrom(this.httpService.get(`${this.baseUrl}/analytics/activities/${args.id}`));
    return data.activities;
  }

  streamActivities(args: { id: string }): Observable<ActivityList> {
    return new Observable<ActivityList>((subscriber) => {
      let active = true;
      const abortController = new AbortController();

      firstValueFrom(
        this.httpService.get(`${this.baseUrl}/analytics/stream/${args.id}`, {
          responseType: 'stream',
          signal: abortController.signal,
        })
      ).then((response) => {
        if (!active) return;
        const stream = response.data as Readable;
        let buffer = '';

        stream.on('data', (chunk) => {
          if (!active) return;
          buffer += chunk.toString();
          
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            const lines = part.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data:')) {
                try {
                  const jsonStr = trimmed.substring(5).trim();
                  if (jsonStr) {
                    const parsed = JSON.parse(jsonStr);
                    if (parsed && parsed.data && parsed.data.activities) {
                      subscriber.next(parsed.data);
                    } else if (parsed && parsed.activities) {
                      subscriber.next(parsed);
                    }
                  }
                } catch (e) {
                  Logger.error('Failed to parse SSE payload: ' + trimmed, e.stack);
                }
              }
            }
          }
        });

        stream.on('error', (err) => {
          if (active) subscriber.error(err);
        });

        stream.on('end', () => {
          if (active) subscriber.complete();
        });
      }).catch((err) => {
        if (active) subscriber.error(err);
      });

      return () => {
        active = false;
        abortController.abort();
      };
    });
  }
}

@Injectable()
export class UserService {
  private readonly baseUrl = process.env.USER_SERVICE_URL || 'http://localhost:4002';

  constructor(private readonly httpService: HttpService) {}

  async getUser(args: { id: string }): Promise<any> {
    const { data } = await firstValueFrom(this.httpService.get(`${this.baseUrl}/users/${args.id}`));
    return data;
  }

  async getUsers(): Promise<any> {
    const { data } = await firstValueFrom(this.httpService.get(`${this.baseUrl}/users`));
    return data.users;
  }

  async addUser({ name, gender, age }): Promise<any> {
    const { data } = await firstValueFrom(this.httpService.post(`${this.baseUrl}/users`, { name, gender, age }));
    return data;
  }

  async editUser({ name, gender, age, id }): Promise<any> {
    const { data } = await firstValueFrom(this.httpService.put(`${this.baseUrl}/users/${id}`, { name, gender, age }));
    return data;
  }

  async deleteUser(args: { id: string }): Promise<any> {
    const { data } = await firstValueFrom(this.httpService.delete(`${this.baseUrl}/users/${args.id}`));
    return { success: data.success };
  }
}

@Injectable()
export class RedisCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get(key: string): Promise<any> {
    try {
      const value = await this.cache.get(key);
      Logger.log(`Cache ${value ? 'hit' : 'miss'} for key: ${key}`);
      return value;
    } catch (error) {
      Logger.error(`Failed to get cache for key ${key}: ${error.message}`);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 60000): Promise<void> {
    try {
      await this.cache.set(key, value, ttl);
      Logger.log(`Successfully cached data for key: ${key}`);
    } catch (error) {
      Logger.error(`Failed to set cache for key ${key}: ${error.message}`);
      throw new Error(`Cache set failed: ${error.message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cache.del(key);
      Logger.log(`Successfully deleted cache for key: ${key}`);
    } catch (error) {
      Logger.error(`Failed to delete cache for key ${key}: ${error.message}`);
      throw new Error(`Cache deletion failed: ${error.message}`);
    }
  }

  async reset(): Promise<void> {
    try {
      await this.cache.clear();
      Logger.log('Successfully reset cache');
    } catch (error) {
      Logger.error(`Failed to reset cache: ${error.message}`);
      throw new Error(`Cache reset failed: ${error.message}`);
    }
  }
}
