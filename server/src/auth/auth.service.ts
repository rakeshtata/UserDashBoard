import { Injectable } from '@nestjs/common';
// import { UserService } from '../user/user.service'; // Assuming a UserService exists
import { JwtService } from '@nestjs/jwt';
import { AuthenicatorService } from '../app.service';

@Injectable()
export class AuthService {
  constructor(
    // private userService: UserService,
    private jwtService: JwtService,
    private authenticatorService: AuthenicatorService
  ) { }

  async validateUser(username: string, pass: string): Promise<any> {
    const authData = await this.authenticatorService.getAuthentication({ name: username });
    const authRecord = Array.isArray(authData) ? authData : authData;

    if (authRecord && authRecord.password === pass) {
      const { password, ...result } = authRecord;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
