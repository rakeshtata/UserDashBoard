import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './models/user.model';
import { Activity } from './models/activity.model';
import { UserGatewayService, ActivityService } from './app.service';
import { UserDTO } from '@app/shared';
import { UserRestAdapter } from './user-rest.adapter';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly userService: UserGatewayService,
    private readonly restAdapter: UserRestAdapter,
  ) {}

  @Query(() => [User])
  async users() {
    return this.userService.getUsers();
  }

  @Mutation(() => User)
  async addUser(
    @Args('input', { type: () => UserDTO }) input: UserDTO,
  ): Promise<User> {
    return this.userService.addUser(this.restAdapter.toCreatePayload(input));
  }

  @Mutation(() => User)
  async editUser(
    @Args('id') id: string,
    @Args('input', { type: () => UserDTO }) input: UserDTO,
  ): Promise<User> {
    return this.userService.editUser(this.restAdapter.toUpdatePayload(id, input));
  }

  @Mutation(() => User)
  async deleteUser(@Args('id', { type: () => String }) id: string): Promise<User> {
    return this.userService.deleteUser({ id });
  }
}

@Resolver(() => Activity)
export class ActivityResolver {
  constructor(private readonly activityService: ActivityService) {}

  @Query(() => [Activity])
  async activities(@Args('id', { type: () => String }) id: string) {
    return this.activityService.getActivities({ id });
  }
}
