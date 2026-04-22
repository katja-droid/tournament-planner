import React, { useState, useEffect, useMemo } from 'react';
import { backendClient } from '../api/backendClient';
import { AppContext } from './AppContextObject';

export const AppProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [currentUser, setCurrentUser] = useState(() => {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'pl');
  const [selectedTournamentId, setSelectedTournamentId] = useState(localStorage.getItem('selectedTournamentId') || null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    if (!selectedTournamentId) {
      localStorage.removeItem('selectedTournamentId');
      return;
    }
    localStorage.setItem('selectedTournamentId', selectedTournamentId);
  }, [selectedTournamentId]);

  useEffect(() => {
    let mounted = true;

    async function bootstrapAuth() {
      if (!token) {
        setAuthReady(true);
        return;
      }
      try {
        const me = await backendClient.me(token);
        if (!mounted) return;
        setCurrentUser(me);
        localStorage.setItem('currentUser', JSON.stringify(me));
      } catch {
        if (!mounted) return;
        setToken(null);
        setCurrentUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
      } finally {
        if (mounted) setAuthReady(true);
      }
    }

    bootstrapAuth();
    return () => {
      mounted = false;
    };
  }, [token]);

  const login = ({ token: accessToken, user }) => {
    setToken(accessToken);
    setCurrentUser(user);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    setSelectedTournamentId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('selectedTournamentId');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  const value = useMemo(() => ({
    token,
    currentUser,
    userRole: currentUser?.role ?? null,
    authReady,
    theme,
    language,
    selectedTournamentId,
    setSelectedTournamentId,
    login,
    logout,
    toggleTheme,
    changeLanguage,
  }), [token, currentUser, authReady, theme, language, selectedTournamentId]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
