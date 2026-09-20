<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# ZMC Hospital Management System

The application uses one Node.js server for the backend API, middleware, WebSocket connection, and React frontend. This keeps every department and dashboard connected through the same `/api` and `/ws` origin.

## Project structure

- `server.ts`: application composition entrypoint
- `src/backend/config`: environment configuration
- `src/backend/database`: PostgreSQL and local cache repository
- `src/backend/middleware`: request authentication and authorization middleware
- `src/backend/routes`: department and feature API routes
- `src/backend/utils`: backend utilities, including WebSocket clients
- `src/components`: React department views and dashboard components
- `src/utils/api.ts`: frontend API and WebSocket client

## Run locally

Prerequisite: Node.js 20 or newer.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure the PostgreSQL variables in `.env`:

   ```env
   PGHOST=your-postgres-host
   PGPORT=5432
   PGDATABASE=your-database
   PGUSER=your-database-user
   PGPASSWORD=your-database-password
   JWT_SECRET=your-development-secret
   ```

3. Start the complete system:

   ```bash
   npm run dev
   ```

4. Open http://localhost:3000.

`npm run dev` starts Express, mounts all backend routes, initializes PostgreSQL, mounts Vite for the React interface, and serves WebSockets. Do not use `node server.ts`; Node does not execute TypeScript directly. `npm run dev:backend` is an explicit alias for the same complete server.

## Production

Build the React frontend and backend bundle, then start the production server:

```bash
npm run build
npm run start:production
```

The production server serves the built frontend and the same backend API from http://localhost:3000. Keep `.env` out of source control and use a strong persistent `JWT_SECRET` in production.
