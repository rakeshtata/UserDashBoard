# Dockerfile for Node application
FROM node:23
WORKDIR /
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8000
CMD ["npm", "start"]