const Koa = require('koa');
const mount = require('koa-mount');
const graphqlHTTP = require('koa-graphql');
const schema = require('./schema/schema');

const app = new Koa();

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

//app.use(cors())



app.listen(4000);
