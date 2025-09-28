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
      resolve(parentValue, args, ctx) {
        if(ctx.session && ctx.session.data){
          return ctx.session.data[args.id].activities;
        } else {
        //console.log(ctx.session.data)
          return axios.get(`http://172.18.0.1:8000/data/${args.id}`,{headers: { connection: "keep-alive" }})
            .then(resp => resp.data.activities);
      }
      }
    },
    users: {
      type: new GraphQLList(UserType),
      resolve(parentValue, args,ctx) {
        if(ctx.session && ctx.session.data){
          return ctx.session.data;
        } else {
          return axios.get(`http://172.18.0.1:8000/data/`,{headers: { connection: "keep-alive" }})
            .then(resp =>{
              ctx.session = []
             ctx.session.data = resp.data;
              return resp.data
            } );
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
        name: { type: GraphQLString },
        age: {type: GraphQLInt},
        gender: {type: GraphQLString}
      },
      resolve(parentValue, { name, gender, age }) {
        return axios.post('http://:172.18.0.1:8000/data', { name, gender, age })
          .then(res => res.data);
      }
    },
    deleteUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) }
      },
      resolve(parentValue, { id }) {
        return axios.delete(`http://172.18.0.1:8000/data/${id}`)
          .then(res => res.data);
      }
    },
    editUser: {
      type: UserType,
      args: {
        name: {type: GraphQLString},
        age: {type: GraphQLInt},
        gender: {type: GraphQLString}
      },
      resolve(parentValue, args){
        return axios.patch(`http://172.18.0.1:8000/data/${args.id}`,args)
          .then(res => res.data)
      }
    }
  }
});


module.exports = new GraphQLSchema({
  mutation,
  query: RootQuery
});
