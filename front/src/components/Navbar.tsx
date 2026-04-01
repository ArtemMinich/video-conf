import { useNavigate, useLocation } from 'react-router-dom';
import type { UserInfo } from '../types';

interface NavbarProps {
  userInfo: UserInfo | null;
  isAdmin: boolean;
  onLogout: () => void;
}

function Navbar({ userInfo, isAdmin, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnAdmin = location.pathname === '/admin';
  const isOnFiles = location.pathname === '/files';

  const navBtn = (color: string): React.CSSProperties => ({
    padding: '6px 12px',
    backgroundColor: color,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  });

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 16px',
      backgroundColor: '#16213e',
      color: '#e0e0e8',
      borderBottom: '1px solid #2a2a4a',
      gap: '8px',
      flexWrap: 'wrap',
    }}>
      <h3
        style={{ margin: 0, cursor: 'pointer', fontSize: '16px', whiteSpace: 'nowrap' }}
        onClick={() => navigate('/')}
      >
        Video Conference
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {userInfo && <span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>{userInfo.firstName} {userInfo.lastName}</span>}
        <button
          onClick={() => navigate(isOnFiles ? '/' : '/files')}
          style={navBtn(isOnFiles ? '#ff9800' : '#7289da')}
        >
          {isOnFiles ? 'Back' : 'Files'}
        </button>
        {isAdmin && (
          <button
            onClick={() => navigate(isOnAdmin ? '/' : '/admin')}
            style={navBtn(isOnAdmin ? '#ff9800' : '#43b581')}
          >
            {isOnAdmin ? 'Back' : 'Admin'}
          </button>
        )}
        <button
          onClick={onLogout}
          style={{
            padding: '6px 12px',
            backgroundColor: '#3b3d54',
            color: '#e0e0e8',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
