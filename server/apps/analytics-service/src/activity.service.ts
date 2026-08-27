import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ActivityService {
  private readonly jsonServerUrls = Array.from(
    new Set([
      process.env.JSON_SERVER_URL,
      'http://jsonServer-app:8000',
      'http://localhost:8000',
    ].filter(Boolean) as string[]),
  );

  async getActivities(args: { id: string }): Promise<any> {
    const numId = Number(args.id);
    if (Number.isNaN(numId)) {
      throw new Error('Invalid id');
    }
    const id = ((numId - 1) % 10) + 1;

    let lastError: Error | null = null;
    for (const baseUrl of this.jsonServerUrls) {
      try {
        const resp = await axios.get(`${baseUrl}/data/${id}`, {
          headers: { connection: 'keep-alive' },
        });
        return resp.data.activities;
      } catch (error) {
        lastError = error as Error;
        console.warn('[Analytics-Service] Failed to fetch activities from', baseUrl, error.message);
      }
    }

    console.error('Failed to fetch initial activities:', lastError?.message);
    return [
      { date: '2018-10-2', count: 0 },
      { date: '2018-10-3', count: 0 },
    ];
  }
}
