import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';

@Injectable()
export class AuthService {
  private readonly jsonServerUrls = Array.from(
    new Set([
      process.env.JSON_SERVER_URL,
      'http://jsonServer-app:8000',
      'http://localhost:8000',
    ].filter(Boolean) as string[]),
  );

  constructor(private jwtService: JwtService) {}

  private async fetchAuthRecord(username: string): Promise<any> {
    let lastError: Error | null = null;

    for (const baseUrl of this.jsonServerUrls) {
      try {
        console.log('[Auth-Service] validateUser request:', username, 'against', baseUrl);
        const resp = await axios.get(`${baseUrl}/auth/${username}`, {
          headers: { connection: 'keep-alive' },
        });
        return resp.data;
      } catch (e) {
        lastError = e as Error;
        console.warn('[Auth-Service] validateUser failed for', baseUrl, e.message);
      }
    }

    throw lastError ?? new Error('Unable to reach auth JSON server');
  }

  async validateUser(username: string, pass: string): Promise<any> {
    try {
      const authRecord = await this.fetchAuthRecord(username);
      console.log('[Auth-Service] validateUser response:', authRecord);

      if (authRecord && authRecord.password === pass) {
        const { password, ...result } = authRecord;
        console.log('[Auth-Service] validateUser success:', {
          username: result.username,
          userId: result.userId,
        });
        return result;
      }
      console.warn('[Auth-Service] validateUser failed: invalid credentials for', username);
    } catch (e) {
      console.error('Validation failed', e.message, e.stack);
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.userId };
    const accessToken = this.jwtService.sign(payload);
    console.log('[Auth-Service] login generated token for:', user.username, 'userId:', user.userId);
    return {
      access_token: accessToken,
    };
  }
}
