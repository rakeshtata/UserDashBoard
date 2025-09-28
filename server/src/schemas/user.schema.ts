import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop()
  id: number;
    
  @Prop()
  name: string;

  @Prop()
  age: number;

  @Prop()
  gender: string;
}

export const UserSchema = SchemaFactory.createForClass(User);