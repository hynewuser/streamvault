FROM node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

COPY package.json package-lock.json* ./
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/

RUN npm install --workspaces --include-workspace-root

COPY shared ./shared
COPY frontend ./frontend

RUN npm --workspace shared run build
RUN npm --workspace frontend run build

FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache tini && \
    addgroup -g 1001 sv && adduser -u 1001 -G sv -s /bin/sh -D sv

ENV NODE_ENV=production

COPY --from=builder --chown=sv:sv /app/frontend/.next/standalone ./
COPY --from=builder --chown=sv:sv /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder --chown=sv:sv /app/frontend/public ./frontend/public

USER sv
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "frontend/server.js"]
