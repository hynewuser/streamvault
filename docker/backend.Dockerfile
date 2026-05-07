# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl

COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/

RUN npm install --workspaces --include-workspace-root

COPY shared ./shared
COPY backend ./backend

RUN npm --workspace shared run build
RUN npm --workspace backend run prisma:generate
RUN npm --workspace backend run build

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl tini wget python3 ffmpeg \
    && addgroup -g 1001 sv && adduser -u 1001 -G sv -s /bin/sh -D sv

ENV NODE_ENV=production

COPY --from=builder --chown=sv:sv /app/package.json ./
COPY --from=builder --chown=sv:sv /app/node_modules ./node_modules
COPY --from=builder --chown=sv:sv /app/shared/dist ./shared/dist
COPY --from=builder --chown=sv:sv /app/shared/package.json ./shared/
COPY --from=builder --chown=sv:sv /app/backend/dist ./backend/dist
COPY --from=builder --chown=sv:sv /app/backend/node_modules ./backend/node_modules
COPY --from=builder --chown=sv:sv /app/backend/package.json ./backend/
COPY --from=builder --chown=sv:sv /app/backend/prisma ./backend/prisma

RUN mkdir -p /app/data /app/exports /app/logs && chown -R sv:sv /app

USER sv
WORKDIR /app/backend

EXPOSE 4000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
