FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

WORKDIR /app

COPY . .

RUN pnpm install

EXPOSE 3001

CMD ["pnpm", "--filter", "web", "dev"]