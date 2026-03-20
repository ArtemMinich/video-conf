import { useEffect, useState } from 'react';
import { adminApi } from '../../adminApi';
import type { Room } from '../../types';

function AdminRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [newRoomId, setNewRoomId] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getRooms(statusFilter || undefined);
      setRooms(res.data);
    } catch (e) {
      console.error('Failed to fetch rooms', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [statusFilter]);

  const handleCreate = async () => {
    const trimmed = newRoomId.trim();
    if (!trimmed) return;
    try {
      await adminApi.createRoom(trimmed);
      setNewRoomId('');
      fetchRooms();
    } catch (e) {
      alert('Failed to create room');
    }
  };

  const handleClose = async (roomId: string) => {
    if (!confirm(`Force close room "${roomId}"?`)) return;
    try {
      await adminApi.closeRoom(roomId);
      fetchRooms();
    } catch (e) {
      alert('Failed to close room');
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm(`Delete room "${roomId}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteRoom(roomId);
      fetchRooms();
    } catch (e) {
      alert('Failed to delete room');
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid #2a2a4a',
    backgroundColor: '#16213e',
    color: '#e0e0e8',
    fontSize: '14px',
    minWidth: 0,
  };

  const btnStyle = (color: string): React.CSSProperties => ({
    padding: '6px 12px',
    backgroundColor: color,
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
          <option value="">All statuses</option>
          <option value="WAITING">WAITING</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="CLOSED">CLOSED</option>
        </select>
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <input
            type="text"
            placeholder="New Room ID"
            value={newRoomId}
            onChange={(e) => setNewRoomId(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={handleCreate} style={btnStyle('#43b581')}>Create</button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#8888a8' }}>Loading...</p>
      ) : (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
            <thead>
              <tr style={{ backgroundColor: '#16213e', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a' }}>Room ID</th>
                <th style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a' }}>Status</th>
                <th style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a' }}>Users</th>
                <th style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a' }}>Created</th>
                <th style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a', fontSize: '14px' }}>{room.roomId}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor:
                        room.status === 'ACTIVE' ? 'rgba(67,181,129,0.15)' :
                        room.status === 'WAITING' ? 'rgba(250,166,26,0.15)' : 'rgba(240,71,71,0.15)',
                      color:
                        room.status === 'ACTIVE' ? '#43b581' :
                        room.status === 'WAITING' ? '#faa61a' : '#f04747',
                    }}>
                      {room.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a', fontSize: '14px' }}>
                    {room.participants?.filter(p => !p.leftAt).length ?? 0}
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a', fontSize: '13px', color: '#8888a8' }}>
                    {new Date(room.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {room.status !== 'CLOSED' && (
                        <button onClick={() => handleClose(room.roomId)} style={btnStyle('#ff9800')}>Close</button>
                      )}
                      <button onClick={() => handleDelete(room.roomId)} style={btnStyle('#f04747')}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '16px 12px', textAlign: 'center', color: '#5c5c7a', borderBottom: '1px solid #2a2a4a' }}>
                    No rooms found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminRooms;
