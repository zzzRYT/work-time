FROM node:20-slim AS base

FROM base AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/nest-cli.json ./
RUN npm ci --omit=dev

EXPOSE ${PORT:-4000}
CMD ["node", "dist/main.js"]
