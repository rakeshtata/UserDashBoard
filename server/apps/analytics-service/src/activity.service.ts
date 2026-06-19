import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ActivityService {
  async getActivities(args: { id: string }): Promise<any> {
    const numId = Number(args.id);
    if (Number.isNaN(numId)) {
      throw new Error('Invalid id');
    }
    const id = ((numId - 1) % 10) + 1;
    try {
      const resp = await axios.get(`http://jsonServer-app:8000/data/${id}`, {
        headers: { connection: 'keep-alive' },
      });
      return resp.data.activities;
    } catch (error) {
      console.error('Failed to fetch initial activities:', error.message);
      return [
        { date: '2018-10-2', count: 0 },
        { date: '2018-10-3', count: 0 },
      ];
    }
  }
}
