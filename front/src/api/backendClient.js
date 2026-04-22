const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }
  return payload;
}

export const backendClient = {
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  me: (token) => request('/auth/me', { token }),
  searchUsers: (token, query, role = 'participant') =>
    request(`/users/search?query=${encodeURIComponent(query)}&role=${encodeURIComponent(role)}`, { token }),
  getTournaments: (token) => request('/tournaments', { token }),
  createTournament: (token, data) => request('/tournaments', { method: 'POST', token, body: data }),
  updateTournament: (token, tournamentId, data) =>
    request(`/tournaments/${tournamentId}`, { method: 'PUT', token, body: data }),
  deleteTournament: (token, tournamentId) => request(`/tournaments/${tournamentId}`, { method: 'DELETE', token }),
  getTournamentParticipants: (token, tournamentId) => request(`/tournaments/${tournamentId}/participants`, { token }),
  addParticipantToTournament: (token, tournamentId, data) =>
    request(`/tournaments/${tournamentId}/participants`, { method: 'POST', token, body: data }),
  getTournamentMatches: (token, tournamentId) => request(`/tournaments/${tournamentId}/matches`, { token }),
  startMatch: (token, tournamentId, matchId) =>
    request(`/tournaments/${tournamentId}/matches/${matchId}/start`, { method: 'PATCH', token }),
  updateMatchScore: (token, tournamentId, matchId, data) =>
    request(`/tournaments/${tournamentId}/matches/${matchId}/score`, { method: 'PATCH', token, body: data }),
  optimizeTournament: (token, tournamentId, data = {}) =>
    request(`/tournaments/${tournamentId}/optimize`, { method: 'POST', token, body: data }),
  getLeaderboard: (token, tournamentId) => request(`/tournaments/${tournamentId}/leaderboard`, { token }),
};
