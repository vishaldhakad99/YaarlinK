import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useStore from '../store/useStore';

const Register = () => {
  const navigate = useNavigate();
  const { setAuth } = useStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', age: '', gender: '' });

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      toast.success('Welcome to YaarLink! 🎉');
      navigate('/onboarding');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>YaarLink</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Create your account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Find your Yaar today 💜</p>
        </div>

        <div className="glass" style={{ padding: 32, borderRadius: 'var(--radius-xl)' }}>
          {/* Progress */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? 'var(--gradient-main)' : 'var(--border)', transition: 'var(--transition)' }} />
            ))}
          </div>

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input className="input" placeholder="Rahul Sharma" value={form.name} onChange={e => update('name', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Username</label>
                <input className="input" placeholder="@rahul_sharma" value={form.username} onChange={e => update('username', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input className="input" type="email" placeholder="rahul@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Password</label>
                <input className="input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => update('password', e.target.value)} />
              </div>
              <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => {
                if (!form.name || !form.username || !form.email || !form.password) return toast.error('Fill all fields');
                setStep(2);
              }}>Continue →</button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Age</label>
                <input className="input" type="number" placeholder="18+" value={form.age} onChange={e => update('age', e.target.value)} min="18" max="100" />
              </div>
              <div className="input-group">
                <label className="input-label">Gender</label>
                <select className="input" value={form.gender} onChange={e => update('gender', e.target.value)} style={{ appearance: 'none' }}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-glass" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ flex: 2 }}>
                  {loading ? <span className="spinner" /> : '🚀 Join YaarLink'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: 14 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
