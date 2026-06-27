# Kubernetes Deployment Guide

This guide details how to build local container images, deploy resources to a local Kubernetes cluster (like Minikube), and verify the deployment.

---

## Phase 1: Build Local Images

Since these manifests use `imagePullPolicy: IfNotPresent`, they will pull images from the local Docker daemon. Follow these steps to build the images directly inside your local Kubernetes environment.

### 1. Point terminal to Minikube's Docker Daemon
Ensure Docker commands build inside Minikube's registry/daemon rather than the host machine's:
```bash
eval $(minikube docker-env)
```

### 2. Build Dashboard Services
Run the docker builds from the root directory:
```bash
# BFF Gateway & Microservices (NestJS Monorepo)
docker build -t dashboard-bff-image:latest -f server/Dockerfile server/
docker build -t dashboard-auth-image:latest -f server/Dockerfile server/
docker build -t dashboard-user-image:latest -f server/Dockerfile server/
docker build -t dashboard-analytics-image:latest -f server/Dockerfile server/

# Frontend Web Application (React)
docker build -t dashboard-web-image:latest web/

# Mock REST API Server (jsonServer)
docker build -t dashboard-jsonserver-image:latest jsonServer/
```

---

## Phase 2: Deploy Workloads to Kubernetes

Apply the resources step-by-step from the root directory.

### 1. Secrets & Configurations
```bash
kubectl apply -f kubernetes/manifests/secrets.yaml
kubectl apply -f kubernetes/manifests/configmaps.yaml
```

### 2. Stateful Services (MongoDB, Redis, JSON Server)
```bash
kubectl apply -f kubernetes/manifests/mongodb.yaml
kubectl apply -f kubernetes/manifests/redis.yaml
kubectl apply -f kubernetes/manifests/jsonserver.yaml
```

Wait for them to be ready:
```bash
kubectl wait --for=condition=ready pod -l app=mongodb --timeout=90s
kubectl wait --for=condition=ready pod -l app=redis --timeout=60s
kubectl wait --for=condition=ready pod -l app=jsonserver-app --timeout=60s
```

### 3. Backend Microservices
```bash
kubectl apply -f kubernetes/manifests/backend-deployments.yaml
```

### 4. Frontend & Nginx Reverse Proxy
```bash
kubectl apply -f kubernetes/manifests/frontend.yaml
```

*Optional: Apply standard Ingress rules instead of standalone Nginx proxy:*
```bash
kubectl apply -f kubernetes/manifests/ingress.yaml
```

---

## Phase 3: Access & Verification

### 1. Check Deployment Status
Ensure all pods are in the `Running` state:
```bash
kubectl get pods
```

### 2. Access the Application
To expose the Nginx LoadBalancer service and automatically tunnel it on localhost:
```bash
minikube service nginx
```
This command will open a browser window routing traffic to the app.

---

## Automation & Continuous Development

To streamline building and deploying (either on demand or automatically on every file change), two automation options have been added.

### Option 1: Automated & Optimized Script (`deploy.sh`)

Instead of manually running every step, you can run the provided automated shell script:

```bash
# To build and deploy everything:
./kubernetes/deploy.sh

# To skip building Docker images and only deploy manifests:
./kubernetes/deploy.sh --deploy-only

# To only build images inside minikube:
./kubernetes/deploy.sh --build-only

# To clean up/delete all deployed resources:
./kubernetes/deploy.sh --clean
```

> [!TIP]
> **Build Optimization:** The script builds the NestJS backend monorepo image **once** and tags it for the four backend services (`bff-gateway`, `auth-service`, `user-service`, `analytics-service`). This avoids building the monorepo four separate times, saving substantial build time and CPU usage.

### Option 2: Continuous Development on Code Change (`Skaffold`)

If you have [Skaffold](https://skaffold.dev/) installed, you can leverage it for an interactive, continuous development workflow. Skaffold will watch your source files, detect changes, rebuild only the affected container images, redeploy the updated pods, and stream the logs to your terminal in real-time.

```bash
# To start the continuous development loop:
skaffold dev

# To build and deploy once:
skaffold run

# To clean up Skaffold resources:
skaffold delete
```

