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

COPY apps/server/package.json apps/server/
COPY apps/server/tsconfig.json apps/server/
COPY apps/server/tsdown.config.ts apps/server/
COPY apps/server/src apps/server/src

RUN pnpm --filter server build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

COPY --from=builder /app/apps/server/dist ./dist

USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.mjs"]