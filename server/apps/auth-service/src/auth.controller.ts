import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() data: { username: string; userId: string }) {
    return this.authService.login({
      username: data.username,
      userId: data.userId
    });
  }

  @Post('validate')
  async validateUser(@Body() data: { username: string; password: string }) {
    const user = await this.authService.validateUser(data.username, data.password);
    if (user) {
      return { 
        success: true, 
        userId: user.id || 'mock-id', 
        username: user.username || data.username 
      };
    }
    return { success: false };
  }
}
