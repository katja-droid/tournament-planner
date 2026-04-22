import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../context/useAppContext';
import { Menu, X, Trophy, Users, Settings, LayoutDashboard, Calendar, FileText } from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { userRole, language } = useAppContext();
  const isPl = language === 'pl';

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  // Define nav items, filtering out those restricted to admins if user is participant
  const navItems = [
    { name: isPl ? 'Dashboard' : 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'participant'] },
    { name: isPl ? 'Turnieje (Zarządzanie)' : 'Tournaments (Manage)', path: '/new-tournament', icon: Trophy, roles: ['admin'] },
    { name: isPl ? 'Uczestnicy' : 'Participants', path: '/participants', icon: Users, roles: ['admin', 'participant'] },
    { name: isPl ? 'Harmonogram' : 'Schedule', path: '/schedule', icon: Calendar, roles: ['admin', 'participant'] },
    { name: isPl ? 'Wyniki' : 'Results', path: '/results', icon: FileText, roles: ['admin', 'participant'] },
    { name: isPl ? 'Ustawienia' : 'Settings', path: '/settings', icon: Settings, roles: ['admin', 'participant'] },
  ].filter(item => item.roles.includes(userRole));

  return (
    <aside className="sidebar">
      <h2>
        <Trophy size={24} />
        <span style={{ fontSize: '18px' }}>{userRole === 'admin' ? (isPl ? 'Panel Admina' : 'Admin Panel') : (isPl ? 'Panel Zawodnika' : 'Player Panel')}</span>
        <button className="mobile-toggle" onClick={toggleSidebar} aria-label={isPl ? 'Przełącz menu' : 'Toggle menu'}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </h2>
      
      <ul className={`nav-menu ${isOpen ? 'open' : ''}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.path} className="nav-item">
              <NavLink 
                to={item.path} 
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={closeSidebar}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default Sidebar;
