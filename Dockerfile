# ─── Stage 1: Build React client ──────────────────────────────────────────────
FROM node:22-alpine AS client-build
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci --ignore-scripts

COPY client/ ./
RUN npm run build


# ─── Stage 2: Compile TypeScript server ───────────────────────────────────────
FROM node:22-alpine AS server-build
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/ ./
# Generate Prisma client before compiling
RUN npx prisma generate
RUN npm run build


# ─── Stage 3: Production image ────────────────────────────────────────────────
FROM node:22-alpine AS production

# dumb-init forwards OS signals (SIGTERM) properly to Node
RUN apk add --no-cache dumb-init

# Non-root user — never run containers as root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install only production dependencies
COPY server/package*.json ./
RUN npm ci --omit=dev

# Compiled server
COPY --from=server-build /app/server/dist ./dist

# Prisma: generated client (query engine binary) + migration files
COPY --from=server-build /app/server/node_modules/.prisma ./node_modules/.prisma
COPY server/prisma ./prisma

# React build served as static files by Express
COPY --from=client-build /app/client/dist ./public

USER appuser

ENV NODE_ENV=production
# Cloud Run injects PORT=8080 by default
ENV PORT=8080

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
