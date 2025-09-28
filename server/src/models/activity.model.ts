import { Field, ID, ObjectType, Int } from '@nestjs/graphql';

@ObjectType({ description: 'activities' })
export class Activity {
  @Field()
  date: string;

  @Field(() => Int)
  count: number;

}