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
- `server-app` uses `REDIS_HOST=redis` and `REDIS_PORT=6379` for Redis connection.

## Key Points
- Backend uses Redis for caching, with host set to `redis` for Docker network resolution.
- Nginx serves as a reverse proxy and static file server.
- MongoDB is available but currently commented out.

---
This file provides a high-level context for developers and operators working with this application. For more details, refer to the respective service directories and configuration files.

## Future Improvements & TODOs
1. **Authentication (Passport.js Integration)**:
   - Implement `@nestjs/passport` and `passport-local`/`passport-jwt` in the `server` backend for secure user authentication.
   - Build a Login Page in the `web` frontend (using Ant Design) to send user credentials and securely store the resulting JWT.
   - Secure server API routes and GraphQL resolvers using `JwtAuthGuard`.
2. **Frontend Upgrades**:
   - Migrate the `web` frontend from Create React App (`react-scripts`) to a modern build tool like **Vite** for faster development and modern Node.js support.
   - Upgrade legacy libraries (React 16.x and Ant Design 3.x) to modern versions.
3. **Infrastructure & DevOps**:
   - **Database**: Uncomment and connect the `mongodb` service in `compose.yaml` to persist application and user data.
   - **Docker Stability**: Add `healthcheck` blocks for Redis and MongoDB, and configure the backend to wait for them (`depends_on: condition: service_healthy`).
   - **Environment Variables**: Extract hardcoded configurations (e.g., `MONGO_URI`, Redis hosts) from `compose.yaml` into a dedicated `.env` file.
   - **Nginx Routing**: Review `nginx.conf` to effectively separate and route traffic between the React frontend and NestJS backend API.
