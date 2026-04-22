import React from 'react';
import { useAppContext } from '../context/useAppContext';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Globe, LogOut } from 'lucide-react';

const Settings = () => {
  const { theme, toggleTheme, language, changeLanguage, logout } = useAppContext();
  const navigate = useNavigate();
  const isPl = language === 'pl';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className="page-header">
        <h1>{isPl ? 'Ustawienia' : 'Settings'}</h1>
      </div>

      <div className="section-wrapper" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Theme Switch */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
              <div>
                <h3 style={{ margin: 0 }}>{isPl ? 'Motyw Graficzny' : 'Theme'}</h3>
                <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '14px' }}>
                  {isPl ? 'Przełącz między jasnym a ciemnym motywem' : 'Toggle between light and dark theme'}
                </p>
              </div>
            </div>
            <button className="btn-primary" onClick={toggleTheme}>
              {theme === 'dark' ? (isPl ? 'Jasny' : 'Light') : (isPl ? 'Ciemny' : 'Dark')}
            </button>
          </div>

          {/* Language Switch */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Globe size={24} />
              <div>
                <h3 style={{ margin: 0 }}>{isPl ? 'Język' : 'Language'}</h3>
                <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '14px' }}>
                  {isPl ? 'Wybierz język interfejsu' : 'Select interface language'}
                </p>
              </div>
            </div>
            <select 
              aria-label={isPl ? 'Wybierz język' : 'Select language'}
              className="pretty-select"
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-color)' }}
            >
              <option value="pl">Polski</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Logout */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <LogOut size={24} style={{ color: 'var(--danger)' }} />
              <div>
                <h3 style={{ margin: 0 }}>{isPl ? 'Wyloguj się' : 'Log out'}</h3>
                <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '14px' }}>
                  {isPl ? 'Opuść panel i wróć do logowania' : 'Leave the dashboard and go back to login'}
                </p>
              </div>
            </div>
            <button className="btn-primary" style={{ backgroundColor: 'var(--danger)' }} onClick={handleLogout}>
              {isPl ? 'Wyloguj' : 'Log out'}
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default Settings;
