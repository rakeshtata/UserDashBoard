# Application Context for UserDashBoard

## Overview
This application is a multi-service user dashboard platform orchestrated with Docker Compose. It includes frontend, backend, mock API, caching, and reverse proxy services, with optional MongoDB support.

## Services
- **jsonServer-app**: Mock REST API using json-server, exposed on port 8000.
- **web-app**: Frontend application (React or similar), exposed on port 3000.
- **server-app**: Backend (NestJS, GraphQL/REST), exposed on port 4000. Connects to Redis for caching using environment variables.
- **nginx**: Serves static files and acts as a reverse proxy, exposed on port 80.
- **redis**: In-memory data store for caching, exposed on port 6379, with persistent volume.
- **mongodb** (commented): Optional MongoDB service for persistent data storage.

## Networking
- All main services (except jsonServer-app and web-app) are on a custom bridge network `app-network` for inter-container communication.

## Volumes
- **redis**: Persists Redis data.
- **mongodb_data**: (Commented) For MongoDB data persistence.

## Environment Variables
- Environment variables for `server-app` are loaded from the `.env` file, including `REDIS_HOST`, `REDIS_PORT`, and `MONGO_URI` for Redis and MongoDB connections.

## Key Points
- Backend uses Redis for caching, with host configured via environment variables from `.env` for Docker network resolution.
- Nginx serves as a reverse proxy and static file server.
- MongoDB is connected via `MONGO_URI` from `.env` for persistent data storage.

---
This file provides a high-level context for developers and operators working with this application. For more details, refer to the respective service directories and configuration files.

## Project Completion Summary

### Completed Improvements
The application has achieved **modern cloud-native foundation**:
1. **Frontend**: React 18.3.1 with Ant Design 6.3.7, D3.js v7+, code splitting, and accessibility enhancements
2. **Performance**: Compression middleware, React.lazy/Suspense, optimized Core Web Vitals
3. **Security**: Helmet headers, CORS protection, JWT authentication with Passport
4. **Architecture**: Docker Compose orchestration, Redis caching, MongoDB persistence
5. **Code Quality**: Unit tests, E2E tests, TypeScript strict mode, ESLint, Prettier

### Current Complexity Score
**7.5/10** - Medium-High complexity
- Multi-service Docker Compose setup
- GraphQL + REST dual API
- Advanced state management (Jotai + React Query)
- Modern tooling (Vite, Webpack, Babel)

---

## Project Scope

### Environment
- **Deployment**: Local Ubuntu development machine only
- **Team**: Single developer
- **Data**: Mock data via json-server (no production database)
- **Purpose**: Learning, exploration, and showcasing advanced architecture patterns

### Constraints & Assumptions
- No multi-server deployment needed
- No scalability to thousands of users (localhost resources)
- Mock data sufficient for demonstration and testing
- All services run on single Minikube cluster (4 CPUs, 8GB RAM)
- Development-focused (not production-hardened)

---

## Future Plan: Cloud-Native Microservices Learning Project

### Strategic Vision
Transform from **monolithic Docker Compose** to **cloud-native microservices** using a BFF (Backend-for-Frontend) architecture with high-performance internal gRPC communication—architected for localhost development and learning.

### Timeline & Phases (3-4 months, single developer)

#### **Phase 1: Monorepo & Microservices Architecture (3-4 weeks)**
Transition to a NestJS Monorepo and split the backend into 4 independent services:
- **BFF Gateway** (port 4000): GraphQL entry point, WebSocket management, and gRPC client.
- **Auth Service** (port 4001): JWT validation, Passport strategies, and internal gRPC API.
- **User Service** (port 4002): Profile management and database persistence.
- **Analytics Service** (port 4003): D3 data processing and time-series aggregation.
Infrastructure additions:
- Service Discovery (Kubernetes DNS)
- Shared Library (`libs/shared`) for Protobuf definitions, Schemas, and DTOs.

#### **Phase 2: Internal Communication with gRPC (2-3 weeks)**
Implement high-performance binary communication between services:
- **Protocol**: gRPC using Protocol Buffers (Protobuf).
- **Service Mesh**: Direct gRPC calls via Kubernetes Service names.
- **Contract-First**: Define `.proto` files for all internal service interfaces.
- **Security**: Internal gRPC traffic (unencrypted for localhost learning).

#### **Phase 3: Real-Time WebSockets (2 weeks)**
Implement real-time dashboard updates:
- **Technology**: Socket.IO + @nestjs/websockets in BFF/Analytics Service.
- **Transport**: HTTP upgrade to WebSocket via Nginx.
- **Features**: Live mock data updates from jsonServer, demo analytics feeds.
- **Latency Target**: <50ms on localhost.

#### **Phase 4: Kubernetes Local Development (2-3 weeks)**
Local cluster setup for development and testing:
- **Minikube**: Single-node cluster, 4 CPUs, 8GB RAM, Docker driver.
- **Manifests**: Deployments (1 replica), Services (ClusterIP).
- **Networking**: Ingress for localhost access, ClusterIP services for inter-service gRPC communication.
- **Local Development Tools**: Skaffold for hot-reload, k9s for cluster management.

#### **Phase 5: Observability & Local Monitoring (1-2 weeks)**
Observability for localhost development:
- **Logging**: Centralized viewing via k9s or Loki.
- **Metrics**: Prometheus collection with Grafana dashboards.
- **Distributed Tracing**: Jaeger for request correlation across gRPC calls.

### Technology Stack Summary

| Layer | Current | Target |
|-------|---------|--------|
| **Backend** | 1x Monolithic NestJS | 4x NestJS Microservices |
| **BFF** | None | NestJS (GraphQL + WebSockets) |
| **API Gateway** | Nginx | Nginx Ingress |
| **Real-Time** | REST polling | WebSockets (Socket.IO) |
| **Events** | None | None (gRPC instead) |
| **Orchestration** | Docker Compose | Kubernetes (Minikube) |
| **Service Discovery** | Docker DNS | K8s DNS |
| **IPC** | REST | gRPC (Binary) |
| **Observability** | Basic logs | Prometheus + Grafana + Jaeger |

### Target Complexity Score
**8.5/10** - Cloud-native distributed system for learning
- 4 microservices with independent deployments
- High-performance gRPC communication layer
- Real-time WebSocket layer
- Kubernetes orchestration with Minikube
- Multi-protocol communication (GraphQL, gRPC, WebSockets)

### Success Metrics (Localhost Development)
✅ All 4 services run independently on Minikube
✅ gRPC latency <5ms on localhost
✅ WebSocket latency <50ms on localhost
✅ Minikube cluster stable with 4 CPUs, 8GB RAM
✅ Full local observability (logs, metrics)
✅ Hot-reload working with Skaffold during development
