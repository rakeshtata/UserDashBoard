import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './models/user.model';
import { Activity } from './models/activity.model';
import { UserService,ActivityService,RedisCacheService } from './app.service';
import { NotFoundException } from '@nestjs/common';
import { UserDTO } from './models/user.dto';
import { Logger } from '@nestjs/common';

// class RedisCache {
//   constructor(private cacheManager: RedisCacheService) {}
//   async setCacheValue(KEY, value) {
//     await this.cacheManager.set(KEY, value);
//   }

//   async getCacheValue(KEY) {
//     await this.cacheManager.get(KEY);
//   }
// }

// Example usage (provide a RedisCacheService instance):
// const redisCache = new RedisCache(cacheManager);




@Resolver((of) => User)
export class UserResolver {
  constructor(private readonly userService: UserService, private cacheManager: RedisCacheService) {}
  
// You can initialize redisCache inside a method or the constructor if needed.
// Example: this.redisCache = new RedisCache(this.cacheManager);
// @Query((returns) => User)
// async userById(@Args('id', { type: () => String }) id: string) {
//   const user = await this.userService.getUser({ id });
//   if (!user) {
//     throw new NotFoundException(id);
//   }
//   return user;
// }


  @Query((returns) => [User])
  async users() {
    const cacheVal = await this.cacheManager.get('data');
    let users = {};
     if(cacheVal){
          return cacheVal;
        } else {
        users = await this.userService.getUsers();
        if (!users) {
          throw new NotFoundException();
        }
        await this.cacheManager.set('data',users);
     }
    return users;
  }

  @Mutation(() => User)
  async addUser( @Args('input', { type: () => UserDTO }) input: UserDTO): Promise<User> {
    try {
      Logger.log(`Adding new user: ${JSON.stringify(input)}`);
      const user = await this.userService.addUser(input);
      // await this.cacheManager.del('data');
      return user;
    } catch (error) {
      Logger.error(`Failed to add user: ${error.message}`);
      throw new Error(`Failed to add user: ${error.message}`);
    }
  }

  @Mutation(() => User)
  async editUser(
    @Args('id') id: string,
    @Args('input', { type: () => UserDTO }) input: UserDTO
  ): Promise<User> {
    try {
      Logger.log(`Editing user ${id}: ${JSON.stringify(input)}`);
      const user = await this.userService.editUser({ ...input, id });
      
      // Invalidate users cache when editing user
      // await this.cacheManager.del('data');
      
      return user;
    } catch (error) {
      Logger.error(`Failed to edit user: ${error.message}`);
      throw new Error(`Failed to edit user: ${error.message}`);
    }
  }

  @Mutation((returns) => User)
  async deleteUser(@Args('id', { type: () => String }) id: string): Promise<User> {
    try {
      Logger.log(`Deleting user with id: ${id}`);
      const user = await this.userService.deleteUser({ id });
      
      // Invalidate both user and activity caches
      await Promise.all([
        this.cacheManager.del('data'),
        this.cacheManager.del(`activity${id}`)
      ]);
      
      return user;
    } catch (error) {
      Logger.error(`Failed to delete user: ${error.message}`);
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
}

@Resolver((of) => Activity)
export class ActivityResolver {
  constructor( private readonly activityService: ActivityService, private cacheManager: RedisCacheService) {}

  @Query((returns) => [Activity])
  async activities(@Args('id', { type: () => String }) id: string) {
    try {
      const cacheKey = `activity${id}`;
      const cacheVal = await this.cacheManager.get(cacheKey);
      Logger.log(`Cache ${cacheVal ? 'hit' : 'miss'} for activities of user ${id}`);

      if (cacheVal) {
        return cacheVal;
      }

      const activities = await this.activityService.getActivities({ id });
      if (!activities) {
        throw new NotFoundException(`No activities found for user ${id}`);
      }

      await this.cacheManager.set(cacheKey, activities);
      return activities;
    } catch (error) {
      Logger.error(`Failed to fetch activities for user ${id}: ${error.message}`);
      throw new Error(`Failed to fetch activities: ${error.message}`);
    }
  }
}
