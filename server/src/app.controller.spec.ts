import { Test, TestingModule } from '@nestjs/testing';
import { ActivityController, UserController } from './app.controller';
import { ActivityService, UserService } from './app.service';

describe('AppControllers', () => {
  let activityController: ActivityController;
  let userController: UserController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ActivityController, UserController],
      providers: [
        {
          provide: ActivityService,
          useValue: {},
        },
        {
          provide: UserService,
          useValue: {},
        },
      ],
    }).compile();

    activityController = app.get<ActivityController>(ActivityController);
    userController = app.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(activityController).toBeDefined();
    expect(userController).toBeDefined();
  });
});
