# Deployment Strategy

## Recommended approach (single service)

Use one service for both frontend and backend:
- Express serves API (`/api/*`)
- Express serves built React app (`dist`)
- Python OR-Tools runs locally inside the same container

This avoids cross-service CORS complexity and guarantees optimizer availability.

## Option A: Docker on VPS (most control)

1. Set production env values (`JWT_SECRET`, etc.).
2. Build and run:
   - `docker compose up -d --build`
3. Add reverse proxy (Nginx/Caddy) with HTTPS.
4. Persist app data with the `tournament-data` volume.

## Option B: Deploy container to Render/Railway/Fly.io

1. Connect repository.
2. Use `Dockerfile`.
3. Set env vars:
   - `NODE_ENV=production`
   - `PORT=4000`
   - `JWT_SECRET=<strong secret>`
   - `PYTHON_EXECUTABLE=python3`
   - `OPTIMIZER_TIMEOUT_MS=20000`
4. Configure persistent disk mounted to `/app/back/data`.
5. Expose port `4000`.

## Health check

- Path: `/api/health`
- Expected: `{ "ok": true, ... }`

## Post-deploy smoke test

1. Login as admin.
2. Open tournaments page.
3. Run optimization.
4. Confirm `run.source` is `python-ortools`.

## Important production notes

- Change default seed credentials immediately.
- Use a strong random `JWT_SECRET`.
- Keep persistent storage for `back/data/db.json`.
- Consider migrating from JSON DB to PostgreSQL for multi-instance scaling.
