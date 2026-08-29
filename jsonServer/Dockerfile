# Dockerfile for Node application
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8000
CMD ["npx", "json-server", "--watch", "db.json", "--host", "0.0.0.0", "--port", "8000"]