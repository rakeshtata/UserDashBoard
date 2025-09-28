import { Field, Int, InputType } from '@nestjs/graphql';

@InputType('UserInput')
export class UserDTO {
  @Field()
  name: string;

  @Field()
  age: number;

  @Field()
  gender: string;
}