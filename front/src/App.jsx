import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './context/useAppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewTournament from './pages/NewTournament';
import Participants from './pages/Participants';
import Results from './pages/Results';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';

function ProtectedRoute({ children, allowedRoles }) {
  const { userRole, authReady } = useAppContext();

  if (!authReady) {
    return null;
  }
  
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route 
          path="new-tournament" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <NewTournament />
            </ProtectedRoute>
          } 
        />
        <Route path="participants" element={<Participants />} />
        <Route path="results" element={<Results />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
