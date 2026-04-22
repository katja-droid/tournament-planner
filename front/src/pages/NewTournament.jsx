import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { backendClient } from '../api/backendClient';

const NewTournament = () => {
  const { language, token, selectedTournamentId, setSelectedTournamentId } = useAppContext();
  const isPl = language === 'pl';
  const defaultFormData = {
    name: '',
    date: '',
    format: 'System Szwajcarski',
    rules: '',
    limitations: '',
  };
  const [mode, setMode] = useState('create');

  const [formData, setFormData] = useState(defaultFormData);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tournaments, setTournaments] = useState([]);
  const [participantQuery, setParticipantQuery] = useState('');
  const [participantSearchResults, setParticipantSearchResults] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');

  const loadTournaments = useCallback(async () => {
    try {
      const list = await backendClient.getTournaments(token);
      setTournaments(list);
    } catch {
      setTournaments([]);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const timer = setTimeout(() => {
      loadTournaments();
    }, 0);

    return () => clearTimeout(timer);
  }, [token, loadTournaments]);

  const selectedTournament = useMemo(
    () => tournaments.find((item) => item.id === selectedTournamentId) ?? null,
    [tournaments, selectedTournamentId],
  );

  const deletePhrase = useMemo(() => {
    if (!selectedTournament) return '';
    const prefix = isPl ? 'Chcę usunąć' : 'I want to delete';
    return `${prefix} ${selectedTournament.name}`;
  }, [isPl, selectedTournament]);

  const deleteAllowed = useMemo(() => {
    if (!deletePhrase) return false;
    return deleteConfirmText.trim() === deletePhrase;
  }, [deleteConfirmText, deletePhrase]);

  const applySelectedTournament = () => {
    if (!selectedTournament) return;
    setMode('edit');
    setFormData((prev) => ({
      ...prev,
      name: selectedTournament.name,
      date: selectedTournament.date,
      format: selectedTournament.format,
      rules: selectedTournament.rules || '',
      limitations: selectedTournament.limitations || '',
    }));
    backendClient
      .getTournamentParticipants(token, selectedTournament.id)
      .then((participants) => setSelectedParticipants(participants))
      .catch(() => setSelectedParticipants([]));
    setDeleteConfirmText('');
    setDeleteError('');
    setDeleteMessage('');
  };

  const switchToCreateMode = () => {
    setMode('create');
    setSelectedTournamentId(null);
    setFormData(defaultFormData);
    setSelectedParticipants([]);
    setParticipantQuery('');
    setParticipantSearchResults([]);
    setMessage('');
    setError('');
    setDeleteConfirmText('');
    setDeleteLoading(false);
    setDeleteError('');
    setDeleteMessage('');
  };

  const switchToEditMode = () => {
    setMode('edit');
    setMessage('');
    setError('');
    setDeleteConfirmText('');
    setDeleteLoading(false);
    setDeleteError('');
    setDeleteMessage('');
  };

  const handleDeleteTournament = async () => {
    if (!selectedTournamentId || !selectedTournament) {
      setDeleteError(isPl ? 'Najpierw wybierz turniej do usunięcia.' : 'Select a tournament to delete first.');
      return;
    }
    if (!deleteAllowed) {
      setDeleteError(isPl ? 'Wpisz dokładnie wymaganą frazę.' : 'Type the required phrase exactly.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');
    setDeleteMessage('');
    try {
      await backendClient.deleteTournament(token, selectedTournamentId);
      await loadTournaments();
      setSelectedTournamentId(null);
      setMode('create');
      setFormData(defaultFormData);
      setSelectedParticipants([]);
      setParticipantQuery('');
      setParticipantSearchResults([]);
      setDeleteConfirmText('');
      setDeleteMessage(isPl ? 'Turniej usunięty.' : 'Tournament deleted.');
    } catch (apiError) {
      setDeleteError(apiError.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setMessage('');
    setError('');
    try {
      const payload = {
        name: formData.name,
        date: formData.date,
        format: formData.format,
        rules: formData.rules,
        limitations: formData.limitations,
      };
      let tournament;
      if (mode === 'edit') {
        if (!selectedTournamentId) {
          setError(isPl ? 'Najpierw wybierz turniej do edycji.' : 'Select a tournament to edit first.');
          return;
        }
        tournament = await backendClient.updateTournament(token, selectedTournamentId, payload);
      } else {
        tournament = await backendClient.createTournament(token, payload);
      }

      await Promise.all(
        selectedParticipants.map((participant) =>
          backendClient.addParticipantToTournament(token, tournament.id, { userId: participant.id }).catch(() => null),
        ),
      );

      await loadTournaments();
      setSelectedTournamentId(tournament.id);
      setMessage(
        mode === 'edit'
          ? (isPl ? 'Turniej zaktualizowany.' : 'Tournament updated.')
          : (isPl ? 'Nowy turniej utworzony.' : 'New tournament created.'),
      );
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

  const addSelectedParticipant = (user) => {
    setSelectedParticipants((prev) => (prev.some((item) => item.id === user.id) ? prev : [...prev, user]));
  };

  const removeSelectedParticipant = (userId) => {
    setSelectedParticipants((prev) => prev.filter((item) => item.id !== userId));
  };

  const formats = [
    { pl: 'System Szwajcarski', en: 'Swiss System' },
    { pl: 'Pucharowy', en: 'Knockout Bracket' },
    { pl: 'Każdy z każdym', en: 'Round Robin' }
  ];

  return (
    <>
      <div className="page-header">
        <h1>{isPl ? 'Zarządzanie Turniejami' : 'Tournaments Management'}</h1>
      </div>
      
      <div className="section-wrapper">
        <h2 style={{ marginBottom: '20px' }}>{isPl ? 'Podgląd Turniejów' : 'View Tournaments'}</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button
            className="btn-primary"
            type="button"
            onClick={switchToCreateMode}
            style={mode === 'create' ? {} : { opacity: 0.75 }}
          >
            {isPl ? 'Utwórz nowy turniej' : 'Create new tournament'}
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={switchToEditMode}
            style={mode === 'edit' ? {} : { opacity: 0.75 }}
          >
            {isPl ? 'Edytuj istniejący turniej' : 'Edit existing tournament'}
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{isPl ? 'Nazwa' : 'Name'}</th>
                <th>{isPl ? 'Data' : 'Date'}</th>
                <th>{isPl ? 'Format' : 'Format'}</th>
                <th>{isPl ? 'Status' : 'Status'}</th>
                <th>{isPl ? 'Uczestnicy' : 'Participants'}</th>
                <th>{isPl ? 'Akcja' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.length > 0 ? (
                tournaments.map((tournament) => (
                  <tr key={tournament.id}>
                    <td style={{ fontWeight: 600 }}>{tournament.name}</td>
                    <td>{tournament.date}</td>
                    <td>{tournament.format}</td>
                    <td>{tournament.status}</td>
                    <td>{tournament.participantIds?.length || 0}</td>
                    <td>
                      <button
                        className="btn-primary"
                        type="button"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          setSelectedTournamentId(tournament.id);
                          setMode('edit');
                          setMessage(isPl ? 'Wybrano turniej do edycji.' : 'Tournament selected for edit.');
                        }}
                      >
                        {isPl ? 'Wybierz' : 'Select'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center' }}>
                    {isPl ? 'Brak turniejów do wyświetlenia.' : 'No tournaments to display.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section-wrapper">
        <h2 style={{ marginBottom: '20px' }}>
          {mode === 'create'
            ? (isPl ? 'Utwórz Nowy Turniej' : 'Create New Tournament')
            : (isPl ? 'Edytuj Turniej' : 'Edit Tournament')}
        </h2>
        {message ? <p style={{ color: 'var(--success)' }}>{message}</p> : null}
        {error ? <p style={{ color: 'var(--danger)' }}>{error}</p> : null}
        {mode === 'edit' && selectedTournament ? (
          <button className="btn-primary" type="button" onClick={applySelectedTournament} style={{ marginBottom: '16px' }}>
            {isPl ? 'Załaduj wybrany turniej do formularza' : 'Load selected tournament into form'}
          </button>
        ) : null}
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="inputName">{isPl ? 'Nazwa Turnieju' : 'Tournament Name'}</label>
            <input 
              id="inputName"
              type="text" 
              name="name"
              value={formData.name} 
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="inputDate">{isPl ? 'Data rozpoczęcia' : 'Start Date'}</label>
            <input 
              id="inputDate"
              type="date" 
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="selectFormat">{isPl ? 'Format Rozgrywek' : 'Tournament Format'}</label>
            <select id="selectFormat" className="pretty-select" name="format" value={formData.format} onChange={handleChange}>
              {formats.map(f => (
                <option key={f.pl} value={f.pl}>{isPl ? f.pl : f.en}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="inputRules">{isPl ? 'Zasady' : 'Rules'}</label>
            <input 
              id="inputRules"
              type="text"
              name="rules"
              placeholder={isPl ? 'np. Best of 3 w finałach' : 'e.g. Best of 3 in finals'}
              value={formData.rules}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="inputLimits">{isPl ? 'Ograniczenia (np. limit wieku)' : 'Limitations (e.g. Age Limit)'}</label>
            <input 
              id="inputLimits"
              type="text" 
              name="limitations"
              value={formData.limitations}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="inputSearchUser">{isPl ? 'Wyszukaj istniejących użytkowników' : 'Search existing users'}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="inputSearchUser"
                type="text"
                value={participantQuery}
                onChange={(event) => setParticipantQuery(event.target.value)}
                placeholder={isPl ? 'Imię lub email uczestnika' : 'Participant name or email'}
              />
              <button className="btn-primary" type="button" onClick={searchParticipants}>
                {isPl ? 'Szukaj' : 'Search'}
              </button>
            </div>
          </div>
        </div>

        {participantSearchResults.length > 0 ? (
          <div className="form-row">
            <div className="form-group">
              <label>{isPl ? 'Wyniki wyszukiwania' : 'Search results'}</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {participantSearchResults.map((user) => (
                  <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{user.name} ({user.email})</span>
                    <button type="button" className="btn-primary" onClick={() => addSelectedParticipant(user)}>
                      {isPl ? 'Dodaj' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="form-row">
          <div className="form-group">
            <label>{isPl ? 'Wybrani uczestnicy' : 'Selected participants'}</label>
            {selectedParticipants.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedParticipants.map((user) => (
                  <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{user.name} ({user.email})</span>
                    <button type="button" className="btn-primary" onClick={() => removeSelectedParticipant(user.id)}>
                      {isPl ? 'Usuń' : 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0 }}>{isPl ? 'Brak wybranych uczestników.' : 'No selected participants.'}</p>
            )}
          </div>
        </div>
        
        <div className="btn-container">
          <button className="btn-primary" type="button" onClick={handleSubmit}>
            {mode === 'create'
              ? (isPl ? 'Utwórz turniej i Generuj Harmonogram' : 'Create Tournament and Generate Schedule')
              : (isPl ? 'Zapisz zmiany i Generuj Harmonogram' : 'Save Changes and Generate Schedule')}
          </button>
        </div>
      </div>

      {mode === 'edit' && selectedTournament ? (
        <div className="section-wrapper" style={{ border: '1px solid var(--danger)', background: 'rgba(255, 0, 0, 0.04)' }}>
          <h2 style={{ marginBottom: '10px', color: 'var(--danger)' }}>{isPl ? 'Strefa zagrożenia' : 'Danger zone'}</h2>
          <p style={{ marginTop: 0 }}>
            {isPl
              ? 'Usunięcie turnieju jest nieodwracalne. Aby potwierdzić, wpisz dokładnie poniższą frazę.'
              : 'Deleting a tournament is irreversible. To confirm, type the exact phrase below.'}
          </p>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
              {isPl ? 'Wymagana fraza' : 'Required phrase'}
            </div>
            <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
              {deletePhrase}
            </div>
          </div>
          <div className="form-row" style={{ marginTop: 10 }}>
            <div className="form-group">
              <label htmlFor="inputDeleteConfirm">{isPl ? 'Wpisz frazę potwierdzającą' : 'Type confirmation phrase'}</label>
              <input
                id="inputDeleteConfirm"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={deletePhrase}
                aria-label={isPl ? 'Fraza potwierdzająca usunięcie' : 'Deletion confirmation phrase'}
              />
            </div>
          </div>
          {deleteMessage ? <p style={{ color: 'var(--success)', marginTop: 0 }}>{deleteMessage}</p> : null}
          {deleteError ? <p style={{ color: 'var(--danger)', marginTop: 0 }}>{deleteError}</p> : null}
          <button
            className="btn-primary"
            type="button"
            onClick={handleDeleteTournament}
            disabled={!deleteAllowed || deleteLoading}
            style={{
              background: 'var(--danger)',
              opacity: !deleteAllowed || deleteLoading ? 0.6 : 1,
            }}
          >
            {deleteLoading ? (isPl ? 'Usuwanie...' : 'Deleting...') : (isPl ? 'Usuń turniej' : 'Delete tournament')}
          </button>
        </div>
      ) : null}
    </>
  );
};

export default NewTournament;
