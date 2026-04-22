import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { backendClient } from '../api/backendClient';
import ApiState from '../components/ApiState';

const Participants = () => {
  const { language, userRole, token, selectedTournamentId, setSelectedTournamentId } = useAppContext();
  const isPl = language === 'pl';
  const [tournaments, setTournaments] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [participantQuery, setParticipantQuery] = useState('');
  const [participantSearchResults, setParticipantSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadTournaments() {
      setLoading(true);
      try {
        const list = await backendClient.getTournaments(token);
        setTournaments(list);
        if (!selectedTournamentId && list.length > 0) {
          setSelectedTournamentId(list[0].id);
        }
      } catch (apiError) {
        setError(apiError.message);
      } finally {
        setLoading(false);
      }
    }
    if (token) loadTournaments();
  }, [token, selectedTournamentId, setSelectedTournamentId]);

  useEffect(() => {
    async function loadParticipants() {
      if (!selectedTournamentId) return;
      setLoading(true);
      try {
        const list = await backendClient.getTournamentParticipants(token, selectedTournamentId);
        setParticipants(list);
      } catch (apiError) {
        setError(apiError.message);
      } finally {
        setLoading(false);
      }
    }
    if (token) loadParticipants();
  }, [token, selectedTournamentId]);

  const handleEditClick = (participant) => {
    setEditingParticipant(participant);
  };

  const handleCloseModal = () => {
    setEditingParticipant(null);
  };

  const addParticipantByUser = async (userId) => {
    if (!userId || !selectedTournamentId) return;
    try {
      await backendClient.addParticipantToTournament(token, selectedTournamentId, { userId });
      const updated = await backendClient.getTournamentParticipants(token, selectedTournamentId);
      setParticipants(updated);
    } catch (apiError) {
      setError(apiError.message);
    }
  };

  const searchParticipants = async () => {
    try {
      const users = await backendClient.searchUsers(token, participantQuery, 'participant');
      setParticipantSearchResults(users);
    } catch (apiError) {
      setError(apiError.message);
    }
  };

  const reloadData = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const tournamentsList = await backendClient.getTournaments(token);
      setTournaments(tournamentsList);
      const activeTournamentId = selectedTournamentId || tournamentsList[0]?.id;
      if (activeTournamentId) {
        setSelectedTournamentId(activeTournamentId);
        const participantsList = await backendClient.getTournamentParticipants(token, activeTournamentId);
        setParticipants(participantsList);
      }
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>{isPl ? 'Uczestnicy' : 'Participants'}</h1>
        {userRole === 'admin' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={participantQuery}
              placeholder={isPl ? 'Szukaj uczestnika (imię/email)' : 'Search participant (name/email)'}
              aria-label={isPl ? 'Szukaj uczestnika' : 'Search participant'}
              onChange={(event) => setParticipantQuery(event.target.value)}
            />
            <button className="btn-primary" type="button" onClick={searchParticipants}>
              {isPl ? 'Szukaj' : 'Search'}
            </button>
          </div>
        )}
      </div>
      {error ? <p style={{ color: 'var(--danger)' }}>{error}</p> : null}
      <ApiState loading={loading} error={error} onRetry={reloadData} />

      <div className="section-wrapper" style={{ marginBottom: '20px' }}>
        {userRole === 'admin' && participantSearchResults.length > 0 ? (
          <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {participantSearchResults.map((user) => (
              <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{user.name} ({user.email})</span>
                <button className="btn-primary" type="button" onClick={() => addParticipantByUser(user.id)}>
                  {isPl ? 'Dodaj do turnieju' : 'Add to tournament'}
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <label htmlFor="tournamentSelect" style={{ fontWeight: 'bold' }}>{isPl ? 'Wybierz turniej:' : 'Select tournament:'}</label>
          <select 
            id="tournamentSelect"
            className="form-control pretty-select" 
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--white)', color: 'var(--text-color)', minWidth: '250px' }}
            value={selectedTournamentId || ''}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
          >
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="section-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{isPl ? 'Imię i Nazwisko / Nick' : 'Name / Nickname'}</th>
              <th>{isPl ? 'Drużyna' : 'Team'}</th>
              <th>{isPl ? 'Punkty (Ogółem)' : 'Points (Total)'}</th>
              {userRole === 'admin' && <th>{isPl ? 'Akcje' : 'Actions'}</th>}
            </tr>
          </thead>
          <tbody>
            {participants.length > 0 ? (
              participants.map((p) => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td>-</td>
                  <td>-</td>
                  {userRole === 'admin' && (
                    <td>
                      <button 
                        className="btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleEditClick(p)}
                      >
                        {isPl ? 'Edytuj' : 'Edit'}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={userRole === 'admin' ? 5 : 4} style={{ textAlign: 'center', padding: '20px' }}>
                  {isPl ? 'Brak uczestników dla tego turnieju.' : 'No participants for this tournament.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingParticipant && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ backgroundColor: 'var(--bg-color)', padding: '24px', borderRadius: '8px', minWidth: '350px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '20px' }}>{isPl ? 'Edytuj dane uczestnika' : 'Edit participant data'}</h3>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="editName" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-color)' }}>{isPl ? 'Imię i nazwisko / Nick' : 'Name / Nickname'}</label>
              <input 
                id="editName"
                type="text" 
                defaultValue={editingParticipant.name} 
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--white)', color: 'var(--text-color)' }} 
              />
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label htmlFor="editTeam" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-color)' }}>{isPl ? 'Drużyna' : 'Team'}</label>
              <input 
                id="editTeam"
                type="text" 
                defaultValue={editingParticipant.team} 
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--white)', color: 'var(--text-color)' }} 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={handleCloseModal}
                style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', cursor: 'pointer' }}
              >
                {isPl ? 'Anuluj' : 'Cancel'}
              </button>
              <button 
                className="btn-primary" 
                onClick={handleCloseModal}
              >
                {isPl ? 'Zapisz' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Participants;
