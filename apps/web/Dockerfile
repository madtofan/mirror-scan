FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY packages/env/package.json packages/env/
COPY packages/api/package.json packages/api/
COPY packages/auth/package.json packages/auth/
COPY packages/db/package.json packages/db/
COPY packages/config/package.json packages/config/
COPY packages/ui/package.json packages/ui/

RUN pnpm install --frozen-lockfile

FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

COPY apps/web/package.json apps/web/
COPY apps/web/tsconfig.json apps/web/
COPY apps/web/vite.config.ts apps/web/
COPY apps/web/index.html apps/web/
COPY apps/web/src apps/web/src
COPY apps/web/components.json apps/web/
COPY apps/web/.env apps/web/.env

ENV VITE_SERVER_URL=

RUN pnpm --filter web build

FROM alpine:3.19 AS runner

RUN apk add --no-cache nginx

COPY --from=builder /app/apps/web/dist ./usr/share/nginx/html
COPY nginx.conf /etc/nginx/http.d/default.conf

RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 -G nginx

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]