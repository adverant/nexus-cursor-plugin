# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Build
RUN npm run build

# Production image
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --only=production

# Copy built files
COPY --from=builder /app/dist ./dist

# Build metadata
ARG BUILD_ID
ARG BUILD_TIMESTAMP
ARG GIT_COMMIT
ARG VERSION

LABEL org.opencontainers.image.title="Nexus Cursor Plugin" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${GIT_COMMIT}" \
      com.adverant.build.id="${BUILD_ID}" \
      com.adverant.build.timestamp="${BUILD_TIMESTAMP}"

ENV NEXUS_BUILD_ID="${BUILD_ID}" \
    NEXUS_VERSION="${VERSION}" \
    NODE_ENV=production

# MCP requires stdin/stdout
ENTRYPOINT ["node", "dist/index.js"]
