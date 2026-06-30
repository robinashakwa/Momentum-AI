# Use standard Node 20 with build tools for native SQLite compilation
FROM node:20 AS builder

WORKDIR /app

# Install dependencies first to optimize docker caching
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Runner Stage
FROM node:20-slim AS runner

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled production artifacts from builder
COPY --from=builder /app/dist ./dist

# Expose port 3000 (required by reverse proxy ingress)
EXPOSE 3000

ENV NODE_ENV=production

# Start Momentum AI
CMD ["npm", "start"]
