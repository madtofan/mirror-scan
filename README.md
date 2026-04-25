# mirror-scan

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Router, Hono, ORPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **React Native** - Build mobile apps using React
- **Expo** - Tools for React Native development
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Hono** - Lightweight, performant server framework
- **oRPC** - End-to-end type-safe APIs with OpenAPI integration
- **Node.js** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Biome** - Linting and formatting
- **Nx** - Smart monorepo task orchestration and caching

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/server/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
pnpm run db:push
```

Then, run the development server:

```bash
pnpm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
Use the Expo Go app to run the mobile application.
The API is running at [http://localhost:3000](http://localhost:3000).

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@mirror-scan/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Git Hooks and Formatting

- Format and lint fix: `pnpm run check`

## Project Structure

```
mirror-scan/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Router)
│   ├── native/      # Mobile application (React Native, Expo)
│   └── server/      # Backend API (Hono, ORPC)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `pnpm run dev`: Start all applications in development mode
- `pnpm run build`: Build all applications
- `pnpm run dev:web`: Start only the web application
- `pnpm run dev:server`: Start only the server
- `pnpm run check-types`: Check TypeScript types across all apps
- `pnpm run dev:native`: Start the React Native/Expo development server
- `pnpm run db:push`: Push schema changes to database
- `pnpm run db:generate`: Generate database client/types
- `pnpm run db:migrate`: Run database migrations
- `pnpm run db:studio`: Open database studio UI
- `pnpm run check`: Run Biome formatting and linting

## Docker Deployment

This project includes Docker configuration for production deployment.

### Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│    web     │ ──▶  │  server    │ ──▶  │     db     │
│  (nginx)   │      │   (node)   │      │ postgres  │
│   :80      │      │  :3000    │      │   :5432   │
└─────────────┘      └─────────────┘      └─────────────┘
```

- **web**: Nginx serving static React build (port 80)
- **server**: Node.js + Hono + oRPC API (port 3000)
- **db**: PostgreSQL 16 (port 5432)

### Quick Start

```bash
# Build and start all services
docker-compose up --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Services

| Service | Container Name | Port | Description |
|---------|----------------|------|-------------|
| `web` | mirror-scan-web | 80 | Nginx serving static files |
| `server` | mirror-scan-server | 3000 | REST/RPC API |
| `db` | mirror-scan-db | 5432 | PostgreSQL database |

### Running Database Migrations

After starting the containers, apply the database schema:

```bash
# Run migrations inside the server container
docker-compose exec server pnpm --filter @mirror-scan/db db:push

# Or run a shell in the container
docker-compose exec server sh
```

### Troubleshooting

```bash
# Check container status
docker-compose ps

# View logs for specific service
docker-compose logs web
docker-compose logs server
docker-compose logs db

# Restart a specific service
docker-compose restart server

# Rebuild a specific service
docker-compose build server
docker-compose up -d server
```

### Environment Variables

The following environment variables are configured in `docker-compose.yml`:

- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_URL`: Server URL for authentication
- `CORS_ORIGIN`: Allowed origins for CORS
- `NODE_ENV`: Set to `production`
