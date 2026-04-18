FROM node:20
WORKDIR /app
COPY package.json ./
RUN npm cache clean --force
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]