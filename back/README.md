# Tournament Backend

Backend API for:
- login/logout with JWT
- admin-owned tournament management
- participant assignment to tournaments
- results editing by admin only
- Python OR-Tools schedule optimization endpoint
- read-only results access for participants

## Run

1. Copy `.env.example` to `.env`
2. Start backend:

```bash
npm run dev:server
```

3. Start frontend:

```bash
npm run dev
```

Vite proxies `/api` to `http://localhost:4000`.

## Python optimizer setup (OR-Tools)

1. Ensure Python 3.10+ is installed.
2. Install optimizer dependencies:

```bash
python -m pip install -r backend/python/requirements.txt
```

3. (Optional) configure in `.env`:
- `PYTHON_EXECUTABLE` (default: `python`)
- `OPTIMIZER_TIMEOUT_MS` (default: `15000`)

## Seed users

- Admin: `admin@demo.local` / `Admin123!`
- Participant: `participant@demo.local` / `Participant123!`

## Main endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/tournaments`
- `POST /api/tournaments` (admin)
- `PUT /api/tournaments/:id` (admin owner)
- `GET /api/tournaments/:id/participants`
- `POST /api/tournaments/:id/participants` (admin owner)
- `GET /api/tournaments/:id/matches`
- `POST /api/tournaments/:id/matches` (admin owner)
- `PATCH /api/tournaments/:id/matches/:matchId/score` (admin owner)
- `POST /api/tournaments/:id/optimize` (admin owner)
- `GET /api/tournaments/:id/leaderboard`

## Frontend integration

Use `src/api/backendClient.js`:
- `backendClient.login(...)` for auth
- pass returned `token` to other methods
- `backendClient.optimizeTournament(...)` triggers Python OR-Tools optimization

If Python/OR-Tools is temporarily unavailable, backend returns a fallback schedule and includes that info in `run.summary`.

## Deploy

Top-level deployment guide is available in `DEPLOY.md`.
For production containerized deploy, use the repository `Dockerfile`.
