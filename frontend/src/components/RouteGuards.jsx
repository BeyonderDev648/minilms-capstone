import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Requires any logged-in user. Used for /dashboard, etc.
export function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// Requires a logged-in user with a specific role. Used for teacher-only
// and admin-only pages - mirrors the Flask prototype's @role_required.
export function RoleRoute({ role, children }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (!user || user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
}
