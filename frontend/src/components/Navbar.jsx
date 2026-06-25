import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, LayoutDashboard, BookOpen, Users, LogOut } from 'lucide-react';
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
          <span className="brand-mark"><GraduationCap size={18} /></span>
          MiniLMS
          {user && <span className={`role-pill role-pill--${user.role}`}>{user.role}</span>}
        </Link>
        <div className="nav-links">
          {user ? (
            <>
              <Link to="/dashboard" className="nav-link"><LayoutDashboard size={15} /> Dashboard</Link>
              {user.role === 'student' && (
                <Link to="/courses" className="nav-link"><BookOpen size={15} /> Browse courses</Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin/users" className="nav-link"><Users size={15} /> Users</Link>
              )}
              <span className="nav-user">{user.name}</span>
              <button className="linklike" onClick={handleLogout}><LogOut size={15} /> Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Log in</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
