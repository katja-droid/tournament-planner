/* global process */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import { createAccessToken, requireAuth, requireRole } from './auth.js';
import { canManageTournament, canViewTournament, getTournamentById } from './permissions.js';
import { optimizeSchedule } from './optimization.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const distPath = path.join(projectRoot, 'front', 'dist');

const app = express();
const PORT = Number(process.env.PORT || 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }

  if (db.data.users.some((user) => user.email === email)) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  const normalizedRole = role === 'admin' ? 'admin' : 'participant';
  const user = {
    id: nanoid(),
    email,
    name,
    role: normalizedRole,
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString(),
  };

  db.data.users.push(user);
  await db.write();

  const token = createAccessToken(user);
  return res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.data.users.find((item) => item.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = createAccessToken(user);
  return res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.data.users.find((item) => item.id === req.user.sub);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

app.get('/api/users/search', requireAuth, requireRole('admin'), (req, res) => {
  const query = String(req.query.query || '').trim().toLowerCase();
  const role = String(req.query.role || 'participant');

  const users = db.data.users
    .filter((user) => user.role === role)
    .filter((user) => {
      if (!query) return true;
      return user.email.toLowerCase().includes(query) || user.name.toLowerCase().includes(query);
    })
    .slice(0, 20)
    .map(({ id, email, name, role: userRole }) => ({ id, email, name, role: userRole }));

  return res.json(users);
});

app.get('/api/tournaments', requireAuth, (req, res) => {
  const tournaments = db.data.tournaments.filter((item) => canViewTournament(req.user.sub, req.user.role, item));
  return res.json(tournaments);
});

app.post('/api/tournaments', requireAuth, requireRole('admin'), async (req, res) => {
  const { name, date, format, rules = '', limitations = '', autoOptimization = false } = req.body;
  if (!name || !date || !format) {
    return res.status(400).json({ error: 'name, date and format are required' });
  }

  const tournament = {
    id: nanoid(),
    adminId: req.user.sub,
    name,
    date,
    format,
    rules,
    limitations,
    autoOptimization,
    status: 'registration',
    participantIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.data.tournaments.push(tournament);
  await db.write();
  return res.status(201).json(tournament);
});

app.put('/api/tournaments/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const tournament = getTournamentById(req.params.id);
  if (!canManageTournament(req.user.sub, req.user.role, tournament)) {
    return res.status(403).json({ error: 'Not allowed to update this tournament' });
  }

  const allowedKeys = ['name', 'date', 'format', 'rules', 'limitations', 'status', 'autoOptimization'];
  for (const key of allowedKeys) {
    if (key in req.body) {
      tournament[key] = req.body[key];
    }
  }
  tournament.updatedAt = new Date().toISOString();
  await db.write();
  return res.json(tournament);
});

app.delete('/api/tournaments/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const tournament = getTournamentById(req.params.id);
  if (!tournament) {
    return res.status(404).json({ error: 'Tournament not found' });
  }
  if (!canManageTournament(req.user.sub, req.user.role, tournament)) {
    return res.status(403).json({ error: 'Not allowed to delete this tournament' });
  }

  db.data.tournaments = db.data.tournaments.filter((item) => item.id !== tournament.id);
  db.data.matches = db.data.matches.filter((item) => item.tournamentId !== tournament.id);
  db.data.optimizationRuns = db.data.optimizationRuns.filter((item) => item.tournamentId !== tournament.id);
  await db.write();
  return res.json({ ok: true });
});

app.get('/api/tournaments/:id', requireAuth, (req, res) => {
  const tournament = getTournamentById(req.params.id);
  if (!canViewTournament(req.user.sub, req.user.role, tournament)) {
    return res.status(403).json({ error: 'Not allowed to view this tournament' });
  }
  return res.json(tournament);
});

app.get('/api/tournaments/:id/participants', requireAuth, (req, res) => {
  const tournament = getTournamentById(req.params.id);
  if (!canViewTournament(req.user.sub, req.user.role, tournament)) {
    return res.status(403).json({ error: 'Not allowed to view participants' });
  }

  const participants = tournament.participantIds
    .map((userId) => db.data.users.find((user) => user.id === userId))
    .filter(Boolean)
    .map(({ id, email, name, role }) => ({ id, email, name, role }));

  return res.json(participants);
});

app.post('/api/tournaments/:id/participants', requireAuth, requireRole('admin'), async (req, res) => {
  const tournament = getTournamentById(req.params.id);
  if (!canManageTournament(req.user.sub, req.user.role, tournament)) {
    return res.status(403).json({ error: 'Not allowed to manage participants for this tournament' });
  }

  const { userId, email } = req.body;
  const participant = db.data.users.find((item) => item.id === userId || item.email === email);

  if (!participant || participant.role !== 'participant') {
    return res.status(404).json({ error: 'Participant user not found' });
  }

  if (!tournament.participantIds.includes(participant.id)) {
    tournament.participantIds.push(participant.id);
  }
  tournament.updatedAt = new Date().toISOString();
  await db.write();

  return res.status(201).json({ ok: true, participantId: participant.id, tournamentId: tournament.id });
});

app.delete('/api/tournaments/:id/participants/:participantId', requireAuth, requireRole('admin'), async (req, res) => {
  const tournament = getTournamentById(req.params.id);
  if (!canManageTournament(req.user.sub, req.user.role, tournament)) {
    return res.status(403).json({ error: 'Not allowed to remove participants' });
  }

  tournament.participantIds = tournament.participantIds.filter((item) => item !== req.params.participantId);
  tournament.updatedAt = new Date().toISOString();
  await db.write();

  return res.json({ ok: true });
});

app.get('/api/tournaments/:id/matches', requireAuth, (req, res) => {
  const tournament = getTournamentById(req.params.id);
  if (!canViewTournament(req.user.sub, req.user.role, tournament)) {
    return res.status(403).json({ error: 'Not allowed to view matches/results' });
  }

  const matches = db.data.matches.filter((item) => item.tournamentId === req.params.id);
  return res.json(matches);
});

app.post('/api/tournaments/:id/matches', requireAuth, requireRole('admin'), async (req, res) => {
  const tournament = getTournamentById(req.params.id);
  if (!canManageTournament(req.user.sub, req.user.role, tournament)) {
    return res.status(403).json({ error: 'Not allowed to create match' });
  }

  const { round = 1, table = 'Table 1', scheduledAt = null, playerAId, playerBId } = req.body;
  if (!playerAId || !playerBId) {
    return res.status(400).json({ error: 'playerAId and playerBId are required' });
  }

  const isInTournament = (id) => tournament.participantIds.includes(id);
  if (!isInTournament(playerAId) || !isInTournament(playerBId)) {
    return res.status(400).json({ error: 'Both players must be participants of this tournament' });
  }

  const match = {
    id: nanoid(),
    tournamentId: tournament.id,
    round,
    table,
    scheduledAt,
    playerAId,
    playerBId,
    scoreA: null,
    scoreB: null,
    winnerId: null,
    status: 'pending',
    updatedAt: new Date().toISOString(),
  };

  db.data.matches.push(match);
  await db.write();
  return res.status(201).json(match);
});

app.patch('/api/tournaments/:id/matches/:matchId/score', requireAuth, requireRole('admin'), async (req, res) => {
  const tournament = getTournamentById(req.params.id);
  if (!canManageTournament(req.user.sub, req.user.role, tournament)) {
    return res.status(403).json({ error: 'Not allowed to update scores' });
  }

  const match = db.data.matches.find((item) => item.id === req.params.matchId && item.tournamentId === req.params.id);
  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }
  if (match.status !== 'in-progress') {
    return res.status(400).json({ error: 'Match must be started before entering results' });
  }

  const { scoreA, scoreB, status = 'finished' } = req.body;
  match.scoreA = Number(scoreA);
  match.scoreB = Number(scoreB);
  match.status = status;
  match.winnerId = match.scoreA > match.scoreB ? match.playerAId : match.scoreB > match.scoreA ? match.playerBId : null;
  match.updatedAt = new Date().toISOString();
  await db.write();

  return res.json(match);
});

app.patch('/api/tournaments/:id/matches/:matchId/start', requireAuth, requireRole('admin'), async (req, res) => {
  const tournament = getTournamentById(req.params.id);
  if (!canManageTournament(req.user.sub, req.user.role, tournament)) {
    return res.status(403).json({ error: 'Not allowed to start this match' });
  }

  const match = db.data.matches.find((item) => item.id === req.params.matchId && item.tournamentId === req.params.id);
  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }
  if (match.status === 'finished') {
    return res.status(400).json({ error: 'Finished match cannot be started again' });
  }

  match.status = 'in-progress';
  match.startedAt = new Date().toISOString();
  match.updatedAt = new Date().toISOString();
  await db.write();
  return res.json(match);
});

app.post('/api/tournaments/:id/optimize', requireAuth, requireRole('admin'), async (req, res) => {
  const tournament = getTournamentById(req.params.id);
  if (!canManageTournament(req.user.sub, req.user.role, tournament)) {
    return res.status(403).json({ error: 'Not allowed to optimize this tournament' });
  }

  const formatValue = (tournament.format || '').toLowerCase();
  const { strategy: strategyFromBody, roundsRequested } = req.body;
  const inferredStrategy = formatValue.includes('szwajcars') || formatValue.includes('swiss')
    ? 'swiss'
    : 'round-robin';
  const strategy = strategyFromBody || inferredStrategy;
  const optimization = await optimizeSchedule({
    participants: tournament.participantIds,
    strategy,
    roundsRequested,
  });

  db.data.matches = db.data.matches.filter((item) => item.tournamentId !== tournament.id);
  optimization.rounds.forEach((roundMatches, roundIndex) => {
    roundMatches.forEach(([playerAId, playerBId], matchIndex) => {
      db.data.matches.push({
        id: nanoid(),
        tournamentId: tournament.id,
        round: roundIndex + 1,
        table: `Table ${matchIndex + 1}`,
        scheduledAt: null,
        playerAId,
        playerBId,
        scoreA: null,
        scoreB: null,
        winnerId: null,
        status: 'pending',
        startedAt: null,
        updatedAt: new Date().toISOString(),
      });
    });
  });

  const run = {
    id: nanoid(),
    tournamentId: tournament.id,
    strategy,
    source: optimization.source,
    summary: optimization.summary,
    createdAt: new Date().toISOString(),
  };

  tournament.autoOptimization = true;
  tournament.status = 'active';
  tournament.updatedAt = new Date().toISOString();
  db.data.optimizationRuns.push(run);
  await db.write();

  const matches = db.data.matches.filter((item) => item.tournamentId === tournament.id);
  return res.json({ run, matches });
});

app.get('/api/tournaments/:id/leaderboard', requireAuth, (req, res) => {
  const tournament = getTournamentById(req.params.id);
  if (!canViewTournament(req.user.sub, req.user.role, tournament)) {
    return res.status(403).json({ error: 'Not allowed to view leaderboard' });
  }

  const scores = new Map();
  for (const participantId of tournament.participantIds) {
    scores.set(participantId, { points: 0, wins: 0, losses: 0 });
  }

  const matches = db.data.matches.filter((item) => item.tournamentId === tournament.id && item.status === 'finished');
  for (const match of matches) {
    if (match.winnerId && scores.has(match.winnerId)) {
      scores.get(match.winnerId).points += 3;
      scores.get(match.winnerId).wins += 1;
    }
    const loserId = match.winnerId === match.playerAId ? match.playerBId : match.playerAId;
    if (match.winnerId && loserId && scores.has(loserId)) {
      scores.get(loserId).losses += 1;
    }
    if (!match.winnerId) {
      if (scores.has(match.playerAId)) scores.get(match.playerAId).points += 1;
      if (scores.has(match.playerBId)) scores.get(match.playerBId).points += 1;
    }
  }

  const leaderboard = Array.from(scores.entries())
    .map(([participantId, metrics]) => {
      const user = db.data.users.find((item) => item.id === participantId);
      return { participantId, name: user?.name || 'Unknown', ...metrics };
    })
    .sort((a, b) => b.points - a.points || b.wins - a.wins);

  return res.json(leaderboard);
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((err, _req, res, next) => {
  void next;
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Tournament backend running on http://localhost:${PORT}`);
});
