require('dotenv').config();
const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const { graphqlHTTP } = require('koa-graphql');
const schema = require('./schema/schema');
const session = require('koa-session-redis');

function createApp() {
  const app = new Koa();
  const router = new Router();

  app.keys = ['myKey1','myKey2','myKey3'];
  app.use(session({
      store: {
        host: '172.18.0.1',
        port: 6379,
        ttl: 3600,
      },
    },
  ));

  app.use(bodyParser());

  router.all('/graphql', graphqlHTTP({
    schema,
    graphiql: process.env.NODE_ENV !== 'production'
  }));

  app.use(router.routes()).use(router.allowedMethods());
  return app;
}

async function start(port = process.env.PORT || 4000) {
  const app = createApp();
  const server = app.listen(port, () => {
    console.log(`Koa GraphQL server running at http://localhost:${port}/graphql`);
  });

  const shutdown = () => {
    console.log('Shutting down...');
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return server;
}

if (require.main === module) {
  start();
}

module.exports = { createApp, start };
