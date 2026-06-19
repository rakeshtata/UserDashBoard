FROM node:20-alpine AS builder

WORKDIR /app

# The project contains both package-lock.json and pnpm-lock.yaml.
# Based on the user's run_shell_command history, they are using pnpm.
RUN npm install -g pnpm

# Copying all possible lock files to ensure pnpm has what it needs
COPY package.json pnpm-lock.yaml* package-lock.json* ./
RUN pnpm install

COPY . .
RUN pnpm run build

# Production image
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* package-lock.json* ./
# Removing --frozen-lockfile to allow pnpm to resolve any minor mismatches during the transition
RUN pnpm install --prod

# Copy the entire dist folder and the shared libs
COPY --from=builder /app/dist ./dist
# We need the proto files in the root libs folder for the relative paths to work
COPY --from=builder /app/libs ./libs

# Use an environment variable to define which app to run
ENV APP_NAME=bff-gateway

EXPOSE 4000 4001 4002 4003

CMD ["sh", "-c", "node dist/apps/${APP_NAME}/main"]
