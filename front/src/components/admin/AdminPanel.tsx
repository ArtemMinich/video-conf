import { useState } from 'react';
import AdminRooms from './AdminRooms';
import AdminFilePermissions from './AdminFilePermissions';

function AdminPanel() {
  const [tab, setTab] = useState<'rooms' | 'files'>('rooms');

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    backgroundColor: active ? '#7289da' : '#16213e',
    color: active ? 'white' : '#8888a8',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: active ? 'bold' : 'normal',
  });

  return (
    <div style={{ padding: '20px', color: '#e0e0e8' }}>
      <h2>Admin Panel</h2>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        <button onClick={() => setTab('rooms')} style={tabStyle(tab === 'rooms')}>Rooms</button>
        <button onClick={() => setTab('files')} style={tabStyle(tab === 'files')}>File Permissions</button>
      </div>
      {tab === 'rooms' ? <AdminRooms /> : <AdminFilePermissions />}
    </div>
  );
}

export default AdminPanel;
