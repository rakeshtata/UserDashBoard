import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      status: 'ok',
      service: 'bff-gateway',
      message: 'Gateway is running',
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'bff-gateway',
    };
  }
}
