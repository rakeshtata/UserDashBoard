# UserDashBoard Architecture Design Plan

## Overview
This document defines the future architecture for UserDashBoard as a local Ubuntu development project.
It focuses on a **BFF + Microservices** design while preserving the current **React Query + GraphQL** frontend pattern.

## Project Context
- **Platform**: Local Ubuntu development
- **Developer**: Single developer
- **Data**: Mock data via `json-server` and local event generators
- **Current stack**: React + Vite + GraphQL + React Query + NestJS + Redis + MongoDB + Docker Compose
- **Goal**: Add a learnable microservices and BFF layer without breaking frontend architecture

## High-Level Architecture

```
Frontend (React + React Query)
             ↓
      Dashboard BFF (GraphQL)
             ↓
  ┌──────────┼───────────┬───────────┐
  ↓          ↓           ↓
Auth     User      Analytics
Service  Service   Service (WebSocket)
```

## Service Design

### 1. Dashboard BFF
**Role:** Frontend-facing GraphQL gateway

**Responsibilities:**
- Expose a single GraphQL endpoint for the frontend
- Aggregate responses from backend microservices
- Shape payloads for dashboard widgets and D3 charts
- Handle authentication and authorization checks
- Cache key dashboard responses in Redis
- Support frontend-friendly GraphQL queries

**Key endpoints/schema:**
- `Query.dashboardOverview(userId: ID!): DashboardOverview`
- `Query.chartData(userId: ID!, range: DateRange): ChartData`
- `Query.notifications(userId: ID!): [Notification]`
- `Mutation.updateProfile(input: ProfileInput!): User`
- `Mutation.markNotificationRead(id: ID!): Notification`

**Why this fits:**
- Keeps React Query + `graphql-request` unchanged
- Keeps frontend API contract simple
- Hides microservice composition from the UI
- Lets backend services remain domain-focused

### 2. Auth Service
**Role:** Authentication and session management

**Responsibilities:**
- Login, logout, JWT issuance, refresh
- Validate tokens for downstream requests
- Expose auth metadata to the BFF

**Possible routes:**
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/validate`
- `GET /auth/me`

### 3. User Service
**Role:** User profile and preferences

**Responsibilities:**
- User data retrieval and updates
- Preferences and dashboard configuration
- Mock user metadata source for frontend

**Possible routes:**
- `GET /users/:id`
- `GET /users/:id/preferences`
- `PUT /users/:id`

### 4. Analytics Service
**Role:** Dashboard metrics, chart aggregation, and real-time WebSocket updates

**Responsibilities:**
- Produce chart-ready payloads for D3
- Compute metrics and time-series summaries
- Serve the BFF with ready-to-render analytics data
- Handle WebSocket connections for live updates
- Fetch initial analytics snapshot for new clients
- Push incremental updates via WebSocket
- Subscribe to event streams or generate mock live data

**Possible routes:**
- `GET /analytics/dashboard`
- `GET /analytics/metrics`
- `GET /analytics/chart-data?range=...`
- `WebSocket /analytics/live` (for real-time updates)

**Event examples:**
- `user.created`
- `user.updated`
- `dashboard.viewed`
- `data.analyzed`

## Integration Strategy

### Frontend to BFF
- Frontend continues to use `graphql-request` with a single GraphQL endpoint:
  - `http://localhost/graphql`
- `react-query` remains responsible for caching and stale data handling
- BFF provides aggregated data for each query

### BFF to Microservices
- **Preferred internal transport:** REST for simplicity in local dev
- **Optional internal transport:** gRPC for learning stronger contracts
- BFF calls backend services to assemble dashboard responses

### Real-Time Data Flow
- `notification-service` handles WebSocket connections for live updates
- On connect, the socket server fetches `initial_data` from analytics (using jsonServer mock data) and sends it immediately
- `analytics-service` generates mock incremental `update` events internally (e.g., simulated user activity or metric changes)
- `dashboard-bff` can optionally proxy the WebSocket or expose a GraphQL fallback query for initial load

### Analytics WebSocket Implementation Plan
- Add a backend socket gateway in `analytics-service`:
  - authenticate client on connect
  - request initial analytics snapshot from jsonServer mock data
  - emit `initial_data` payload as the first message
  - generate mock live events internally (e.g., periodic updates to metrics or activity data)
  - emit `update` messages containing simulated changes
  - send `heartbeat` messages to keep connections alive
- Add frontend socket support in `web/src/hooks/`:
  - connect to `ws://localhost:4003/analytics` or `wss://` via Socket.IO/native WebSocket
  - wait for `initial_data` before rendering analytics charts
  - merge `update` payloads into `analyticsState` in Jotai
  - reconnect automatically with exponential backoff
- Keep existing GraphQL queries as a fallback for users and chart hydration

### WebSocket Implementation Details (NestJS + GraphQL)

#### Backend (NestJS Server)
1. Install dependencies:
   ```bash
   npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
   ```

2. Create `analytics.gateway.ts`:
   ```typescript
   import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
   import { Server, Socket } from 'socket.io';
   import { AnalyticsService } from './analytics.service';

   @WebSocketGateway({ cors: true })
   export class AnalyticsGateway {
     @WebSocketServer()
     server: Server;

     constructor(private readonly analyticsService: AnalyticsService) {}

     handleConnection(client: Socket) {
       console.log(`Client connected: ${client.id}`);
       // Authenticate if needed
       // Fetch initial data
       const initialData = this.analyticsService.getInitialAnalytics();
       client.emit('initial_data', initialData);
     }

     handleDisconnect(client: Socket) {
       console.log(`Client disconnected: ${client.id}`);
     }

     @SubscribeMessage('subscribe')
     handleSubscribe(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
       // Start sending updates
       setInterval(() => {
         const update = this.analyticsService.generateMockUpdate();
         client.emit('update', update);
       }, 5000); // Every 5 seconds
     }
   }
   ```

3. Wire in `app.module.ts`:
   ```typescript
   import { AnalyticsGateway } from './analytics.gateway';

   @Module({
     providers: [AnalyticsGateway, AnalyticsService],
   })
   export class AppModule {}
   ```

#### Frontend (React Web)
1. Install dependencies:
   ```bash
   npm install socket.io-client
   ```

2. Create `useAnalyticsSocket.jsx` hook:
   ```jsx
   import { useEffect, useRef } from 'react';
   import io from 'socket.io-client';
   import { useSetAtom } from 'jotai';
   import { analyticsState } from '../store';

   export function useAnalyticsSocket(userId) {
     const socketRef = useRef(null);
     const setAnalytics = useSetAtom(analyticsState);

     useEffect(() => {
       socketRef.current = io('http://localhost:4000'); // Adjust port

       socketRef.current.on('initial_data', (data) => {
         setAnalytics(data);
       });

       socketRef.current.on('update', (update) => {
         setAnalytics((prev) => ({ ...prev, ...update }));
       });

       socketRef.current.on('heartbeat', () => {
         // Handle heartbeat
       });

       socketRef.current.emit('subscribe', { userId });

       return () => {
         socketRef.current.disconnect();
       };
     }, [userId, setAnalytics]);

     return { socket: socketRef.current };
   }
   ```

3. Use in `Dashboard.jsx`:
   ```jsx
   import { useAnalyticsSocket } from './hooks/useAnalyticsSocket';

   const Dashboard = () => {
     const { socket } = useAnalyticsSocket(selectedUser?.id);
     // Render charts using analyticsState
   };
   ```

This integrates WebSocket with your existing NestJS GraphQL setup and React Jotai state management.

### Caching and Optimization
- Use Redis in the BFF layer to cache dashboard snapshot payloads
- Cache `analytics:init:<userId>` snapshots for a few seconds to reduce repeated service calls
- Send differential update messages instead of full state on every mock event
- Batch mock event updates into periodic socket updates if needed

## Local Development Plan

### Phase 1: Core Microservices
- Create `auth-service`, `user-service`, `analytics-service`
- Keep `dashboard-bff` minimal
- Start with Docker Compose

### Phase 2: BFF Implementation
- Build GraphQL schema in `dashboard-bff`
- Implement one aggregated endpoint (`dashboardOverview`)
- Wire frontend to the BFF

### Phase 3: Real-Time Support
- Add `notification-service` or extend `server/` with a WebSocket gateway
- Expose WebSocket support for live analytics and notifications
- Implement initial analytics snapshot delivery from `analytics-service`
- Integrate local event publishing for incremental `update` messages
- Wire frontend socket connection in `web/src/hooks/`, with state stored in `web/src/store`
- Keep GraphQL query fallback available for page load and reconnect recovery

### Phase 4: Event Streaming
- Implement mock event generation within `analytics-service`
- Use jsonServer data as the basis for simulated updates
- Generate periodic mock events (e.g., new user activities, metric changes)
- Broadcast updates via WebSocket to connected clients

### Phase 5: Optional Kubernetes Migration
- Use Minikube only after 3-4 services are stable

## Kubernetes Readiness Plan

### Goals
- Transition the existing Docker Compose architecture to Kubernetes-friendly deployments
- Preserve service isolation for frontend, backend, caching, and persistence
- Add health checks, config management, and persistent storage definitions
- Keep the current runtime behavior while enabling cluster-based deployment

### What to modernize
- Separate runtime images for each NestJS app by using shared `server/` image with `APP_NAME`
- Use Kubernetes `Service` discovery instead of Docker Compose network aliases
- Move secret values into Kubernetes `Secret`s
- Add `Deployment` probes for liveness and readiness
- Use `PersistentVolumeClaim`s for MongoDB and optionally Redis
- Expose external traffic via an `Ingress` or `LoadBalancer` service

### Recommended K8s resources
- `Deployment/web-app`
- `Deployment/bff-gateway`
- `Deployment/auth-service`
- `Deployment/user-service`
- `Deployment/analytics-service`
- `Deployment/jsonserver-app`
- `Deployment/nginx`
- `Deployment/redis`
- `Deployment/mongodb`

- `Service/web-app`
- `Service/bff-gateway`
- `Service/auth-service`
- `Service/user-service`
- `Service/analytics-service`
- `Service/jsonserver-app`
- `Service/nginx`
- `Service/redis`
- `Service/mongodb`

### Key changes from Docker Compose
- Remove `container_name` usage entirely
- Use K8s `ConfigMap` / `Secret` for runtime environment variables
- Keep `nginx.conf` routing, but target service hostnames in-cluster
- Prefer `Ingress` routing to `nginx` rather than publishing ports directly
- Preserve existing app ports and GraphQL endpoint structure

### Health and readiness
- Add simple health routes to each NestJS service, e.g. `/health` or `/status`
- Configure `livenessProbe` and `readinessProbe` on backend deployments
- Redis probe: `exec: ["redis-cli", "ping"]` or `tcpSocket: [{ port: 6379 }]`
- MongoDB probe: `exec: ["mongosh", "--eval", "db.adminCommand('ping')"]`

### Storage
- `mongodb` should mount a `PersistentVolumeClaim` to `/data/db`
- `redis` can use a PVC for persistence, or remain ephemeral for dev
- Do not use hostPath in production; use dynamic storage classes

### Deployment strategy
1. Build and push container images for: `web-app`, `dashboard-bff`, `auth-service`, `user-service`, `analytics-service`, `jsonserver-app`
2. Start with a local dev cluster: `minikube`, `kind`, or `microk8s`
3. Deploy `mongodb`, `redis`, then backend services
4. Deploy `web-app` and `nginx` last, verify ingress routing
5. Validate service-to-service traffic and frontend connectivity

### Optional simplification
- Keep `nginx` for local cluster proxying
- Or replace it with native Kubernetes `Ingress` rules if you want simpler cloud-native routing
- If you use an Ingress controller, map `/` to `web-app` and `/graphql` + backend paths to `bff-gateway`

### Next step
Add a dedicated `k8s/` directory with manifest files for the first deployment target:
- `k8s/mongodb.yaml`
- `k8s/redis.yaml`
- `k8s/backend-deployments.yaml`
- `k8s/frontend.yaml`
- `k8s/ingress.yaml`
- `k8s/secrets.yaml`

This preserves the current architecture while making it cluster-ready for Kubernetes deployment.

## Docker Compose to Kubernetes migration steps

This section tracks the migration plan from Docker Compose to a local Kubernetes environment.

### Status Legend
- ⬜ **Todo / Planned**
- ⏳ **In Progress**
- ✅ **Completed**

---

### Step-by-Step Migration Plan

#### 1. Phase 1: Define Manifests (`kubernetes/manifests/`) ✅
Create Kubernetes resource definitions that mirror the Docker Compose architecture but utilize cloud-native abstractions.
- ✅ **1.1. Directory Structure**: Initialize `/kubernetes/manifests/` directory.
- ✅ **1.2. Secrets and ConfigMaps (`secrets.yaml`, `configmaps.yaml`)**: Convert environment variables from `.env` and `compose.yaml` (e.g., service URLs, Redis host/port, database credentials) into ConfigMaps and Secrets.
- ✅ **1.3. Persistence & Stateful Services (`mongodb.yaml`, `redis.yaml`)**:
  - Define `PersistentVolumeClaim` (PVC) for MongoDB and Redis.
  - Create a ConfigMap for `mongo-init.js` to initialize mock data in MongoDB.
  - Define Deployments and Services for MongoDB and Redis.
- ✅ **1.4. Mock Data Server (`jsonserver.yaml`)**: Define Deployment and Service (ClusterIP) for the mock REST API (`jsonServer-app`).
- ✅ **1.5. Backend Microservices (`backend-deployments.yaml`)**:
  - Define Deployments for `bff-gateway`, `auth-service`, `user-service`, and `analytics-service`.
  - Inject ConfigMaps/Secrets into environment variables.
  - Define standard ClusterIP Services for internal discovery (e.g., `http://auth-service:4001`, `http://user-service:4002`, `http://analytics-service:4003`).
- ✅ **1.6. Frontend and Reverse Proxy (`frontend.yaml`)**:
  - Define Deployment and Service (ClusterIP) for `web-app`.
  - Define ConfigMap for `nginx.conf`.
  - Define Deployment and Service (NodePort/LoadBalancer) for `nginx` reverse proxy.
- ✅ **1.7. Ingress Controller Definition (`ingress.yaml`)**:
  - Define Kubernetes standard `Ingress` resources as an alternative routing mechanism to bypass or replace the standalone `nginx` proxy.


#### 2. Phase 2: Build & Registry Preparation ⬜
- ⬜ **2.1. Build local container images**: Execute docker builds for frontend, backend services, and jsonServer.
- ⬜ **2.2. Configure image pull policies**: Set `imagePullPolicy: IfNotPresent` to ensure Kubernetes pulls from the local Docker daemon.

#### 3. Phase 3: Deployment & Execution ⬜
- ⬜ **3.1. Start Local Cluster**: Run minikube / kind with local docker daemon environment reuse.
- ⬜ **3.2. Apply Configuration & DBs**: Run `kubectl apply -f kubernetes/manifests/secrets.yaml -f kubernetes/manifests/configmaps.yaml -f kubernetes/manifests/mongodb.yaml -f kubernetes/manifests/redis.yaml`.
- ⬜ **3.3. Apply Backend & Mock Server**: Run `kubectl apply -f kubernetes/manifests/jsonserver.yaml -f kubernetes/manifests/backend-deployments.yaml`.
- ⬜ **3.4. Apply Frontend & Proxy**: Run `kubectl apply -f kubernetes/manifests/frontend.yaml`.

#### 4. Phase 4: Verification & Validation ⬜
- ⬜ **4.1. Pod Status Check**: Verify all pods are running successfully.
- ⬜ **4.2. Verify Database Initialization**: Exec into MongoDB pod and check if `mydb.users` collection is pre-populated from the mounted `mongo-init.js`.
- ⬜ **4.3. Test API Gateway & Microservices**: Check logs and run test requests to BFF GraphQL `/graphql` endpoint.
- ⬜ **4.4. Verify Frontend Access**: Open the dashboard in browser via the mapped port/Ingress URL and verify real-time Jotai state updates.

---


## Folder & Deployment Structure

### Suggested repository layout

```
services/
  auth-service/
  user-service/
  analytics-service/
  dashboard-bff/
shared/
  events/
  graphql/
  dto/
kubernetes/
  manifests/
  helm/
  README.md    # Kubernetes deployment instructions
compose.yaml
README.md
```


### BFF service structure

```
services/dashboard-bff/
  src/
    app.module.ts
    main.ts
    graphql/
      schema.graphql
      resolvers/
        dashboard.resolver.ts
        user.resolver.ts
    services/
      auth.service.ts
      user.service.ts
      analytics.service.ts
      cache.service.ts
    clients/
      auth.client.ts
      user.client.ts
      analytics.client.ts
  package.json
  Dockerfile
```

**Notes:**
- BFF focuses on GraphQL aggregation from `auth-service`, `user-service`, and `analytics-service`.
- WebSocket connections are handled directly by `analytics-service` for real-time updates.
- Mock events are generated internally in `analytics-service` using jsonServer data.
- Redis is shared for caching across services.

## Compatibility with Current Stack

### Why this is the right fit
- Keeps your existing React Query + GraphQL frontend architecture
- Reuses `graphql-request` to talk to a single GraphQL endpoint
- Makes backend services reusable and testable
- Separates frontend concerns from domain logic
- Fits a local single-developer project using mock data

### Frontend behavior stays stable
- `useQuery` hooks remain the same
- Only the GraphQL endpoint changes to `dashboard-bff`
- Data shape is tailored by the BFF for React/D3 consumption

## Practical Recommendation
- Build the `dashboard-bff` first, then backend services
- Keep internal communications REST-based initially
- Use the BFF to hide service complexity from the UI
- Add WebSockets and events after the core API is stable
- Keep Kubernetes optional until the architecture is proven

## Summary
This design makes your app a clean **BFF + microservices** system while leaving the existing frontend largely unchanged.
The result is a local development-ready architecture with a scalable, learnable path toward real microservices and real-time behavior.
