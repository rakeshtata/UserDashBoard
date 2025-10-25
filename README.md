# UserDashBoard
React + D3+ antd + Jotai + React Query +graphql + koa + redis implementation
![Screenshot from 2022-07-26 22-34-28](https://user-images.githubusercontent.com/3521179/181169695-0dadb93e-4b95-44ce-9abf-927429791d59.png)

## Overview

UserDashBoard is a multi-service user dashboard platform orchestrated with Docker Compose. It includes frontend, backend, mock API, caching, and reverse proxy services, with optional MongoDB support.

## Services

- **jsonServer-app**: Mock REST API using json-server, exposed on port `8000`.
- **web-app**: Frontend application (React or similar), exposed on port `3000`.
- **server-app**: Backend (NestJS, GraphQL/REST), exposed on port `4000`. Connects to Redis for caching using environment variables.
- **nginx**: Serves static files and acts as a reverse proxy, exposed on port `80`.
- **redis**: In-memory data store for caching, exposed on port `6379`, with persistent volume.
- **mongodb** (optional): MongoDB service for persistent data storage (currently commented out).

## Networking

All main services (except `jsonServer-app` and `web-app`) are on a custom bridge network `app-network` for inter-container communication.

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

This README provides a high-level context for developers and operators working with this application. For more details, refer to the respective service directories and configuration files.