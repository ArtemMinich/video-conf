import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import JoinRoom from './components/JoinRoom';
import VideoRoom from './components/VideoRoom';
import FileBrowser from './components/FileBrowser';
import AdminPanel from './components/admin/AdminPanel';
import type { UserInfo } from './types';

interface AppRouterProps {
  authenticated: boolean;
  userInfo: UserInfo | null;
  isAdmin: boolean;
  roomId: string | null;
  onLogin: () => void;
  onJoinRoom: (id: string) => void;
  onLeaveRoom: () => void;
}

function AppRouter({ authenticated, userInfo, isAdmin, roomId, onLogin, onJoinRoom, onLeaveRoom }: AppRouterProps) {
  return (
    <Routes>
      <Route path="/login" element={
        authenticated ? <Navigate to="/" replace /> : <Login onLogin={onLogin} />
      } />
      <Route path="/register" element={
        authenticated ? <Navigate to="/" replace /> : <Register />
      } />
      <Route path="/" element={
        !authenticated ? <Navigate to="/login" replace /> :
          roomId ? (
            <VideoRoom roomId={roomId} onLeave={onLeaveRoom} />
          ) : (
            <JoinRoom onJoin={onJoinRoom} />
          )
      } />
      <Route path="/files" element={
        !authenticated ? <Navigate to="/login" replace /> :
          <FileBrowser userInfo={userInfo} />
      } />
      <Route path="/admin" element={
        !authenticated ? <Navigate to="/login" replace /> :
          isAdmin ? <AdminPanel /> : <Navigate to="/" replace />
      } />
    </Routes>
  );
}

export default AppRouter;
