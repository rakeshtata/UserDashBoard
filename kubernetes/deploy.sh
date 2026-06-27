#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define color codes for pretty output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print step header
print_step() {
    echo -e "\n${BLUE}======================================================================${NC}"
    echo -e "${BLUE}>>> $1${NC}"
    echo -e "${BLUE}======================================================================${NC}"
}

# Function to print success message
print_success() {
    echo -e "${GREEN}✔ $1${NC}"
}

# Function to print warning message
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print error message
print_error() {
    echo -e "${RED}✘ $1${NC}"
}

# Function to display help
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --build-only    Only build/tag local Docker images within minikube daemon"
    echo "  --deploy-only   Only apply Kubernetes manifests without rebuilding Docker images"
    echo "  --clean         Delete all deployed Kubernetes resources"
    echo "  -h, --help      Show this help message"
    echo ""
    echo "If no options are provided, the script runs both build and deploy steps."
}

# Ensure we are in the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

# Check for minikube status if minikube is installed
if command -v minikube &> /dev/null; then
    if ! minikube status &> /dev/null; then
        print_error "Minikube is not running! Please start it first with 'minikube start'."
        exit 1
    fi
else
    print_warning "Minikube command not found. Assuming you are using an alternative Kubernetes cluster."
fi

# Parse options
BUILD_IMAGES=true
DEPLOY_RESOURCES=true
CLEANUP=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --build-only) BUILD_IMAGES=true; DEPLOY_RESOURCES=false; shift ;;
        --deploy-only) BUILD_IMAGES=false; DEPLOY_RESOURCES=true; shift ;;
        --clean) CLEANUP=true; shift ;;
        -h|--help) show_help; exit 0 ;;
        *) print_error "Unknown parameter passed: $1"; show_help; exit 1 ;;
    esac
done

# Perform cleanup if requested
if [ "$CLEANUP" = true ]; then
    print_step "Cleaning up Kubernetes resources..."
    kubectl delete -f kubernetes/manifests/ingress.yaml --ignore-not-found=true
    kubectl delete -f kubernetes/manifests/frontend.yaml --ignore-not-found=true
    kubectl delete -f kubernetes/manifests/backend-deployments.yaml --ignore-not-found=true
    kubectl delete -f kubernetes/manifests/jsonserver.yaml --ignore-not-found=true
    kubectl delete -f kubernetes/manifests/redis.yaml --ignore-not-found=true
    kubectl delete -f kubernetes/manifests/mongodb.yaml --ignore-not-found=true
    kubectl delete -f kubernetes/manifests/configmaps.yaml --ignore-not-found=true
    kubectl delete -f kubernetes/manifests/secrets.yaml --ignore-not-found=true
    print_success "Cleanup complete!"
    exit 0
fi

# Step 1: Build Local Images
if [ "$BUILD_IMAGES" = true ]; then
    print_step "Phase 1: Building local container images inside Minikube's Docker Daemon"
    
    # Point terminal to Minikube's Docker daemon if available
    if command -v minikube &> /dev/null; then
        echo -e "${YELLOW}Setting up shell environment to use Minikube's Docker daemon...${NC}"
        eval $(minikube docker-env)
    fi

    # Build jsonServer
    echo -e "\n${YELLOW}Building Mock REST API Server (jsonServer)...${NC}"
    docker build -t dashboard-jsonserver-image:latest jsonServer/
    print_success "Mock REST API image built successfully."

    # Build React Frontend
    echo -e "\n${YELLOW}Building Frontend Web Application (React)...${NC}"
    docker build -t dashboard-web-image:latest web/
    print_success "Frontend image built successfully."

    # Build Backend Services Monorepo
    # OPTIMIZATION: Instead of rebuilding the NestJS monorepo 4 times (which is extremely slow
    # and redundant as they all use the same server/Dockerfile), we build it ONCE as a base image
    # and tag it for each respective service deployment.
    echo -e "\n${YELLOW}Building Backend Monorepo base image (this may take a few minutes)...${NC}"
    docker build -t dashboard-server-base:latest -f server/Dockerfile server/
    print_success "Backend base image built successfully."

    echo -e "\n${YELLOW}Tagging backend services from base image...${NC}"
    docker tag dashboard-server-base:latest dashboard-bff-image:latest
    docker tag dashboard-server-base:latest dashboard-auth-image:latest
    docker tag dashboard-server-base:latest dashboard-user-image:latest
    docker tag dashboard-server-base:latest dashboard-analytics-image:latest
    print_success "Backend service images tagged successfully."
fi

# Step 2: Deploy Workloads to Kubernetes
if [ "$DEPLOY_RESOURCES" = true ]; then
    print_step "Phase 2: Deploying resources to Kubernetes cluster"

    # 1. Configs & Secrets
    echo -e "\n${YELLOW}Applying Secrets & ConfigMaps...${NC}"
    kubectl apply -f kubernetes/manifests/secrets.yaml
    kubectl apply -f kubernetes/manifests/configmaps.yaml

    # 2. Stateful Services
    echo -e "\n${YELLOW}Applying Stateful Services (MongoDB, Redis, JSON Server)...${NC}"
    kubectl apply -f kubernetes/manifests/mongodb.yaml
    kubectl apply -f kubernetes/manifests/redis.yaml
    kubectl apply -f kubernetes/manifests/jsonserver.yaml

    # Wait for stateful services to be ready
    echo -e "\n${YELLOW}Waiting for stateful pods to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l app=mongodb --timeout=90s || print_warning "MongoDB pod not fully ready yet."
    kubectl wait --for=condition=ready pod -l app=redis --timeout=60s || print_warning "Redis pod not fully ready yet."
    kubectl wait --for=condition=ready pod -l app=jsonserver-app --timeout=60s || print_warning "JSON Server pod not fully ready yet."

    # 3. Backend deployments
    echo -e "\n${YELLOW}Applying Backend Microservices...${NC}"
    kubectl apply -f kubernetes/manifests/backend-deployments.yaml

    # 4. Frontend & Reverse Proxy
    echo -e "\n${YELLOW}Applying Frontend & Nginx Proxy...${NC}"
    kubectl apply -f kubernetes/manifests/frontend.yaml

    # Ingress (Optional/conditional apply if Ingress is needed)
    if [ -f kubernetes/manifests/ingress.yaml ]; then
        echo -e "\n${YELLOW}Applying Ingress rules...${NC}"
        kubectl apply -f kubernetes/manifests/ingress.yaml
    fi

    print_success "Deployments completed!"

    print_step "Phase 3: Verification & Access"
    echo -e "${YELLOW}Deployment Status:${NC}"
    kubectl get pods

    # Check Nginx service
    if command -v minikube &> /dev/null; then
        echo -e "\n${GREEN}To access your application, run the following command in a new terminal:${NC}"
        echo -e "${YELLOW}  minikube service nginx${NC}"
        echo -e "${GREEN}Or to view the dashboard cluster dashboard run:${NC}"
        echo -e "${YELLOW}  minikube dashboard${NC}\n"
    else
        echo -e "\n${GREEN}Access the frontend through your proxy/LoadBalancer service or Ingress controller configured.${NC}\n"
    fi
fi
