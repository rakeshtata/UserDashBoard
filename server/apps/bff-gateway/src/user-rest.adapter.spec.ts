import { UserRestAdapter } from './user-rest.adapter';

describe('UserRestAdapter', () => {
  it('maps GraphQL create input to the REST payload', () => {
    const adapter = new UserRestAdapter();
    const payload = adapter.toCreatePayload({ name: 'Ada', age: 37, gender: 'F' });

    expect(payload).toEqual({ name: 'Ada', age: 37, gender: 'F' });
  });

  it('maps GraphQL update input to the REST payload with an id', () => {
    const adapter = new UserRestAdapter();
    const payload = adapter.toUpdatePayload('42', { name: 'Ada', age: 38, gender: 'F' });

    expect(payload).toEqual({ id: '42', name: 'Ada', age: 38, gender: 'F' });
  });
});
