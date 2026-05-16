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
- Deploy BFF, core services, notification, and event service
- Use Skaffold for local iteration

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
