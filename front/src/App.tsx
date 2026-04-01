import { useEffect, useState } from 'react';
import { isAuthenticated, clearTokens } from './auth';
import Navbar from './components/Navbar';
import AppRouter from './router';
import type { UserInfo } from './types';
import api from './api';

function App() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState<string | null>(null);

  const fetchUser = () => {
    if (isAuthenticated()) {
      api.get<UserInfo>('/users/me')
        .then((res) => setUserInfo(res.data))
        .catch(() => {
          clearTokens();
          setUserInfo(null);
        })
        .finally(() => setLoading(false));
    } else {
      setUserInfo(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogin = () => {
    setLoading(true);
    fetchUser();
  };

  const handleLogout = () => {
    clearTokens();
    setUserInfo(null);
    setRoomId(null);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'Arial', color: '#e0e0e8', backgroundColor: '#1a1a2e', minHeight: '100vh', paddingTop: '100px' }}>Loading...</div>;
  }

  const authenticated = !!userInfo;
  const isAdmin = userInfo?.roles?.includes('ADMIN') ?? false;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#1a1a2e', color: '#e0e0e8', minHeight: '100vh' }}>
      {authenticated && (
        <Navbar userInfo={userInfo} isAdmin={isAdmin} onLogout={handleLogout} />
      )}
      <div style={{ maxWidth: roomId ? undefined : '1100px', margin: '0 auto' }}>
        <AppRouter
          authenticated={authenticated}
          userInfo={userInfo}
          isAdmin={isAdmin}
          roomId={roomId}
          onLogin={handleLogin}
          onJoinRoom={(id) => setRoomId(id)}
          onLeaveRoom={() => setRoomId(null)}
        />
      </div>
    </div>
  );
}

export default App;
