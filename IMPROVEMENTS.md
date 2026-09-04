# UserDashBoard — Improvement Recommendations

**Date:** 2026-08-29  
**Scope:** Full-repo review of architecture, security, frontend, backend, tests, Docker, and Kubernetes.  
**Context:** Local learning project (React dashboard + NestJS BFF + microservices). Recommendations are ranked for a single developer; “production-hardening” is called out separately from learning value.

---

## 1. What the project is today

UserDashBoard is a local, multi-service analytics dashboard:

```
React (Vite)  →  Nginx  →  BFF Gateway (GraphQL + Socket.IO, :4000)
                              ├─ Auth Service     (:4001)  → json-server
                              ├─ User Service     (:4002)  → MongoDB
                              └─ Analytics Service(:4003)  → json-server
                         Redis (declared, unused)
```

**What is already in good shape**

- NestJS monorepo with four apps and a shared library (`server/apps/*`, `server/libs/shared`).
- BFF pattern: frontend talks GraphQL; domain services stay REST.
- Docker Compose + Kubernetes manifests + Skaffold + `kubernetes/deploy.sh`.
- Helmet, compression, Passport JWT/local strategies, React.lazy, some ARIA on charts.
- Unit tests exist around resolvers, gateway HTTP clients, auth store, and login.

The rest of this document is about closing the gap between that skeleton and a coherent, demo-ready system.

---

## 2. Priority map

| Priority | Theme | Why it matters |
|----------|--------|----------------|
| **P0** | Bugs that break core flows | Add/edit/delete users, live activity chart, tests that cannot pass |
| **P1** | Security holes | Auth is cosmetic; anyone can mint JWTs or mutate data |
| **P2** | Architecture that was planned but not wired | Redis, JWT on GraphQL, health, gRPC, real-time per user |
| **P3** | Frontend quality | Mutations, charts, TypeScript, state, a11y |
| **P4** | Repo / DX / ops | Dead code, images, CI, docs, Compose/K8s hygiene |

Suggested order for a learning project: **P0 → P1 → a thin slice of P2 (JWT + health + Redis) → P3 charts/mutations → P4 cleanup**. Skip gRPC and a service mesh until the REST BFF is solid.

---

## 3. P0 — Bugs that break the product

### 3.1 User IDs do not match MongoDB

Seed data in `mongo-init.js` stores a numeric field `id: 1..10`. The Mongoose schema also has `@Prop() id: number`, but `UserService` looks users up with `findById` / `findByIdAndUpdate` / `findByIdAndDelete` — those operate on Mongo `_id` (ObjectId), not `id`.

`toResponse()` prefers `plainUser.id`:

- Seeded users return `"1"`, `"2"`, … to the UI.
- Newly created users have no `id` field, so the API returns `id: undefined`.
- Edit/delete from the UI then call `/users/1`, which is not a valid ObjectId.

**Fix**

- Drop the duplicate numeric `id` field. Use `_id` as the canonical id and map it in `toResponse` (`String(plainUser._id)`).
- Re-seed without a custom `id`, or add a unique index and look up by that field consistently (`findOne({ id })` everywhere, never mix with `findById`).
- Add a unit test: create → list → get-by-returned-id → update → delete.

### 3.2 GraphQL `deleteUser` query is invalid

In `web/src/hooks/useDataApi.jsx`:

```graphql
deleteUser(id: ${userid})
```

The schema declares `id: String!`. Unquoted values are invalid GraphQL (and a string interpolation hazard). Use variables:

```js
gql`mutation DeleteUser($id: String!) { deleteUser(id: $id) { id } }`
graphQLClient.request(query, { id: userid })
```

Apply the same pattern to `addUser` and `editUser` (they currently interpolate name/age/gender into the query string).

### 3.3 Mutations never refresh the dashboard

`useAddUserApi` / `useEditUserApi` / `useDeleteUserApi` have empty `onSuccess` handlers. After Save/Delete, Jotai `dataState` is stale, so the list, age bar chart, and gender pie chart do not update until a full reload.

**Fix:** on success, either:

- invalidate and re-run `useUserApi`, or
- patch `dataState` (append / replace / filter) and keep `selectedUserState` in sync (after delete, select another user or clear).

React Query is already in the tree; using it as the source of truth for `users` (instead of copying into Jotai) would make this automatic.

### 3.4 Live activity stream is hardcoded to user `1`

`AnalyticsGateway.afterInit()` always calls `getActivities({ id: '1' })` and `streamActivities({ id: '1' })`, then `server.emit('activity_update', …)` to **every** connected client.

Selecting Eve or Tom in the UI fetches their GraphQL snapshot once, then the next SSE tick overwrites the line chart with user 1’s randomized data.

**Fix**

- On Socket.IO `connection`, read `userId` from handshake auth/query.
- Subscribe per client (or per room `user:{id}`).
- Frontend: `io({ query: { userId } })` and reconnect when `selectedUser` changes.
- Stop broadcasting globally.

### 3.5 D3 charts redraw incorrectly

Every chart wrapper (`LineChart`, `BarChart`, `PieChart`, …) does:

```js
useEffect(() => { draw(props); }); // no dependency array
```

That re-runs after every render. `LineChart/vis.jsx` also mutates `d.date` in place with `d3.timeParse`, so the second draw parses `Date` objects as `null` and the line collapses.

`lodash` is imported in the line chart but is **not** in `web/package.json`.

**Fix**

- `useEffect(() => draw(props), [props.data, props.mode, props.width, props.height, props.selected])`.
- Clone data before parsing dates.
- Use a `ref` for the container instead of a global `.vis-linechart` class (two instances would clobber each other).
- Add `lodash` or replace `_.cloneDeep` with `structuredClone` / spread.
- Prefer `d3.select(el).selectAll('*').remove()` on the ref node.

### 3.6 Broken / dead frontend modules

`web/src/utils/index.jsx` is not valid JavaScript:

```js
const {dataState, ...} from './store';  // not an import
const data = useAtomValue(dataState);   // hooks at module scope
```

It is unused. Delete it, or rewrite as a real derived atom (you already have `filteredDataState`).

React style objects use CSS kebab-case (`'border-color'`, `'font-weight'`) in `UserList`. Those are ignored. Use `borderColor` / `fontWeight`.

`UserProfile` uses `for=` instead of `htmlFor=`.

`selectedUserState` is initialized as `""` but consumed as an object (`user?.name`). Initialize to `null`.

### 3.7 Tests that cannot pass as written

| Test | Problem |
|------|---------|
| `web/src/pages/Login/Login.test.jsx` | Expects `fetch('http://localhost/auth/login')`; the app calls `fetch('/auth/login')`. Also expects `navigate('/')` but the app uses `navigate('/', { replace: true })`. |
| `server/test/graphql.e2e-spec.ts` | Imports `UserService` and `RedisCacheService` from `app.service.ts` — those classes do not exist (`UserGatewayService` does). File will fail to compile/load. |
| `web/tests/*.spec.js` (Playwright) | Almost every assertion is commented out. Login/dashboard E2E is a shell. |
| `server/test/app.e2e-spec.ts` | Empty module; only asserts `app` is defined. |

Fix or delete the broken e2e spec; restore the Login test URLs; uncomment Playwright flows against a Compose stack (or mock network in Playwright).

---

## 4. P1 — Security (even for a local demo)

Auth currently looks like JWT but does not protect anything.

### 4.1 GraphQL and REST are wide open

`JwtAuthGuard` exists and is **never applied**. `JwtStrategy` exists. Any client can hit `/graphql` and run `addUser` / `editUser` / `deleteUser` without a token.

**Fix:** `@UseGuards(JwtAuthGuard)` on resolvers (or a global `APP_GUARD` with `@Public()` on login). Pass `Authorization` from the frontend (already done in `useAppGraphQLClient`).

### 4.2 Auth-service mints tokens without a password

`POST /auth/login` on auth-service takes `{ username, userId }` and signs a JWT. Password check only happens on `/auth/validate`. Anyone who can reach port 4001 can mint a token for any userId.

**Fix:** single `POST /auth/login { username, password }` that validates then signs. Remove BFF `debug-login`. Do not expose auth-service ports in Compose for the happy path (keep them internal to `app-network`).

### 4.3 Hardcoded JWT secret

`'SECRET_KEY_PLACEHOLDER'` is in `auth-service` `JwtModule.register` and BFF `jwt.strategy.ts`. They must share one secret from env (`JWT_SECRET`), injected via Compose/K8s Secret — never committed.

### 4.4 Passwords are plaintext; `bcrypt` is unused

`jsonServer/db.json` stores `"password": "password"`. `AuthService.validateUser` does `authRecord.password === pass`. `bcrypt` is in `server/package.json` but never imported.

Hash at seed time (or a one-off script) and `bcrypt.compare` on login. Fine for a learning project; do not leave the comparison as string equality if you show this repo.

### 4.5 CORS, playground, debug endpoint

- BFF: `origin: true` (reflect any Origin) + `credentials: true`.
- Socket.IO: `origin: '*'`.
- GraphQL `playground: true` with Helmet — CSP often breaks Playground; in any non-dev env disable playground/introspection.
- `POST /auth/debug-login` returns raw upstream login payloads.

Lock CORS to `http://localhost` / `http://localhost:3000` in Compose. Drop debug routes. Disable playground when `NODE_ENV=production`.

### 4.6 Secrets in git

- `compose.yaml` embeds `mongodb://admin:password@mongodb:27017/...`.
- `kubernetes/manifests/secrets.yaml` is only base64 (`admin` / `password`) — that is not encryption.
- `.env` is gitignored (good) but Compose does not use it for Mongo credentials.

Use `env_file` / Compose secrets / `stringData` generated at deploy time. Document demo credentials in README, not in committed Secret YAML (or use Sealed Secrets / SOPS if you want the K8s learning).

### 4.7 GraphQL injection

String-built mutations in `useDataApi.jsx` are injectable (`name: "${user.name}"`). Always use GraphQL variables. Add a test that a name containing `"` cannot break the mutation.

---

## 5. P2 — Architecture: finish what the design already promised

`context.md` and `design-plan.md` describe Redis caching, JWT at the BFF, health probes, gRPC, and per-user WebSockets. The repo has the folders and env vars; most of the behavior is missing.

### 5.1 Redis is deployed and never used

Compose and K8s run Redis. BFF sets `REDIS_HOST` / `REDIS_PORT`. `@nestjs/cache-manager` and `cache-manager-redis-store` are dependencies. **No service injects a cache.** The GraphQL e2e test still mocks a `RedisCacheService` that was deleted.

**Learning-sized slice**

- Cache `GET /users` and `activities(id)` in the BFF for 5–15s.
- Invalidate on add/edit/delete.
- One integration test with a fake cache manager.

Do not persist Redis for this demo unless you want to practice PVCs (you already have them).

---

## BFF assessment: is the BFF pattern properly implemented?

### Summary

The project has a BFF-shaped architecture, but it is not a fully disciplined BFF implementation yet.

### What is working

- There is a dedicated gateway layer at `server/apps/bff-gateway/src/app.module.ts` and `server/apps/bff-gateway/src/user.module.ts`.
- `UserGatewayService` calls the user service, and `ActivityService` calls the analytics service.
- GraphQL resolvers in `server/apps/bff-gateway/src/app.resolver.ts` act as a front-end-facing façade.
- This is consistent with the BFF idea: clients talk to one gateway, while backend services remain internal.

### What is not fully proper BFF behavior

1. It is still a thin orchestration layer, not a strong client-specific contract.
   - The gateway composes direct calls, but it does not strongly hide downstream API differences or define a clearly frontend-optimized DTO layer.

2. Auth is split across separate modules, which is acceptable but not fully integrated.
   - See `server/apps/bff-gateway/src/auth/auth.module.ts` and `server/apps/bff-gateway/src/auth/auth.service.ts`.
   - The BFF owns auth, but the contract is still somewhat backend-shaped.

3. Debug and raw backend leak endpoints exist.
   - `server/apps/bff-gateway/src/auth/auth.controller.ts` exposes `debug-login` and `rawRestLogin`, which undermines the idea of clean BFF boundaries.

4. Environment defaults are inconsistent.
   - `UserGatewayService` defaults to `http://user-service:4002`.
   - `ActivityService` defaults to `http://analytics-service:4003`.
   - `AuthService` defaults to `http://localhost:4001`.
   - In Docker, `localhost` is typically not the correct upstream service hostname.

5. The BFF is not yet enforcing a strict frontend-safe API contract.
   - The code still exposes backend-shaped details in some responses.
   - There is no centralized DTO transformation policy for every UI use case.

### Recommendation

This is a BFF-like implementation, but not a fully proper BFF yet.

To bring it closer to a real BFF architecture:

- keep all client traffic locked to the gateway
- remove debug/raw-backend endpoints
- centralize downstream URL config via env-driven config
- map backend data to client-friendly DTOs inside the BFF
- enforce auth and error handling at the BFF boundary
- treat the user-service / auth-service / analytics-service as internal dependencies only

### Bottom line

The repo already contains the BFF structure, but it still behaves more like a facade/proxy layer than a completed, client-specific API boundary.

---

## RxJS and Zod: where to use them in this project

### RxJS

Best fit: the server-side orchestration and streaming layer.

Recommended locations:

- `server/apps/bff-gateway/src/app.service.ts`
  - already uses `Observable` and `firstValueFrom`
  - this is the natural place for retry logic, timeout handling, fallback requests, and stream orchestration
- `server/apps/analytics-service/src/analytics.controller.ts`
  - already uses `from(...)` and `switchMap(...)`
  - this is the ideal place for async stream/event-driven composition

Why this is the right place:

- the BFF already composes downstream HTTP calls
- the analytics service already exposes stream-based data flow
- RxJS adds the most value around orchestration, retries, cancellation, and event streams

Good patterns to apply:

- `from(httpCall).pipe(...)`
- `switchMap` for latest-request-wins behavior
- `catchError` for normalizing downstream failures
- `retryWhen` for transient service failures
- `Observable` wrappers for SSE or long-lived streams

### Zod

Best fit: validation at the BFF edge and shared DTO layer.

Recommended locations:

- `server/libs/shared/src/`
  - create shared schemas such as `user.schema.ts`, `auth.schema.ts`, `activity.schema.ts`, and export them from `index.ts`
- `server/apps/bff-gateway/src/app.resolver.ts`
  - validate GraphQL input before invoking downstream services
- `server/apps/bff-gateway/src/auth/auth.controller.ts`
  - validate login payloads and auth requests at the API boundary
- `server/apps/bff-gateway/src/user-rest.adapter.ts`
  - validate adapted payloads before sending to user-service

Why this is the right place:

- the BFF is the boundary where the UI contract meets internal service contracts
- Zod protects the system from malformed inputs, missing fields, bad IDs, invalid ages/genders, and bad auth payloads
- it prevents weak or unsafe call patterns before requests reach microservices

Recommended pattern:

1. Receive raw input at resolver/controller
2. Validate with `schema.parse(...)`
3. Convert to a backend-safe DTO
4. Call BFF/internal service only with validated data

### Final recommendation

Use:

- RxJS for async orchestration and streaming on the server
- Zod for runtime validation at API boundaries and shared schema contracts

Keep React Query + Jotai for UI state; do not push the core async flow into the frontend unless the project grows significantly.


### 5.2 Health checks are incomplete

Only BFF has `/health`. Auth, user, and analytics have none. K8s probes are `tcpSocket` on the listen port — a process can accept TCP and still be unable to reach Mongo/json-server.

Add `/health` (liveness) and `/ready` (Mongo ping, json-server ping, Redis ping) on every service. Point K8s `httpGet` at those paths. Include downstream status in BFF `/ready` so Nginx does not send traffic to a gateway that cannot reach users.

### 5.3 Internal HTTP clients are fragile

`ActivityService` and `AuthService` iterate a hardcoded URL list (`env`, Docker DNS name, `localhost`). That hides misconfiguration and makes tests order-dependent (`auth.service.spec.ts` assumes localhost is tried first; env can change that).

**Fix:** one `AUTH_SERVICE_URL` / `USER_SERVICE_URL` / `ANALYTICS_SERVICE_URL` / `JSON_SERVER_URL` per environment. Fail fast. Use Nest `HttpModule.register({ timeout, maxRedirects })` and a small retry interceptor if you want resilience.

### 5.4 BFF is a leaky proxy, not an aggregator

The design calls for `dashboardOverview`, `chartData`, shaped payloads for D3. Today the BFF re-exposes `users` and `activities` 1:1. That is fine as a first step; the next learning win is one aggregated query:

```graphql
query Dashboard($userId: ID!) {
  dashboard(userId: $userId) {
    users { id name age gender }
    selected { id name age gender }
    activities { date count }
    genderCounts { label count }
  }
}
```

That cuts the frontend from several round trips and is the actual point of a BFF.

### 5.5 gRPC — defer it

Dockerfile comments mention proto files; `libs/` has none. Internal traffic is REST. For a single-node Minikube learning app, REST is the right internal transport until JWT, health, and IDs are fixed. When you do gRPC:

- Contract-first `.proto` in `libs/shared`.
- Nest microservice + client proxy in the BFF.
- Keep GraphQL as the only browser-facing API.

### 5.6 Dual API surface

Nginx routes `/user`, `/users`, `/activities` to the BFF, but the BFF has no REST controllers for those paths (only GraphQL + `/auth` + `/health`). Either add REST adapters or delete those locations from `nginx.conf` / Ingress so the documented API matches reality.

### 5.7 json-server vs Mongo

Users live in Mongo; auth and activity live in json-server. Analytics maps any id with `((numId - 1) % 10) + 1`, so user 11 silently shows user 1’s series. That is confusing in a demo.

Pick one:

- Keep json-server as a fixture store, but key activities by the real user id (or return empty with a visible “no activity” state).
- Or generate mock series in analytics-service from the user id without a 10-row modulo.

### 5.8 `koa-server` is a leftover stack

The live backend is NestJS. `koa-server/` is the previous GraphQL server (hardcoded Redis `172.18.0.1`, axios 0.21, `koa-graphql`). It is not in Compose.

**Move it to a `legacy/` folder or delete it** so newcomers do not start the wrong server on port 4000.

Same for `apps/bff-gateway/src/schemas/schema.gql` at the **repo root** (duplicate of `server/apps/bff-gateway/...`).

---

## 6. P3 — Frontend

### 6.1 Data layer

- `react-query` v3 is superseded by `@tanstack/react-query` v5. The upgrade is mechanical and gives better DevTools.
- `jotai` is on v1; current is v2 (store API, `useAtomValue` already used).
- Creating a `new GraphQLClient` inside `useAppGraphQLClient` on every render is wasteful; memoize on `token`.
- Prefer `useQuery` for `users` / `activities` instead of `useMutation` that only GETs.
- Socket.IO is not proxied in `vite.config.js` (only `/auth` and `/graphql`). Local `vite` dev will not receive `activity_update` unless you go through Nginx. Add a `/socket.io` proxy with `ws: true`.

### 6.2 Auth UX

- JWT in `localStorage` is XSS-readable. For a demo, acceptable; document it. HttpOnly cookie via BFF is the next step.
- `ProtectedRoute` only checks token presence, not expiry. Decode `exp` or call `/auth/me`.
- Login placeholders leak demo credentials (`Username (Admin)`, `Password (password)`). Fine for local; move to README.
- Logout does not disconnect the socket.

### 6.3 UI / UX

- Layout is a wall of fixed heights (`height: 200/300/400/600`) and chart widths (`1100`, `1000`). It does not reflow. Use CSS grid + `ResizeObserver` (or `useContainerSize`) so D3 reads actual pixel size.
- Typo: “User Acivities”.
- Dark mode lives in memory only; persist `modeState` to `localStorage`.
- No error boundary, no empty state (“no users match filters”), no mutation error toast (antd `message` is only used on login).
- `Filters` “Check all” starts `indeterminate: true` even though all three genders are selected — initial state is wrong (`checkAll` should be `true`, `indeterminate` false).
- Age slider has no label of the current cutoff value.
- `UserProfile` add/edit is unvalidated (empty name, non-numeric age).

### 6.4 Charts

- Imperative D3 + React is fine for learning; wrap with a `useD3(ref, draw, deps)` hook so every chart does not copy the same `useEffect`.
- `MyChart` and `ScatterPlot` are unused. Keep as examples or delete.
- Pie legend uses `color(i)` (index) while slices use `color(d.data.label)` — legend colors can disagree.
- No axes titles, no tooltip, no empty-data guard (`d3.max` of `[]` is undefined → NaN scales).
- Dates in fixtures are `"2018-10-2"` (not zero-padded). `d3.timeParse("%Y-%m-%d")` may fail depending on d3 version; normalize to ISO `YYYY-MM-DD`.

### 6.5 TypeScript and components

Frontend is JSX with no prop types. Migrating `web/` to TS (Vite already can) would catch `selectedUser` as `string | User`, style keys, and GraphQL result shapes. Generate types from the BFF schema (`graphql-codegen`) — high learning value, low runtime risk.

Split `useDataApi.jsx` (user CRUD + socket + GraphQL client in one file) into `useUsers`, `useActivities`, `useActivitySocket`.

### 6.6 Accessibility

Some ARIA exists on the dashboard and bar/pie charts. Remaining gaps:

- Login form has no `aria-invalid` / error live region (antd helps a bit).
- User list items are `role="button"` inside a `List` — prefer `listbox` / `option` or a real `button`.
- Charts are not keyboard-operable; at least keep the HTML list as the accessible selection control (already true) and treat SVG as `aria-hidden` if the list is the source of truth.
- Color-only encoding of the selected bar; add a pattern or label.

---

## 7. P4 — Repo, Docker, Kubernetes, DX

### 7.1 Repository hygiene

| Item | Issue |
|------|--------|
| `~/` Chrome profile | Local browser profile under the repo (`chrome-dev-disabled-security`). `.gitignore` has `/~` but the directory is still on disk. Do not commit it. |
| `skaffold` binary | ~130 MB untracked binary next to `skaffold.yaml`. Install Skaffold via package manager; do not keep the binary in the project tree. |
| Dual lockfiles | `server/` has `pnpm-lock.yaml`; `web/` has npm scripts and historically `package-lock.json` (gitignored). Pick **pnpm** (already used in Docker/Playwright) and commit one lockfile per package. |
| No root workspace | No root `package.json` / `pnpm-workspace.yaml`. `pnpm-workspace` with `web`, `server`, `jsonServer` would give one install command. |
| README | Still describes “React + D3 + koa + redis” and “MongoDB commented out”. Compose now runs four Nest apps + Mongo. Rewrite the README around current services, ports, demo login, and `docker compose up --build`. |
| `context.md` vs `design-plan.md` | Overlapping, partly stale (claims TypeScript strict mode; `tsconfig` has `strictNullChecks: false`, `noImplicitAny: false`). Keep one architecture doc; move “done vs todo” into this file or GitHub issues. |
| `index.html` at repo root | Unused leftover (real app is `web/index.html`). |
| `webpack.config.js` | Vite is the bundler. Remove webpack unless something still imports it. |
| `chrome-dev.sh` | Gitignored; purpose unclear. Document or drop. |

### 7.2 TypeScript is not strict

`server/tsconfig.json` disables `strictNullChecks`, `noImplicitAny`, `strictBindCallApply`. `context.md` claims strict mode. Turn flags on incrementally, starting with new files. Replace `Promise<any>` on every service method with DTO types from `libs/shared`.

`UserDTO.age` is a GraphQL `Float` in the generated schema (`age: Float!`) because `@Field()` was used without `Int`. Use `@Field(() => Int)`.

No `class-validator` / `ValidationPipe` anywhere. Add global `ValidationPipe({ whitelist: true, transform: true })` and DTO classes on REST bodies.

### 7.3 Docker images

**Frontend `web/Dockerfile`**

- Single stage, `node:20` (Debian), `npm cache clean --force`, `npm install --legacy-peer-deps`, then `CMD ["npm", "start"]` which runs **Vite dev server** in the container.
- Production image should be: build with Vite → `nginx:alpine` serving `dist/`, or at least `vite preview`.
- Pass `VITE_API_TARGET` at **build** time if the client ever inlines it; today the browser talks same-origin `/graphql` via Nginx, so the container env var is unused at runtime (Vite env is compile-time). Document that.

**Backend `server/Dockerfile`**

- Builds all four apps, then `node dist/apps/${APP_NAME}/main`. Good pattern.
- Comment about copying proto files is stale.
- `pnpm install` in the builder without `--frozen-lockfile`.
- Production stage still installs using the full `package.json` (includes some packages only needed to compile). Use `pnpm deploy` or a pruned export.
- No `USER node`; processes run as root.
- Alpine + native modules (`bcrypt`) can break; you already use Alpine — pin `python3 make g++` in builder if bcrypt is actually used.

**json-server** uses `node:20` full image for a tiny mock. `node:20-alpine` is enough.

**Nginx** uses `nginx:latest`. Pin `nginx:1.27-alpine`.

**Compose**

- `web-app` and `jsonServer-app` **are** on `app-network` (README says they are not).
- No `depends_on` from BFF to auth/user/analytics — gateway can start and fail first requests. Add `depends_on` (service_started is enough; you cannot health-check until those services expose `/health`).
- Publish Redis `6379` and Mongo `27017` to the host. Fine for learning; mention in README. Do not publish auth/user/analytics if the BFF is the only client (currently they are not published — good).
- `restart: unless-stopped` is fine. Add `mem_limit` if you want to mimic Minikube pressure.

### 7.4 Kubernetes

- Probes should be HTTP, not TCP (see 5.2).
- No `resources.requests/limits` — Minikube will overcommit easily. Start with ~128–256Mi per Node app, 256–512Mi Mongo.
- `image: nginx:latest` without `imagePullPolicy` will try to pull; backend images correctly use `IfNotPresent`.
- `LoadBalancer` + `nodePort: 30080` on nginx, **and** a separate Ingress to `web-app` / `bff-gateway`. Pick one entrypoint for the demo (Ingress **or** the nginx proxy, not both) to avoid two conflicting paths.
- Secrets as committed base64 (see 4.6).
- Mongo init ConfigMap duplicates `mongo-init.js`. Generate from the file or kustomize `configMapGenerator`.
- Skaffold builds the same `server/` context **four times** into four tags. `deploy.sh` already builds once and retags — teach Skaffold the same trick (`requires` / one artifact + custom tags) or use one image with `APP_NAME`.
- No NetworkPolicy, no namespace. Optional for learning; a `userdashboard` namespace would keep Minikube tidy.

### 7.5 Observability

No structured logs, no request id, no Prometheus. `console.log` of usernames and tokens in auth paths.

Minimum useful slice:

- Nest `Logger` with a request-id middleware.
- Do not log tokens or passwords (auth-service currently logs validate payloads).
- Optional: one Grafana/Prometheus stack later (Phase 5 in `context.md`). Not needed until services are healthy.

### 7.6 CI

There is no GitHub Actions / Forgejo / etc. workflow. A small pipeline would catch the broken e2e import immediately:

```yaml
# sketch
- pnpm --dir server test
- pnpm --dir web test
- pnpm --dir server lint
- docker compose config
```

Playwright can run in CI against Compose once P0 tests are real.

### 7.7 Dependency cleanup (`server/package.json`)

Both `@apollo/server` (v4) and `apollo-server-express` (v3) are listed. Nest 13 uses Apollo 4 — drop v3.

`ioredis` and `cache-manager-redis-store` overlap; pick one stack when you wire Redis.

`axios` is used directly in auth/analytics while BFF uses `HttpService` (also axios). Standardize on `HttpService` for testability.

---

## 8. Suggested implementation sequence

A realistic path for one developer, ~2–4 week slices. Each slice should leave `docker compose up` demoable.

### Slice A — Make the demo honest (P0)

1. Fix user id mapping (`_id` ↔ GraphQL `id`).
2. GraphQL variables for all mutations; refetch users after CUD.
3. Per-user Socket.IO rooms; Vite `/socket.io` proxy.
4. D3 `useEffect` deps + clone-before-parse; add `lodash` or remove it.
5. Delete `web/src/utils/index.jsx`; fix React style keys.
6. Repair Login unit test and GraphQL e2e imports.

### Slice B — Auth that actually authenticates (P1)

1. `JWT_SECRET` from env, shared by auth-service and BFF.
2. One login mutation/route that checks password (bcrypt).
3. `JwtAuthGuard` on GraphQL resolvers.
4. Remove `debug-login`; lock CORS; disable playground in prod.
5. Stop publishing implicit trust on auth-service `POST /auth/login`.

### Slice C — Operability (P2 lite)

1. `/health` + `/ready` on all four Nest apps; HTTP probes in K8s.
2. Redis cache on `users` and `activities` in the BFF.
3. Single env URL per downstream service (no URL fallback loops).
4. Nginx locations only for routes that exist.
5. Rewrite README; archive `koa-server`.

### Slice D — Frontend quality (P3)

1. `useQuery` for users/activities; split hooks.
2. Responsive chart hook; empty/error states; fix filter checkbox init.
3. graphql-codegen + gradual TS migration of `web/src`.
4. Persist theme; fix copy (“Activities”).

### Slice E — Optional learning stretch

1. Aggregated `dashboard` GraphQL query.
2. gRPC between BFF and user/auth/analytics.
3. Helm chart instead of raw manifests.
4. Prometheus + Grafana on Minikube.
5. Playwright happy path: login → select user → see chart → logout.

---

## 9. What not to do yet

- **Do not** add Kafka/NATS, a service mesh, or multiple replicas until IDs, auth, and health work on one replica.
- **Do not** treat committed K8s Secrets as production practice.
- **Do not** keep both Koa and Nest as “the backend” in docs.
- **Do not** expand json-server into a real DB; it is a fixture.
- **Do not** enable TypeScript `strict` on the whole server in one PR without a dedicated cleanup — it will be noisy. Turn it on for `libs/shared` first.

---

## 10. File-level checklist

Quick index of the highest-signal files to touch:

| File | Change |
|------|--------|
| `server/libs/shared/src/schemas/user.schema.ts` | Canonical id; remove duplicate `id` or document it |
| `server/apps/user-service/src/user.service.ts` | Lookup by the same id the API returns |
| `server/apps/bff-gateway/src/app.resolver.ts` | JWT guard; typed DTOs |
| `server/apps/bff-gateway/src/analytics.gateway.ts` | Per-socket userId; rooms |
| `server/apps/bff-gateway/src/auth/*` | Env secret; delete debug login |
| `server/apps/auth-service/src/auth.controller.ts` | Login must validate password |
| `server/apps/auth-service/src/auth.module.ts` | `JWT_SECRET` |
| `web/src/hooks/useDataApi.jsx` | Variables, refetch, memoized client, socket query |
| `web/src/components/charts/*/index.jsx` | Effect deps |
| `web/src/components/charts/LineChart/vis.jsx` | Do not mutate dates; drop or declare lodash |
| `web/vite.config.js` | `/socket.io` proxy |
| `web/Dockerfile` | Multi-stage static serve |
| `compose.yaml` | `JWT_SECRET`, health, `env_file` |
| `nginx.conf` | Drop unused REST paths; keep `/graphql`, `/auth`, `/socket.io` |
| `kubernetes/manifests/*` | HTTP probes, resources, one ingress path |
| `server/test/graphql.e2e-spec.ts` | Import real classes or delete |
| `web/src/pages/Login/Login.test.jsx` | Match actual `fetch` URL |
| `README.md` | Current architecture and how to run |
| `koa-server/` | Archive or delete |

---

## 11. Summary

The project already demonstrates a credible **BFF + microservices** layout for local learning. The main gaps are not “more infrastructure” — they are **correctness and honesty of the demo**:

1. User identity is inconsistent between Mongo and the API.
2. Auth is present in the dependency tree but not enforced.
3. Real-time updates ignore the selected user.
4. Redis, health, and gRPC are documented as if they existed.
5. Tests and README describe an older or idealized system.

Closing slices A–C would make this a strong portfolio piece: a dashboard that really logs in, really mutates users, really streams the selected user’s activity, and really restarts cleanly under Compose and Minikube. Slices D–E are optional polish and extra learning, not prerequisites.
