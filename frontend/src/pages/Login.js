import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useStore from '../store/useStore';

const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Fill all fields');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      toast.success('Welcome back! 💜');
      navigate('/discover');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Background blobs */}
      <div style={{ position: 'absolute', top: -200, left: -200, width: 500, height: 500, background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -200, right: -200, width: 400, height: 400, background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 5 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(124,58,237,0.4)' }}>💜</div>
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Sign in to your YaarLink account</p>
        </div>

        <div className="glass" style={{ padding: 32, borderRadius: 'var(--radius-xl)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label className="input-label">Email or Username</label>
              <input className="input" type="text" placeholder="email@example.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} autoComplete="email" />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input className="input" type="password" placeholder="Your password" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} autoComplete="current-password" />
            </div>

            {/* Demo hint */}
            <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--primary-light)' }}>Demo:</strong> Register first, then login ✨
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
              {loading ? <span className="spinner" /> : 'Sign In 💜'}
            </button>

            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>Join YaarLink</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
