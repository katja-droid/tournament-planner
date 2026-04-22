import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { backendClient } from '../api/backendClient';
import ApiState from '../components/ApiState';

const Schedule = () => {
  const { userRole, language, token, selectedTournamentId, setSelectedTournamentId } = useAppContext();
  const isPl = language === 'pl';
  
  const [autoPlan, setAutoPlan] = useState(true);
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadTournaments() {
      setLoading(true);
      const list = await backendClient.getTournaments(token);
      setTournaments(list);
      if (!selectedTournamentId && list.length > 0) {
        setSelectedTournamentId(list[0].id);
      }
    }
    if (token) {
      loadTournaments()
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [token, selectedTournamentId, setSelectedTournamentId]);

  useEffect(() => {
    async function loadMatches() {
      if (!selectedTournamentId) return;
      setLoading(true);
      const [matchesData, leaderboardData] = await Promise.all([
        backendClient.getTournamentMatches(token, selectedTournamentId),
        backendClient.getLeaderboard(token, selectedTournamentId),
      ]);
      setMatches(matchesData);
      setLeaderboard(leaderboardData);
    }
    if (token) {
      loadMatches()
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [token, selectedTournamentId]);

  const participantNameById = useMemo(() => {
    const byId = new Map();
    leaderboard.forEach((entry) => byId.set(entry.participantId, entry.name));
    return byId;
  }, [leaderboard]);

  const getStatusBadgeClass = (status) => {
    if (status === 'finished') return 'status-done';
    if (status === 'in-progress') return 'status-progress';
    return 'status-pending';
  };

  const runOptimization = async () => {
    if (!selectedTournamentId) return;
    try {
      const result = await backendClient.optimizeTournament(token, selectedTournamentId, { strategy: 'round-robin' });
      setMatches(result.matches);
      setStatusMessage(result.run.summary);
      setAutoPlan(true);
    } catch (apiError) {
      setError(apiError.message);
    }
  };

  const reloadData = async () => {
    if (!selectedTournamentId) return;
    setLoading(true);
    setError('');
    try {
      const [matchesData, leaderboardData] = await Promise.all([
        backendClient.getTournamentMatches(token, selectedTournamentId),
        backendClient.getLeaderboard(token, selectedTournamentId),
      ]);
      setMatches(matchesData);
      setLeaderboard(leaderboardData);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{isPl ? 'Harmonogram Turnieju' : 'Tournament Schedule'}</h1>
          <select aria-label={isPl ? 'Wybierz turniej' : 'Select tournament'} className="pretty-select" value={selectedTournamentId || ''} onChange={(event) => setSelectedTournamentId(event.target.value)}>
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>{tournament.name}</option>
            ))}
          </select>
          <div style={{ color: 'var(--success)', fontWeight: 600, marginTop: '8px', fontSize: '14px' }}>
            {statusMessage || (isPl ? 'Status: gotowe do optymalizacji' : 'Status: ready for optimization')}
          </div>
        </div>
        {userRole === 'admin' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{isPl ? 'Automatyczne Planowanie AI' : 'AI Automatic Planning'}</span>
              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer', 
                  width: '50px', 
                  height: '24px', 
                  background: autoPlan ? 'var(--success)' : 'var(--border-color)', 
                  borderRadius: '24px',
                  position: 'relative',
                  transition: 'background 0.3s'
                }}
              >
                <input 
                  type="checkbox"
                  checked={autoPlan}
                  onChange={() => setAutoPlan(!autoPlan)}
                  aria-label={isPl ? 'Automatyczne Planowanie AI' : 'AI Automatic Planning'}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                />
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: autoPlan ? '28px' : '2px',
                  width: '20px',
                  height: '20px',
                  background: 'var(--white)',
                  borderRadius: '50%',
                  transition: 'left 0.3s'
                }} />
              </label>
            </div>
            {autoPlan && (
              <button className="btn-primary" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--primary-color)', border: '1px solid var(--primary-color)' }} onClick={runOptimization}>
                {isPl ? 'Uruchom Optymalizację Ponownie' : 'Run Optimization Again'}
              </button>
            )}
          </div>
        )}
      </div>
      <ApiState loading={loading} error={error} onRetry={reloadData} />

      <div className="section-wrapper">
        <h2>{isPl ? 'Plan Rozgrywek (Runda 1)' : 'Schedule Plan (Round 1)'}</h2>
        
        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{isPl ? 'Godzina' : 'Time'}</th>
                <th>{isPl ? 'Obiekt / Stół' : 'Table / Spot'}</th>
                <th>{isPl ? 'Uczestnik A' : 'Participant A'}</th>
                <th>{isPl ? 'Uczestnik B' : 'Participant B'}</th>
                <th>{isPl ? 'Status' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match.id}>
                  <td style={{ fontWeight: 600 }}>{match.round}</td>
                  <td>{match.table}</td>
                  <td>{participantNameById.get(match.playerAId) || match.playerAId}</td>
                  <td>{participantNameById.get(match.playerBId) || match.playerBId}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(match.status)}`}>
                      {match.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Schedule;
