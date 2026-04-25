FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/server ./apps/server

RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/server

EXPOSE 3000

CMD ["tsx", "/app/apps/server/src/index.ts"]
