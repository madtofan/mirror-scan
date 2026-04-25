FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY packages/env/package.json packages/env/
COPY packages/api/package.json packages/api/
COPY packages/auth/package.json packages/auth/
COPY packages/db/package.json packages/db/
COPY packages/config/package.json packages/config/
COPY packages/ui/package.json packages/ui/
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/

RUN pnpm install --frozen-lockfile

COPY apps web/
COPY apps server/
COPY packages packages/

EXPOSE 3001

CMD ["pnpm", "--filter", "web", "dev"]
