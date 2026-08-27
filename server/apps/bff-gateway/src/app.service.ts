import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, Observable } from 'rxjs';
import { Readable } from 'stream';

interface Activity {
  date: string;
  count: number;
}

interface ActivityList {
  activities: Activity[];
}

@Injectable()
export class ActivityService {
  private readonly baseUrls = Array.from(
    new Set([
      process.env.ANALYTICS_SERVICE_URL,
      'http://analytics-service:4003',
      'http://localhost:4003',
    ].filter(Boolean) as string[]),
  );

  constructor(private readonly httpService: HttpService) {}

  async getActivities(args: { id: string }): Promise<any> {
    let lastError: Error | null = null;

    for (const baseUrl of this.baseUrls) {
      try {
        const { data } = await firstValueFrom(this.httpService.get(`${baseUrl}/analytics/activities/${args.id}`));
        return data.activities;
      } catch (error) {
        // Capture rich details from AxiosError when available to aid debugging
        lastError = error as any;
        const axiosErr: any = lastError;
        const msg = axiosErr?.message || String(axiosErr);
        const code = axiosErr?.code;
        const config = axiosErr?.config;
        const status = axiosErr?.response?.status;
        const responseData = axiosErr?.response?.data;

        Logger.warn(
          `[BFF-Gateway] Failed to reach analytics service at ${baseUrl}: ${msg} ` +
            `(code=${code}, url=${config?.url || config?.baseURL || ''}, method=${config?.method || ''}, status=${status})`,
        );

        try {
          Logger.debug(`[BFF-Gateway] Analytics response data: ${JSON.stringify(responseData)}`);
        } catch (e) {
          Logger.debug('[BFF-Gateway] Analytics response data: <unserializable>');
        }
      }
    }

    throw lastError ?? new Error('Unable to reach analytics service');
  }

  streamActivities(args: { id: string }): Observable<ActivityList> {
    return new Observable<ActivityList>((subscriber) => {
      let active = true;
      const abortController = new AbortController();

      const tryStream = async () => {
        let lastError: Error | null = null;

        for (const baseUrl of this.baseUrls) {
          try {
            const response = await firstValueFrom(
              this.httpService.get(`${baseUrl}/analytics/stream/${args.id}`, {
                responseType: 'stream',
                signal: abortController.signal,
              })
            );

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
                    } catch (error) {
                      const message = error instanceof Error ? error.message : String(error);
                      Logger.error('Failed to parse SSE payload: ' + trimmed, message);
                    }
                  }
                }
              }
            });

            stream.on('error', (err: unknown) => {
              if (active) subscriber.error(err);
            });

            stream.on('end', () => {
              if (active) subscriber.complete();
            });

            return;
          } catch (error) {
            lastError = error as Error;
            Logger.warn(`[BFF-Gateway] Failed to reach analytics stream at ${baseUrl}: ${error.message}`);
          }
        }

        if (active) subscriber.error(lastError ?? new Error('Unable to reach analytics stream'));
      };

      void tryStream();

      return () => {
        active = false;
        abortController.abort();
      };
    });
  }
}

@Injectable()
export class UserGatewayService {
  private readonly baseUrl = process.env.USER_SERVICE_URL || 'http://user-service:4002';

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

