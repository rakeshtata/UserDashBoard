const graphql = require('graphql');
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull
} = graphql;

const {
  fetchUsers,
  fetchUserById,
  fetchActivities,
  addUser,
  editUser,
  deleteUser
} = require('../data/api');

const ActivitiesType = new GraphQLObjectType({
  name: 'Activities',
  fields: () => ({
    date: { type: GraphQLString },
    count: { type: GraphQLInt }
  })
});

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLInt },
    name: { type: GraphQLString },
    age: { type: GraphQLInt },
    gender: { type: GraphQLString }
  })
});

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    activities: {
      type: new GraphQLList(ActivitiesType),
      args: { id: { type: new GraphQLNonNull(GraphQLInt) } },
      async resolve(parentValue, args, ctx) {
        try {
          return await fetchActivities(args.id);
        } catch (err) {
          // In production you might hide internal errors; keep message friendly
          throw new Error('Failed to load activities');
        }
      }
    },
    users: {
      type: new GraphQLList(UserType),
      async resolve() {
        try {
          return await fetchUsers();
        } catch (err) {
          throw new Error('Failed to load users');
        }
      }
    },
    user: {
      type: UserType,
      args: { id: { type: new GraphQLNonNull(GraphQLInt) } },
      async resolve(parentValue, args) {
        try {
          return await fetchUserById(args.id);
        } catch (err) {
          throw new Error('User not found');
        }
      }
    }
  }
});

const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addUser: {
      type: UserType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: new GraphQLNonNull(GraphQLInt) },
        gender: { type: new GraphQLNonNull(GraphQLString) }
      },
      async resolve(parentValue, { name, gender, age }) {
        try {
          return await addUser({ name, gender, age });
        } catch (err) {
          throw new Error('Failed to add user');
        }
      }
    },
    deleteUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) }
      },
      async resolve(parentValue, { id }) {
        try {
          return await deleteUser(id);
        } catch (err) {
          throw new Error('Failed to delete user');
        }
      }
    },
    editUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
        name: { type: GraphQLString },
        age: { type: GraphQLInt },
        gender: { type: GraphQLString }
      },
      async resolve(parentValue, args) {
        try {
          const { id, ...payload } = args;
          return await editUser(id, payload);
        } catch (err) {
          throw new Error('Failed to edit user');
        }
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation
});
