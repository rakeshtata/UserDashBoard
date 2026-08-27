import { UserService } from './user.service';

describe('UserService', () => {
  it('creates users with the injected Mongoose model', async () => {
    const savedUser = { _id: 'user-1', name: 'Ada', age: 37, gender: 'female' };
    const save = jest.fn().mockResolvedValue(savedUser);
    const userModel = jest.fn().mockImplementation(() => ({ save }));

    const service = new UserService(userModel as any);
    const result = await service.addUser({ name: 'Ada', age: 37, gender: 'female' });

    expect(userModel).toHaveBeenCalledWith({ name: 'Ada', age: 37, gender: 'female' });
    expect(save).toHaveBeenCalled();
    expect(result).toEqual({ id: 'user-1', name: 'Ada', age: 37, gender: 'female' });
  });
});
