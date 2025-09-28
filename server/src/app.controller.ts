import { Controller, Get, Post, Put, Delete } from '@nestjs/common';
import { ActivityService, UserService  } from './app.service';

@Controller('activities')
export class ActivityController {
  // constructor(private readonly activityService: ActivityService) {}

  // @Get()
  // getActivities(): string {
  //   return this.activityService.getActivities();
  // }
}

// @Controller('users')
// export class UsersController {
//   constructor(private readonly userService: UserService) {}

//   @Get()
//   getUsers(): string {
//     return this.userService.getUsers();
//   }
// }

@Controller('user')
export class UserController {
  // constructor(private readonly userService: UserService) {}

  // @Get()
  // getUser(): string {
  //   return "hello user";
  // }

  // @Post()
  // addUser(): string {
  //   return "add user"
  // }

  // @Delete()
  // removeUser(): string {
  //   return "delete user"
  // }

  // @Put()
  // editUser(): string {
  //   return "edit user"
  // }

}

