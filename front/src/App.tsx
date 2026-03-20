import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, clearTokens } from './auth';
import Navbar from './components/Navbar';
import JoinRoom from './components/JoinRoom';
import VideoRoom from './components/VideoRoom';
import AdminPanel from './components/admin/AdminPanel';
import Login from './components/Login';
import Register from './components/Register';
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
        <Routes>
          <Route path="/login" element={
            authenticated ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
          } />
          <Route path="/register" element={
            authenticated ? <Navigate to="/" replace /> : <Register />
          } />
          <Route path="/" element={
            !authenticated ? <Navigate to="/login" replace /> :
              roomId ? (
                <VideoRoom roomId={roomId} onLeave={() => setRoomId(null)} />
              ) : (
                <JoinRoom onJoin={(id) => setRoomId(id)} />
              )
          } />
          <Route path="/admin" element={
            !authenticated ? <Navigate to="/login" replace /> :
              isAdmin ? <AdminPanel /> : <Navigate to="/" replace />
          } />
        </Routes>
      </div>
    </div>
  );
}

export default App;
