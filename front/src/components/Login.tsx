import { useState } from 'react';
import { Link } from 'react-router-dom';
import { loginRequest, setTokens } from '../auth';

interface LoginProps {
  onLogin: () => void;
}

function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginRequest(username, password);
      setTokens(res.accessToken, res.refreshToken);
      onLogin();
    } catch {
      setError('Invalid username or password');
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px 16px',
    fontSize: '16px',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    backgroundColor: '#16213e',
    color: '#e0e0e8',
    outline: 'none',
    width: '100%',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#1a1a2e',
      color: '#e0e0e8',
      padding: '20px',
    }}>
      <h2 style={{ fontSize: '22px' }}>Video Conference</h2>
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        maxWidth: '320px',
      }}>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={inputStyle} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
        {error && <div style={{ color: '#f04747', fontSize: '14px' }}>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px',
            fontSize: '16px',
            backgroundColor: '#5865f2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            width: '100%',
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: '16px', fontSize: '14px', color: '#8888a8' }}>
        Don't have an account? <Link to="/register" style={{ color: '#5865f2' }}>Register</Link>
      </p>
    </div>
  );
}

export default Login;
