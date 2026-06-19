import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  private readonly baseUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';

  constructor(private readonly httpService: HttpService) {}

  async validateUser(username: string, pass: string): Promise<any> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/auth/validate`, { username, password: pass })
      );
      if (data && data.success) {
        return { username: data.username, userId: data.userId };
      }
    } catch (e) {
      console.error('REST validateUser failed', e.message);
    }
    return null;
  }

  async login(user: any) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/auth/login`, { 
          username: user.username, 
          userId: user.userId || user.id || 'mock-id' 
        })
      );
      console.log('[BFF-Gateway] authService.login response:', data);
      const accessToken = data?.access_token || data?.accessToken;
      if (!accessToken) {
        console.error('[BFF-Gateway] authService.login missing access_token in response', data);
        throw new Error('Invalid auth service response');
      }
      return { access_token: accessToken };
    } catch (e) {
      console.error('REST login failed', e.message, e.stack);
      throw e;
    }
  }

  // Debug helper: return raw REST response without validation
  async rawRestLogin(user: any) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/auth/login`, {
          username: user.username,
          userId: user.userId || user.id || 'mock-id',
        })
      );
      console.log('[BFF-Gateway] raw REST login response:', data);
      return data;
    } catch (e) {
      console.error('REST raw login failed', e.message, e.stack);
      return { error: e.message };
    }
  }
}
