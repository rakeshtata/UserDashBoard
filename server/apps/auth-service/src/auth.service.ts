import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(username: string, pass: string): Promise<any> {
    try {
        console.log('[Auth-Service] validateUser request:', username);
        const resp = await axios.get(`http://jsonServer-app:8000/auth/${username}`, {
            headers: { connection: 'keep-alive' },
        });
        const authRecord = resp.data;
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
