const graphql = require('graphql');
const axios = require('axios');
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull
} = graphql;

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
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    age: { type: GraphQLInt },
    gender: { type: GraphQLString}
  })
});

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    activities: {
      type: new GraphQLList(ActivitiesType),
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        return axios.get(`http://localhost:8000/data/${args.id}`)
          .then(resp => resp.data.activities);
      }
    },
    users: {
      type: new GraphQLList(UserType),
      resolve(parentValue, args) {
        return axios.get(`http://localhost:8000/data/`)
          .then(resp => resp.data);
      }
    }
  }
});


module.exports = new GraphQLSchema({
  query: RootQuery
});
