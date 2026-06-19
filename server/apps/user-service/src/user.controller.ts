import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userService.getUser({ id });
  }

  @Get()
  async getUsers() {
    const users = await this.userService.getUsers();
    return { users: users.map(u => ({
        id: u._id.toString(),
        name: u.name,
        age: u.age,
        gender: u.gender
    })) };
  }

  @Post()
  async addUser(@Body() data: { name: string; age: number; gender: string }) {
    return this.userService.addUser(data);
  }

  @Put(':id')
  async editUser(@Param('id') id: string, @Body() data: { name: string; age: number; gender: string }) {
    return this.userService.editUser({ id, ...data });
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    const result = await this.userService.deleteUser({ id });
    return { success: !!result };
  }
}
