import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('returns a healthy gateway payload at the root route', () => {
    expect(controller.getRoot()).toEqual({
      status: 'ok',
      service: 'bff-gateway',
      message: 'Gateway is running',
    });
  });
});
