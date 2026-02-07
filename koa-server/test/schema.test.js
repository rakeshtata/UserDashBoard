/**
 * Unit tests for GraphQL schema resolvers.
 * Mocks the data module to keep tests fast and deterministic.
 */

const { graphql } = require('graphql');
const schema = require('../schema/schema');

// Mock the data module used by schema.js
jest.mock('../data/api', () => ({
  fetchUsers: jest.fn().mockResolvedValue([
    { id: 1, name: 'Alice', age: 30, gender: 'female' },
    { id: 2, name: 'Bob', age: 25, gender: 'male' }
  ]),
  fetchUserById: jest.fn().mockImplementation((id) => {
    if (Number(id) === 1) return Promise.resolve({ id: 1, name: 'Alice', age: 30, gender: 'female' });
    return Promise.resolve(null);
  }),
  fetchActivities: jest.fn().mockResolvedValue([
    { date: '2025-10-01', count: 5 },
    { date: '2025-10-02', count: 3 }
  ]),
  addUser: jest.fn().mockImplementation((payload) => Promise.resolve({ id: 3, ...payload })),
  editUser: jest.fn().mockImplementation((id, payload) => Promise.resolve({ id, ...payload })),
  deleteUser: jest.fn().mockImplementation((id) => Promise.resolve({ id }))
}));

describe('GraphQL schema', () => {
  test('users query returns list of users', async () => {
    const query = `{
      users { id name age gender }
    }`;

    const result = await graphql(schema, query);
    expect(result.errors).toBeUndefined();
    expect(result.data.users).toHaveLength(2);
    expect(result.data.users[0].name).toBe('Alice');
  });

  test('user query returns single user by id', async () => {
    const query = `query($id: Int!) { user(id: $id) { id name age } }`;
    const vars = { id: 1 };
    const result = await graphql(schema, query, null, null, vars);
    expect(result.errors).toBeUndefined();
    expect(result.data.user).toBeTruthy();
    expect(result.data.user.name).toBe('Alice');
  });

  test('activities query returns activities for id', async () => {
    const query = `query($id: Int!) { activities(id: $id) { date count } }`;
    const vars = { id: 1 };
    const result = await graphql(schema, query, null, null, vars);
    expect(result.errors).toBeUndefined();
    expect(result.data.activities).toHaveLength(2);
  });

  test('addUser mutation returns created user', async () => {
    const mutation = `mutation($name: String!, $age: Int!, $gender: String!) {
      addUser(name: $name, age: $age, gender: $gender) { id name age gender }
    }`;
    const vars = { name: 'Charlie', age: 28, gender: 'non-binary' };
    const result = await graphql(schema, mutation, null, null, vars);
    expect(result.errors).toBeUndefined();
    expect(result.data.addUser).toMatchObject({ name: 'Charlie', age: 28, gender: 'non-binary' });
    expect(result.data.addUser.id).toBeDefined();
  });
});
