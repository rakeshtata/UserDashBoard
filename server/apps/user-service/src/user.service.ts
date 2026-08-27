import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '@app/shared';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  private toResponse(user: any): any {
    if (!user) {
      return null;
    }

    const plainUser = user.toObject ? user.toObject() : user;
    return {
      id: plainUser._id ? plainUser._id.toString() : plainUser.id?.toString(),
      name: plainUser.name,
      age: plainUser.age,
      gender: plainUser.gender,
    };
  }

  async getUser(args: { id: string }): Promise<any> {
    const user = await this.userModel.findById(args.id).exec();
    return this.toResponse(user);
  }

  async getUsers(): Promise<any> {
    const users = await this.userModel.find().exec();
    return users.map((user) => this.toResponse(user));
  }

  async addUser({ name, gender, age }): Promise<any> {
    const createdUser = new this.userModel({ name, age, gender });
    const savedUser = await createdUser.save();
    return this.toResponse(savedUser);
  }

  async editUser({ name, gender, age, id }): Promise<any> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { name, gender, age }, { new: true })
      .exec();
    return this.toResponse(updatedUser);
  }

  async deleteUser(args: { id: string }): Promise<any> {
    const deletedUser = await this.userModel.findByIdAndDelete(args.id).exec();
    return this.toResponse(deletedUser);
  }
}
