import { Controller, Request, Post, UseGuards, Get, Redirect, Body } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Get('login')
  @Redirect('/login', 302)
  getLogin() {}

  // Debug endpoint: returns raw REST login response for inspection
  @Post('debug-login')
  async debugLogin(@Body() body: { username: string; userId?: string }) {
    return this.authService.rawRestLogin(body);
  }
}
