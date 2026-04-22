import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { backendClient } from '../api/backendClient';
import ApiState from '../components/ApiState';

const Results = () => {
  const { userRole, language, token, selectedTournamentId, setSelectedTournamentId } = useAppContext();
  const isPl = language === 'pl';
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadTournaments() {
      setLoading(true);
      const data = await backendClient.getTournaments(token);
      setTournaments(data);
      if (!selectedTournamentId && data.length > 0) {
        setSelectedTournamentId(data[0].id);
      }
    }
    if (token) {
      loadTournaments()
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [token, selectedTournamentId, setSelectedTournamentId]);

  useEffect(() => {
    async function loadTournamentData() {
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
      loadTournamentData()
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [token, selectedTournamentId]);

  const reload = async () => {
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

  const participantNameById = useMemo(() => {
    const map = new Map();
    leaderboard.forEach((item) => map.set(item.participantId, item.name));
    return map;
  }, [leaderboard]);

  const handleScoreChange = (id, newScore) => {
    setMatches((prev) => prev.map((m) => {
      if (m.id !== id) return m;
      const [scoreA, scoreB] = newScore.split('-').map((value) => Number(value.trim()));
      return { ...m, scoreA: Number.isFinite(scoreA) ? scoreA : 0, scoreB: Number.isFinite(scoreB) ? scoreB : 0 };
    }));
  };

  const saveScore = async (match) => {
    const updatedMatch = await backendClient.updateMatchScore(token, selectedTournamentId, match.id, {
      scoreA: match.scoreA ?? 0,
      scoreB: match.scoreB ?? 0,
      status: 'finished',
    });
    setMatches((prev) => prev.map((item) => (item.id === updatedMatch.id ? updatedMatch : item)));
    const refreshed = await backendClient.getLeaderboard(token, selectedTournamentId);
    setLeaderboard(refreshed);
  };

  const startMatch = async (match) => {
    const started = await backendClient.startMatch(token, selectedTournamentId, match.id);
    setMatches((prev) => prev.map((item) => (item.id === started.id ? started : item)));
  };

  return (
    <>
      <div className="page-header">
        <h1>{isPl ? 'Wyniki Turnieju' : 'Tournament Results'}</h1>
        <select aria-label={isPl ? 'Wybierz turniej' : 'Select tournament'} className="pretty-select" value={selectedTournamentId || ''} onChange={(event) => setSelectedTournamentId(event.target.value)}>
          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>{tournament.name}</option>
          ))}
        </select>
      </div>
      <ApiState loading={loading} error={error} onRetry={reload} />
      
      <div className="section-wrapper">
        <h2 style={{ display: 'flex', alignItems: 'center' }}>
          {isPl ? 'Wyniki na Żywo (Runda 1)' : 'Live Results (Round 1)'} <span className="live-dot"></span>
        </h2>
        
        <div className="matches-list" style={{ marginTop: '20px' }}>
          {matches.map((match) => (
            <div key={match.id} className="match-card">
              <div className="match-info">
                <span className="table-badge">{isPl ? match.table : match.table.replace('Stół', 'Table')}</span>
                <div className="players">
                  <span style={match.winner === match.player1 ? { fontWeight: 'bold', color: 'var(--primary-color)' } : {}}>
                    {participantNameById.get(match.playerAId) || match.playerAId}
                  </span>
                  <span style={{ color: 'var(--text-light)' }}>vs</span>
                  <span style={match.winner === match.player2 ? { fontWeight: 'bold', color: 'var(--primary-color)' } : {}}>
                    {participantNameById.get(match.playerBId) || match.playerBId}
                  </span>
                </div>
              </div>
              <div className="match-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                {userRole === 'admin' ? (
                  <input 
                    type="text" 
                    value={`${match.scoreA ?? 0} - ${match.scoreB ?? 0}`} 
                    onChange={(e) => handleScoreChange(match.id, e.target.value)}
                    disabled={match.status !== 'in-progress'}
                    aria-label={isPl ? 'Wynik meczu' : 'Match score'}
                    style={{ width: '60px', textAlign: 'center', padding: '4px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-color)', color: 'var(--text-color)' }}
                  />
                ) : (
                  <span className="score">{`${match.scoreA ?? 0} - ${match.scoreB ?? 0}`}</span>
                )}
                <span className={`status-badge ${match.status === 'finished' ? 'status-done' : 'status-progress'}`}>
                  {match.status}
                </span>
                {userRole === 'admin' && (
                  <>
                    {match.status === 'pending' ? (
                      <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => startMatch(match)}>
                        {isPl ? 'Rozpocznij mecz' : 'Start match'}
                      </button>
                    ) : null}
                    <button
                      className="btn-primary"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                      onClick={() => saveScore(match)}
                      disabled={match.status !== 'in-progress'}
                    >
                      {isPl ? 'Zapisz' : 'Save'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="section-wrapper">
        <h2>{isPl ? 'Tabela Rankingowa (Top 4)' : 'Leaderboard (Top 4)'}</h2>
        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{isPl ? 'Poz.' : 'Pos.'}</th>
                <th>{isPl ? 'Uczestnik' : 'Participant'}</th>
                <th>{isPl ? 'Pkt.' : 'Pts.'}</th>
                <th>{isPl ? 'Bilans' : 'Diff'}</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, index) => (
                <tr key={row.participantId}>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{index + 1}</td>
                  <td style={{ fontWeight: 500 }}>{row.name}</td>
                  <td>{row.points}</td>
                  <td>{row.wins - row.losses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Results;
