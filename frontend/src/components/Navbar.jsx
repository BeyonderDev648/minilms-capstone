import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="topbar">
      <div className="topbar__inner">
        <Link to={user ? '/dashboard' : '/login'} className="brand">
          MiniLMS
          {user && <span className="brand__role">{user.role}</span>}
        </Link>
        <div className="nav-links">
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              {user.role === 'student' && <Link to="/courses">Browse courses</Link>}
              {user.role === 'admin' && <Link to="/admin/users">Users</Link>}
              <span style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>{user.name}</span>
              <button className="linklike" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
