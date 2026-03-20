import { useState } from 'react';
import api from '../api';

interface JoinRoomProps {
  onJoin: (roomId: string) => void;
}

function generateRoomId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function JoinRoom({ onJoin }: JoinRoomProps) {
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = roomId.trim();
    if (!trimmed) return;
    try {
      await api.get(`/rooms/${trimmed}`);
      onJoin(trimmed);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Room not found. Please check the ID and try again.');
      } else {
        setError('Failed to join room');
      }
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const newRoomId = generateRoomId();
      await api.post('/rooms', { roomId: newRoomId });
      onJoin(newRoomId);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '28px',
      padding: '20px',
    }}>
      <div style={{ textAlign: 'center', width: '100%', maxWidth: '420px' }}>
        <h2 style={{ color: '#e0e0e8', fontSize: '20px' }}>Join a Room</h2>
        <form onSubmit={handleJoin} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => { setRoomId(e.target.value); setError(''); }}
              style={{
                padding: '10px 16px',
                fontSize: '16px',
                border: error ? '1px solid #f04747' : '1px solid #2a2a4a',
                borderRadius: '8px',
                flex: 1,
                minWidth: 0,
                outline: 'none',
                backgroundColor: '#16213e',
                color: '#e0e0e8',
                transition: 'border-color 0.2s',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#5865f2',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Join
            </button>
          </div>
          {error && (
            <div style={{
              color: '#f04747',
              fontSize: '13px',
              backgroundColor: 'rgba(240,71,71,0.1)',
              border: '1px solid rgba(240,71,71,0.3)',
              borderRadius: '8px',
              padding: '8px 16px',
              width: '100%',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}
        </form>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        width: '100%',
        maxWidth: '360px',
      }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#2a2a4a' }} />
        <span style={{ color: '#5c5c7a', fontSize: '14px' }}>or</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#2a2a4a' }} />
      </div>

      <button
        onClick={handleCreate}
        disabled={loading}
        style={{
          padding: '12px 32px',
          fontSize: '16px',
          backgroundColor: '#43b581',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
        }}
      >
        {loading ? 'Creating...' : 'Create Room'}
      </button>
    </div>
  );
}

export default JoinRoom;
