# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace and server manifests
COPY package.json package-lock.json* ./
COPY server/package.json server/tsconfig.json ./server/

# Install dependencies
RUN npm ci --workspace=server

# Copy server source code
COPY server/src ./server/src

# Build TypeScript to dist
RUN npm run build --workspace=server

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Copy package manifests and production dependencies
COPY package.json package-lock.json* ./
COPY server/package.json ./server/

RUN npm ci --workspace=server --omit=dev

# Copy compiled dist from builder
COPY --from=builder /app/server/dist ./server/dist

EXPOSE 3001

CMD ["node", "server/dist/index.js"]

