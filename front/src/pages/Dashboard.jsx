import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/useAppContext';
import { Trophy, Users, Calendar } from 'lucide-react';
import { backendClient } from '../api/backendClient';
import ApiState from '../components/ApiState';

const Dashboard = () => {
  const { userRole, language, token, setSelectedTournamentId } = useAppContext();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isPl = language === 'pl';

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await backendClient.getTournaments(token);
        setTournaments(data);
        const allMatches = await Promise.all(data.map((item) => backendClient.getTournamentMatches(token, item.id)));
        const pendingCount = allMatches.flat().filter((match) => match.status === 'pending' || match.status === 'in-progress').length;
        setUpcomingMatches(pendingCount);
      } catch (apiError) {
        setError(apiError.message);
      } finally {
        setLoading(false);
      }
    }
    if (token) load();
  }, [token]);

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await backendClient.getTournaments(token);
      setTournaments(data);
      const allMatches = await Promise.all(data.map((item) => backendClient.getTournamentMatches(token, item.id)));
      const pendingCount = allMatches.flat().filter((match) => match.status === 'pending' || match.status === 'in-progress').length;
      setUpcomingMatches(pendingCount);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const activeTournaments = useMemo(
    () => tournaments.filter((item) => item.status === 'active').length,
    [tournaments],
  );
  
  return (
    <>
      <div className="page-header">
        <h1>{isPl ? 'Dashboard' : 'Dashboard'}</h1>
      </div>
      
      <div className="section-wrapper" style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '20px' }}>
          {isPl ? 'Witaj,' : 'Welcome,'} {userRole === 'admin' ? (isPl ? 'Administratorze' : 'Admin') : (isPl ? 'Uczestniku' : 'Participant')}!
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div className="match-card" style={{ flexDirection: 'column', alignItems: 'center', padding: '30px' }}>
            <Trophy size={40} style={{ color: 'var(--accent-color)', marginBottom: '10px' }} />
            <h3>{isPl ? 'Aktywne Turnieje' : 'Active Tournaments'}</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '10px' }}>{activeTournaments}</p>
          </div>
          
          <div className="match-card" style={{ flexDirection: 'column', alignItems: 'center', padding: '30px' }}>
            <Users size={40} style={{ color: 'var(--primary-color)', marginBottom: '10px' }} />
            <h3>{isPl ? 'Uczestników' : 'Participants'}</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '10px' }}>
              {tournaments.reduce((sum, item) => sum + item.participantIds.length, 0)}
            </p>
          </div>
          
          <div className="match-card" style={{ flexDirection: 'column', alignItems: 'center', padding: '30px' }}>
            <Calendar size={40} style={{ color: 'var(--danger)', marginBottom: '10px' }} />
            <h3>{isPl ? 'Nadchodzące Mecze' : 'Upcoming Matches'}</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '10px' }}>
              {upcomingMatches}
            </p>
          </div>
        </div>
      </div>

      <div className="section-wrapper">
        <h2>{isPl ? 'Lista Turniejów' : 'Tournaments List'}</h2>
        <ApiState loading={loading} error={error} onRetry={reload} />
        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{isPl ? 'Nazwa Turnieju' : 'Tournament Name'}</th>
                <th>{isPl ? 'Data' : 'Date'}</th>
                <th>{isPl ? 'Format' : 'Format'}</th>
                <th>{isPl ? 'Status' : 'Status'}</th>
                <th>{isPl ? 'Podgląd' : 'View'}</th>
                {userRole === 'admin' && <th>{isPl ? 'Akcje' : 'Actions'}</th>}
              </tr>
            </thead>
            <tbody>
              {tournaments.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500, color: 'var(--primary-color)' }}>{t.name}</td>
                  <td>{t.date}</td>
                  <td>{t.format}</td>
                  <td>
                    <span className={`status-badge ${t.status === 'active' ? 'status-progress' : 'status-pending'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => {
                        setSelectedTournamentId(t.id);
                        navigate('/participants');
                      }}
                    >
                      {isPl ? 'Otwórz' : 'Open'}
                    </button>
                  </td>
                  {userRole === 'admin' ? (
                    <td>
                      <button 
                        className="btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          setSelectedTournamentId(t.id);
                          navigate('/new-tournament');
                        }}
                      >
                        {isPl ? 'Edytuj' : 'Edit'}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
