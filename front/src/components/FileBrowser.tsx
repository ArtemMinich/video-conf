import { useEffect, useState, useRef, useCallback } from 'react';
import { fileApi } from '../fileApi';
import type { FileItem, FilePermission, UserInfo, UserSearchResult } from '../types';

interface FileBrowserProps {
  userInfo: UserInfo | null;
}

function FileBrowser({ userInfo }: FileBrowserProps) {
  const [items, setItems] = useState<FileItem[]>([]);
  const [dirCanWrite, setDirCanWrite] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ name: string; percent: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin permissions panel
  const [permPath, setPermPath] = useState<string | null>(null);
  const [perms, setPerms] = useState<FilePermission[]>([]);
  const [permUserId, setPermUserId] = useState<number | null>(null);
  const [permType, setPermType] = useState<'READ' | 'WRITE'>('READ');
  const [permsLoading, setPermsLoading] = useState(false);

  // User search for permissions
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = userInfo?.roles?.includes('ADMIN') ?? false;

  const doUserSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUserResults([]);
      setShowUserDropdown(false);
      return;
    }
    setUserSearchLoading(true);
    try {
      const res = await fileApi.searchUsers(query);
      setUserResults(res.data);
      setShowUserDropdown(true);
    } catch {
      setUserResults([]);
    } finally {
      setUserSearchLoading(false);
    }
  }, []);

  const handleUserSearchChange = (value: string) => {
    setUserSearch(value);
    setSelectedUser(null);
    setPermUserId(null);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => doUserSearch(value), 300);
  };

  const selectUser = (user: UserSearchResult) => {
    setSelectedUser(user);
    setPermUserId(user.id);
    setUserSearch(`${user.username} (${user.firstName || ''} ${user.lastName || ''})`);
    setShowUserDropdown(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fileApi.listDirectory(currentPath);
      const sorted = res.data.items.sort((a, b) => {
        if (a.directory !== b.directory) return a.directory ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      setItems(sorted);
      setDirCanWrite(res.data.canWrite);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load files');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentPath]);

  const handleNavigate = (item: FileItem) => {
    if (item.directory) setCurrentPath(item.path);
  };

  const handleGoUp = () => {
    const lastSlash = currentPath.lastIndexOf('/');
    setCurrentPath(lastSlash > 0 ? currentPath.substring(0, lastSlash) : '');
  };

  const handleDownload = async (item: FileItem) => {
    try {
      const res = await fileApi.downloadFile(item.path);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Download failed');
    }
  };

  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

  const uploadFileChunked = async (file: File) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = crypto.randomUUID();

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const chunk = file.slice(start, start + CHUNK_SIZE);
      await fileApi.uploadChunk(uploadId, i, currentPath, chunk);
      setUploadProgress({ name: file.name, percent: Math.round(((i + 1) / totalChunks) * 100) });
    }

    await fileApi.completeChunkedUpload(uploadId, currentPath, file.name, totalChunks);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      for (const file of Array.from(files)) {
        if (file.size > CHUNK_SIZE) {
          await uploadFileChunked(file);
        } else {
          setUploadProgress({ name: file.name, percent: 0 });
          await fileApi.uploadFiles(currentPath, [file]);
          setUploadProgress({ name: file.name, percent: 100 });
        }
      }
      fetchItems();
    } catch {
      alert('Upload failed');
    }
    setUploadProgress(null);
    e.target.value = '';
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    const folderPath = currentPath ? `${currentPath}/${name}` : name;
    try {
      await fileApi.createFolder(folderPath);
      setNewFolderName('');
      setShowNewFolder(false);
      fetchItems();
    } catch {
      alert('Failed to create folder');
    }
  };

  const handleDelete = async (item: FileItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      await fileApi.deleteItem(item.path);
      fetchItems();
    } catch {
      alert('Delete failed');
    }
  };

  // Permissions management
  const openPerms = async (path: string) => {
    setPermPath(path);
    setPermsLoading(true);
    try {
      const res = await fileApi.getPermissions(path);
      setPerms(res.data);
    } catch {
      setPerms([]);
    } finally {
      setPermsLoading(false);
    }
  };

  const handleGrant = async () => {
    if (permUserId === null || permPath === null) return;
    try {
      await fileApi.grantPermission({ userId: permUserId, path: permPath, permissionType: permType });
      setPermUserId(null);
      setUserSearch('');
      setSelectedUser(null);
      openPerms(permPath);
    } catch {
      alert('Failed to grant permission');
    }
  };

  const handleRevoke = async (id: number) => {
    if (permPath === null) return;
    try {
      await fileApi.revokePermission(id);
      openPerms(permPath);
    } catch {
      alert('Failed to revoke');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
    return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  };

  const breadcrumbs = currentPath ? currentPath.split('/') : [];
  const canWrite = isAdmin || dirCanWrite;

  const inputStyle: React.CSSProperties = {
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid #2a2a4a',
    backgroundColor: '#16213e',
    color: '#e0e0e8',
    fontSize: '14px',
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

  const permBadge = (type: string): React.CSSProperties => ({
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    backgroundColor: type === 'READ' ? 'rgba(114,137,218,0.15)' : type === 'WRITE' ? 'rgba(67,181,129,0.15)' : 'rgba(240,71,71,0.15)',
    color: type === 'READ' ? '#7289da' : type === 'WRITE' ? '#43b581' : '#f04747',
  });

  return (
    <div style={{ padding: '20px', color: '#e0e0e8', maxWidth: '1100px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '16px' }}>Files</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px', flexWrap: 'wrap', fontSize: '14px' }}>
        <span style={{ cursor: 'pointer', color: '#7289da' }} onClick={() => setCurrentPath('')}>/</span>
        {breadcrumbs.map((part, i) => {
          const path = breadcrumbs.slice(0, i + 1).join('/');
          return (
            <span key={path}>
              <span style={{ color: '#5c5c7a' }}>/</span>
              <span
                style={{ cursor: 'pointer', color: i === breadcrumbs.length - 1 ? '#e0e0e8' : '#7289da' }}
                onClick={() => setCurrentPath(path)}
              >
                {part}
              </span>
            </span>
          );
        })}
        {isAdmin && (
          <button onClick={() => openPerms(currentPath)} style={{ ...btnStyle('#ff9800'), marginLeft: '8px', fontSize: '12px', padding: '4px 8px' }}>
            Permissions
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {(isAdmin || canWrite) && (
          <>
            <button onClick={() => fileInputRef.current?.click()} style={btnStyle('#43b581')}>Upload</button>
            <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleUpload} />
            <button onClick={() => setShowNewFolder(!showNewFolder)} style={btnStyle('#7289da')}>New Folder</button>
          </>
        )}
        {showNewFolder && (
          <>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              style={inputStyle}
            />
            <button onClick={handleCreateFolder} style={btnStyle('#43b581')}>Create</button>
          </>
        )}
      </div>

      {uploadProgress && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', color: '#8888a8', marginBottom: '4px' }}>
            Uploading: {uploadProgress.name} — {uploadProgress.percent}%
          </div>
          <div style={{ height: '6px', backgroundColor: '#2a2a4a', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${uploadProgress.percent}%`, backgroundColor: '#43b581', transition: 'width 0.2s' }} />
          </div>
        </div>
      )}

      {error && <p style={{ color: '#f04747' }}>{error}</p>}

      {loading ? (
        <p style={{ color: '#8888a8' }}>Loading...</p>
      ) : (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
            <thead>
              <tr style={{ backgroundColor: '#16213e', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a' }}>Name</th>
                <th style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a' }}>Size</th>
                <th style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a' }}>Modified</th>
                <th style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPath && (
                <tr>
                  <td
                    colSpan={4}
                    style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a', cursor: 'pointer', color: '#7289da', fontSize: '14px' }}
                    onClick={handleGoUp}
                  >
                    ..
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr key={item.path}>
                  <td
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid #2a2a4a',
                      cursor: item.directory ? 'pointer' : 'default',
                      color: item.directory ? '#7289da' : '#e0e0e8',
                      fontSize: '14px',
                    }}
                    onClick={() => handleNavigate(item)}
                  >
                    {item.directory ? '\uD83D\uDCC1 ' : '\uD83D\uDCC4 '}{item.name}
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a', fontSize: '13px', color: '#8888a8' }}>
                    {formatSize(item.size)}
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a', fontSize: '13px', color: '#8888a8' }}>
                    {new Date(item.lastModified).toLocaleString()}
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a4a' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {!item.directory && (item.canRead || isAdmin) && (
                        <button onClick={() => handleDownload(item)} style={btnStyle('#7289da')}>Download</button>
                      )}
                      {(item.canWrite || isAdmin) && (
                        <button onClick={() => handleDelete(item)} style={btnStyle('#f04747')}>Delete</button>
                      )}
                      {isAdmin && (
                        <button onClick={() => openPerms(item.path)} style={{ ...btnStyle('#ff9800'), fontSize: '12px' }}>Perm</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '16px 12px', textAlign: 'center', color: '#5c5c7a', borderBottom: '1px solid #2a2a4a' }}>
                    Empty folder
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin permissions panel */}
      {isAdmin && permPath !== null && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#16213e',
          borderRadius: '8px',
          border: '1px solid #2a2a4a',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>Permissions: /{permPath || '(root)'}</h3>
            <button onClick={() => setPermPath(null)} style={btnStyle('#3b3d54')}>Close</button>
          </div>

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
                        style={{
                          padding: '8px 12px', cursor: 'pointer', fontSize: '13px',
                          borderBottom: '1px solid #2a2a4a',
                        }}
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
            <select value={permType} onChange={(e) => setPermType(e.target.value as any)} style={inputStyle}>
              <option value="READ">READ</option>
              <option value="WRITE">WRITE</option>
            </select>
            <button onClick={handleGrant} style={btnStyle('#43b581')}>Grant</button>
          </div>

          {permsLoading ? (
            <p style={{ color: '#8888a8' }}>Loading...</p>
          ) : perms.length === 0 ? (
            <p style={{ color: '#5c5c7a' }}>No permissions set for this path</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid #2a2a4a', fontSize: '13px' }}>User</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid #2a2a4a', fontSize: '13px' }}>Type</th>
                  <th style={{ padding: '6px 8px', borderBottom: '1px solid #2a2a4a', fontSize: '13px' }}></th>
                </tr>
              </thead>
              <tbody>
                {perms.map((p) => (
                  <tr key={p.id}>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #2a2a4a', fontSize: '13px' }}>{p.username}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #2a2a4a' }}>
                      <span style={permBadge(p.permissionType)}>{p.permissionType}</span>
                    </td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #2a2a4a' }}>
                      <button onClick={() => handleRevoke(p.id)} style={{ ...btnStyle('#f04747'), fontSize: '12px', padding: '4px 8px' }}>Revoke</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default FileBrowser;
