import axios from "axios";
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Logger } from '@nestjs/common';
import { UserDTO } from './models/user.dto';


@Injectable()
export class ActivityService {
  getActivities(args: { id: string }): Promise<any> {
    return axios.get(`http://172.18.0.1:8000/data/${args.id}`, { headers: { connection: "keep-alive" } })
                .then(resp => resp.data.activities);
}
}

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  getUser(args: { id: string }): Promise<any> {
    return axios.get(`http://172.18.0.1:8000/data/${args.id}`, { headers: { connection: "keep-alive" } })
                .then(resp => resp.data);
  }

  getUsers(): Promise<any> {
    // return axios.get(`http://172.18.0.1:8000/data`, { headers: { connection: "keep-alive" } })
    //             .then(resp => resp.data);
    return this.userModel.find().exec();
  }

  addUser({ name, gender, age }): Promise<any> {
    // return axios.post('http://:172.18.0.1:8000/data', { name, gender, age })
    //       .then(res => res.data);
    const id = 0;
    const createdUser = new this.userModel({ name, gender, age, id });
    return createdUser.save();
  }

  editUser({ name, gender, age, id }): Promise<any> {
    // return axios.patch('http://:172.18.0.1:8000/data', { name, gender, age, id })
    //       .then(res => res.data);
    return this.userModel.findByIdAndUpdate(id, { name, gender, age, id }, { new: true }).exec();
  }

  deleteUser(args: { id: string }): Promise<any> {
    // return axios.delete(`http://:172.18.0.1:8000/data/${args.id}`,{ headers: { connection: "keep-alive" } })
    //             .then(resp => resp.data);
    return this.userModel.findByIdAndDelete(args.id).exec();
  }
}

@Injectable()
export class RedisCacheService {
    constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

        async get(key: string): Promise<any> {
        try {
            const value = await this.cache.get(key);
            Logger.log(`Cache ${value ? 'hit' : 'miss'} for key: ${key}`);
            return value;
        } catch (error) {
            Logger.error(`Failed to get cache for key ${key}: ${error.message}`);
            return null;
        }
    }

    async set(key: string, value: any, ttl: number = 60000): Promise<void> {
        try {
            await this.cache.set(key, value, ttl);
            Logger.log(`Successfully cached data for key: ${key}`);
        } catch (error) {
            Logger.error(`Failed to set cache for key ${key}: ${error.message}`);
            throw new Error(`Cache set failed: ${error.message}`);
        }
    }

      async del(key: string): Promise<void> {
        try {
            await this.cache.del(key);
            Logger.log(`Successfully deleted cache for key: ${key}`);
        } catch (error) {
            Logger.error(`Failed to delete cache for key ${key}: ${error.message}`);
            throw new Error(`Cache deletion failed: ${error.message}`);
        }
    }

    async reset(): Promise<void> {
        try {
            await this.cache.clear();
            Logger.log('Successfully reset cache');
        } catch (error) {
            Logger.error(`Failed to reset cache: ${error.message}`);
            throw new Error(`Cache reset failed: ${error.message}`);
        }
    }
}

