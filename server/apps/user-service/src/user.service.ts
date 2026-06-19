import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '@app/shared';
import axios from 'axios';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async getUser(args: { id: string }): Promise<any> {
    const resp = await axios.get(`http://jsonServer-app:8000/data/${args.id}`, {
        headers: { connection: 'keep-alive' },
    });
    return {
        id: resp.data.id,
        name: resp.data.name,
        age: resp.data.age,
        gender: resp.data.gender
    };
  }

  async getUsers(): Promise<any> {
    return this.userModel.find().exec();
  }

  async addUser({ name, gender, age }): Promise<any> {
    const res = await axios.post('http://jsonServer-app:8000/data', { name, gender, age });
    return {
        id: res.data.id,
        name: res.data.name,
        age: res.data.age,
        gender: res.data.gender
    };
  }

  async editUser({ name, gender, age, id }): Promise<any> {
    const res = await axios.patch('http://jsonServer-app:8000/data', { name, gender, age, id });
    return {
        id: res.data.id,
        name: res.data.name,
        age: res.data.age,
        gender: res.data.gender
    };
  }

  async deleteUser(args: { id: string }): Promise<any> {
    const resp = await axios.delete(`http://jsonServer-app:8000/data/${args.id}`, {
        headers: { connection: 'keep-alive' },
    });
    return resp.data;
  }
}
