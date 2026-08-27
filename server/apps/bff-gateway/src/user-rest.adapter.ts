export interface UserCreateInput {
  name: string;
  age: number;
  gender: string;
}

export interface UserUpdateInput extends UserCreateInput {}

export class UserRestAdapter {
  toCreatePayload(input: UserCreateInput) {
    return {
      name: input.name,
      age: input.age,
      gender: input.gender,
    };
  }

  toUpdatePayload(id: string, input: UserUpdateInput) {
    return {
      id,
      name: input.name,
      age: input.age,
      gender: input.gender,
    };
  }
}
