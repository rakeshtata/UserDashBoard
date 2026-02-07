# koa-server — Context & design notes

Purpose
- Small Koa-based GraphQL wrapper used by the UserDashBoard workspace.
- Provides a GraphQL endpoint backed by a json-server mock data source.

What changed (2025-10-30)
- Added `data/api.js` — centralized axios client and CRUD helpers (fetchUsers, fetchUserById, fetchActivities, addUser, editUser, deleteUser). Purpose: single place for network config and retries/timeouts later.
- Rewrote `schema/schema.js` — resolvers now use async/await, import the data module, use GraphQLInt for numeric fields, and include friendly error messages.
- Refactored `server.js` — added `createApp()` / `start()` exports, environment loading via `dotenv`, `koa-bodyparser` and `@koa/router` usage, and graceful shutdown handlers.
- Updated `package.json` — improved scripts (`dev` uses nodemon, `start` uses node), moved `nodemon` to devDependencies, and added runtime deps required by `server.js`.
- Added `README.md` for developer quick-start and notes.

Assumptions
- json-server (mock API) runs separately (default code expects `JSON_SERVER_URL` env var or fallback `http://172.18.0.1:8000`).
- `id` and `age` values in the JSON data are numeric. If they are strings, schema types must be adjusted.
- The project runs in local development or Docker. The default json-server URL may need changing when using Docker Compose.

Design rationale
- Centralizing network calls makes testing and retries easier and keeps schema focused on GraphQL logic.
- Exporting `createApp()` makes the server testable without starting a real HTTP listener.
- Moving dev tools (nodemon) to devDependencies keeps production installs lean.
- Keeping `koa-graphql` for now to minimize breaking changes; noted as a follow-up to migrate off deprecated upstream packages.

Known issues & next steps
- `koa-graphql` depends on `express-graphql` which is deprecated; consider migrating to `graphql-http`.
- Add unit tests for schema resolvers (mock `data/api.js`) and an integration test that spins up json-server.
- Add retries and better error classification in `data/api.js` (e.g., handle 404 vs 5xx differently).
- Consider adding logging (pino/winston) and request correlation IDs.
- Add Dockerfile / docker-compose snippet or a README section showing how to run `json-server` and `koa-server` together for local development.

How to run quickly (local dev)
1. Start json-server (in repo root example):
   - `cd jsonServer && npm install && npm run start`
2. Start koa-server:
   - `cd koa-server && npm install && npm run dev`
3. Open GraphiQL at `http://localhost:4000/graphql`

Contact / author notes
- Changes were made to improve testability and separation of concerns. If you want these applied differently (e.g., keep original structure but add tests), say so and I’ll adjust.
