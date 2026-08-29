FROM node:20-alpine AS builder

WORKDIR /app

# The project contains both package-lock.json and pnpm-lock.yaml.
# Based on the user's run_shell_command history, they are using pnpm.
RUN npm install -g pnpm

# Copy package and any lockfiles we might have so the installer can choose
COPY package.json pnpm-lock.yaml* package-lock.json* ./

# Prefer pnpm when a pnpm-lock.yaml exists, otherwise fall back to npm ci.
# This makes builds more robust across environments that may not have pnpm lock.
RUN if [ -f pnpm-lock.yaml ]; then \
			pnpm install; \
		else \
			npm ci; \
		fi

COPY . .
RUN pnpm run build

# Production image
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

# Production dependencies: prefer pnpm when lockfile present, otherwise use npm ci
COPY package.json pnpm-lock.yaml* package-lock.json* ./
RUN if [ -f pnpm-lock.yaml ]; then \
			pnpm install --prod; \
		else \
			npm ci --only=production; \
		fi

# Copy the entire dist folder and the shared libs
COPY --from=builder /app/dist ./dist
# We need the proto files in the root libs folder for the relative paths to work
COPY --from=builder /app/libs ./libs

# Use an environment variable to define which app to run
ENV APP_NAME=bff-gateway

EXPOSE 4000 4001 4002 4003

CMD ["sh", "-c", "node dist/apps/${APP_NAME}/main"]
