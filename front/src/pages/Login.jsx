import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/useAppContext';
import { Trophy, User, ShieldAlert } from 'lucide-react';
import { backendClient } from '../api/backendClient';

const Login = () => {
  const { login } = useAppContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@demo.local');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await backendClient.login({ email, password });
      login(response);
      navigate('/dashboard');
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const applyDemoCredentials = (role) => {
    if (role === 'admin') {
      setEmail('admin@demo.local');
      setPassword('Admin123!');
      return;
    }
    setEmail('participant@demo.local');
    setPassword('Participant123!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      <div className="section-wrapper" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
        <Trophy size={48} style={{ color: 'var(--primary-color)', marginBottom: '20px' }} />
        <h1 style={{ marginBottom: '30px' }}>E-sport Turnieje</h1>
        
        <p style={{ marginBottom: '20px', color: 'var(--text-light)' }}>Zaloguj się aby kontynuować</p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            aria-label="Adres email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Hasło"
            aria-label="Hasło"
            required
          />
          {error ? <p style={{ margin: 0, color: 'var(--danger)', fontSize: '14px' }}>{error}</p> : null}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Logowanie...' : 'Zaloguj'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '16px' }}>
          <button 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            onClick={() => applyDemoCredentials('admin')}
            type="button"
          >
            <ShieldAlert size={18} />
            Użyj konta demo Administrator
          </button>
          
          <button 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: 'var(--accent-color)' }}
            onClick={() => applyDemoCredentials('participant')}
            type="button"
          >
            <User size={18} />
            Użyj konta demo Uczestnik
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
