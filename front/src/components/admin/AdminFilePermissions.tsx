import { useEffect, useState, useRef, useCallback } from 'react';
import { fileApi } from '../../fileApi';
import type { FilePermission, UserSearchResult } from '../../types';

function AdminFilePermissions() {
  const [permissions, setPermissions] = useState<FilePermission[]>([]);
  const [searchPath, setSearchPath] = useState('');
  const [loading, setLoading] = useState(false);

  const [userId, setUserId] = useState<number | null>(null);
  const [grantPath, setGrantPath] = useState('');
  const [permType, setPermType] = useState<'READ' | 'WRITE'>('READ');

  // User search
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const doUserSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setUserResults([]); setShowUserDropdown(false); return; }
    setUserSearchLoading(true);
    try {
      const res = await fileApi.searchUsers(query);
      setUserResults(res.data);
      setShowUserDropdown(true);
    } catch { setUserResults([]); }
    finally { setUserSearchLoading(false); }
  }, []);

  const handleUserSearchChange = (value: string) => {
    setUserSearch(value);
    setUserId(null);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => doUserSearch(value), 300);
  };

  const selectUser = (user: UserSearchResult) => {
    setUserId(user.id);
    setUserSearch(`${user.username} (${user.firstName || ''} ${user.lastName || ''})`);
    setShowUserDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowUserDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const res = await fileApi.getPermissions(searchPath);
      setPermissions(res.data);
    } catch (e) {
      console.error('Failed to fetch permissions', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchPath !== '') fetchPermissions();
  }, []);

  const handleGrant = async () => {
    if (userId === null || !grantPath.trim()) return;
    try {
      await fileApi.grantPermission({
        userId,
        path: grantPath.trim(),
        permissionType: permType,
      });
      setUserId(null);
      setUserSearch('');
      setGrantPath('');
      if (searchPath === grantPath.trim() || searchPath === '') {
        setSearchPath(grantPath.trim());
        fetchPermissions();
      }
    } catch {
      alert('Failed to grant permission');
    }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm('Revoke this permission?')) return;
    try {
      await fileApi.revokePermission(id);
      fetchPermissions();
    } catch {
      alert('Failed to revoke permission');
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
      <h3 style={{ marginBottom: '12px' }}>Grant Permission</h3>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div ref={dropdownRef} style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Search user..."
            value={userSearch}
            onChange={(e) => handleUserSearchChange(e.target.value)}
            onFocus={() => userResults.length > 0 && setShowUserDropdown(true)}
            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
          />
          {showUserDropdown && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
              backgroundColor: '#1a1a3e', border: '1px solid #2a2a4a', borderRadius: '8px',
              maxHeight: '200px', overflowY: 'auto', marginTop: '2px',
            }}>
              {userSearchLoading ? (
                <div style={{ padding: '8px 12px', color: '#8888a8', fontSize: '13px' }}>Searching...</div>
              ) : userResults.length === 0 ? (
                <div style={{ padding: '8px 12px', color: '#5c5c7a', fontSize: '13px' }}>No users found</div>
              ) : (
                userResults.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => selectUser(u)}
                    style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #2a2a4a' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2a2a4a')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div style={{ fontWeight: 'bold', color: '#e0e0e8' }}>{u.username}</div>
                    <div style={{ color: '#8888a8', fontSize: '12px' }}>
                      {[u.firstName, u.lastName].filter(Boolean).join(' ')}
                      {u.email && ` · ${u.email}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <input
          type="text"
          placeholder="Path (e.g. docs/reports)"
          value={grantPath}
          onChange={(e) => setGrantPath(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: '150px' }}
        />
        <select value={permType} onChange={(e) => setPermType(e.target.value as any)} style={inputStyle}>
          <option value="READ">READ</option>
          <option value="WRITE">WRITE</option>
        </select>
        <button onClick={handleGrant} style={btnStyle('#43b581')}>Grant</button>
      </div>

      <h3 style={{ marginBottom: '12px' }}>Search Permissions by Path</h3>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Path to search"
          value={searchPath}
          onChange={(e) => setSearchPath(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchPermissions()}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={fetchPermissions} style={btnStyle('#7289da')}>Search</button>
      </div>

      {loading ? (
        <p style={{ color: '#8888a8' }}>Loading...</p>
      ) : (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
            <thead>
              <tr style={{ backgroundColor: '#16213e', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a' }}>User</th>
                <th style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a' }}>Path</th>
                <th style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a' }}>Type</th>
                <th style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a', fontSize: '13px' }}>{p.username}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a', fontSize: '14px' }}>{p.path || '/'}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: p.permissionType === 'READ' ? 'rgba(114,137,218,0.15)' : 'rgba(67,181,129,0.15)',
                      color: p.permissionType === 'READ' ? '#7289da' : '#43b581',
                    }}>
                      {p.permissionType}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a' }}>
                    <button onClick={() => handleRevoke(p.id)} style={btnStyle('#f04747')}>Revoke</button>
                  </td>
                </tr>
              ))}
              {permissions.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '16px 12px', textAlign: 'center', color: '#5c5c7a', borderBottom: '1px solid #2a2a4a' }}>
                    No permissions found
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

export default AdminFilePermissions;
