FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

RUN apk add --no-cache ca-certificates curl

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["pnpm", "--filter", "server", "dev"]