FROM node:20-slim AS build
WORKDIR /app
COPY PM-Pepsi-App/backend/package.json PM-Pepsi-App/backend/package-lock.json ./
RUN npm ci
COPY PM-Pepsi-App/backend/tsconfig.json ./
COPY PM-Pepsi-App/backend/src ./src
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
ENV BACKUP_SCHEDULER=0
ENV INTEGRATION_WATCH_SCHEDULER=0
COPY PM-Pepsi-App/backend/package.json PM-Pepsi-App/backend/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 4000
CMD ["node", "dist/index.js"]
