const Koa = require('koa');
const mount = require('koa-mount');
const graphqlHTTP = require('koa-graphql');
const schema = require('./schema/schema');
const session = require('koa-session-redis');

const app = new Koa();

app.keys = ['myKey1','myKey2','myKey3'];
// app.use(session({
//     store: {
//       host: 'http://172.18.0.1',
//       port: 6379,
//       ttl: 3600,
//     },
//   },
// ));

app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  ctx.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  await next();
});

app.use(
  mount(
    '/graphql',
    graphqlHTTP({
      schema: schema,
      graphiql: true,
    }),
  )
);

app.listen(4000);
