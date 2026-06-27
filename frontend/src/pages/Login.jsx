import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container container--narrow">
      <h1>Welcome back</h1>
      <p style={{ color: 'var(--ink-soft)' }}>Log in to continue to your courses.</p>

      {error && <div className="alert alert--error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" placeholder='Enter your Email' required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" placeholder='Enter Password' required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
          <LogIn size={16} /> {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p style={{ marginTop: 'var(--space-3)', fontSize: '0.88rem' }}>
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}
