import { Field, ID, ObjectType, Int } from '@nestjs/graphql';

@ObjectType({ description: 'users' })
export class User {
  @Field((type) => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => Int)
  age: number;

  @Field()
  gender: string;

}