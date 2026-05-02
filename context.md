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

## Future Improvements & TODOs
1. **Frontend Modernization**:
   - ✅ **React Upgrade**: Upgraded from React 16.x to **React 18.3.1** and migrated to the `createRoot` API.
   - ✅ **Ant Design Upgrade**: Upgraded legacy Ant Design 3.x to **Ant Design 6.3.7**, migrated all legacy components (Form, Icon) to modern APIs, and transitioned to CSS-in-JS.
   - ✅ **D3.js**: Upgrade from v4 to v7+ for modularity and better performance.
2. **Performance & Core Web Vitals**:
   - ✅ **Code Splitting**: Implement `React.lazy` and `Suspense` for dashboard widgets to improve LCP.
   - ✅ **Backend Compression**: Enable `compression` middleware in the NestJS server for smaller JSON payloads.
3. **Accessibility (a11y)**:
   - ✅ **Semantic HTML**: Replace generic layouts with landmark roles (`<main>`, `<nav>`, `<aside>`).
   - ✅ **Accessible Data Viz**: Enhance D3 charts with `title`, `desc`, and `aria-label` tags for screen reader support.
   - ✅ **Focus Management**: Implement programmatic focus shifting for interactive dashboard elements.
4. **Security Hardening**:
   - ✅ **Headers**: Integrate `helmet` for secure HTTP headers.
   - ✅ **CORS**: Restrict CORS to specific origins to prevent unauthorized cross-origin requests.
