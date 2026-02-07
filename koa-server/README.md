# koa-server

A small Koa-based GraphQL server used by the UserDashBoard project.
This service exposes a GraphQL endpoint backed by a JSON server (json-server) used as the data store.

## Features

- GraphQL endpoint at `/graphql` (powered by `koa-graphql`)
- Centralized data access via `data/api.js` (uses `axios`)
- Resilient async resolvers with friendly error messages
- Exports `createApp()` and `start()` from `server.js` for easier testing

## Quick start

1. Install dependencies
   ```bash
   cd koa-server
   npm install
   ```

2. Development (auto-reloads)
   ```bash
   npm run dev
   # uses nodemon
   ```

3. Production
   ```bash
   npm start
   ```

4. Open GraphiQL (if NODE_ENV !== production)
   - http://localhost:4000/graphql

## Environment variables

- `PORT` — port to run the server (default: `4000`)
- `JSON_SERVER_URL` — base URL for the json-server data source (default used in code: `http://172.18.0.1:8000`)
- `NODE_ENV` — if not `production`, GraphiQL is enabled

You can create a `.env` file in `koa-server/`:

```
PORT=4000
JSON_SERVER_URL=http://localhost:8000
NODE_ENV=development
```

## Key files

- `server.js` — app factory and startup (`createApp()` / `start()`)
- `schema/schema.js` — GraphQL schema and resolvers
- `data/api.js` — centralized axios client and CRUD functions
- `package.json` — scripts and dependencies

## Notes & recommendations

- The code uses `koa-graphql` which depends on `express-graphql` (deprecated upstream). Consider migrating to `graphql-http` in the future.
- `JSON_SERVER_URL` default may need to be adjusted for your local Docker/network setup.
- `nodemon` is in `devDependencies` for development.

## Troubleshooting

- If GraphQL returns errors about scalar types, verify that the JSON data returns numeric `id` and `age` values (or change `schema.js` to use `GraphQLString`).
- If the app cannot reach the json-server, set `JSON_SERVER_URL` to the correct host/port (Docker-compose networks may require using service names).

## License

MIT
