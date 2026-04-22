import { db } from './db.js';

export function getTournamentById(tournamentId) {
  return db.data.tournaments.find((item) => item.id === tournamentId);
}

export function canViewTournament(userId, role, tournament) {
  if (!tournament) {
    return false;
  }

  if (role === 'admin' && tournament.adminId === userId) {
    return true;
  }

  if (role === 'participant' && tournament.participantIds.includes(userId)) {
    return true;
  }

  return false;
}

export function canManageTournament(userId, role, tournament) {
  return Boolean(tournament && role === 'admin' && tournament.adminId === userId);
}
