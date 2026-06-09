import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import useStore from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const { user } = useStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'moderator') { navigate('/discover'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [sRes, uRes, rRes] = await Promise.all([
        api.get('/admin/stats'), api.get('/admin/users'), api.get('/admin/reports')
      ]);
      setStats(sRes.data);
      setUsers(uRes.data.users);
      setReports(rRes.data.reports);
    } catch (e) { toast.error('Failed to load admin data'); }
    finally { setLoading(false); }
  };

  const banUser = async (userId, reason) => {
    try {
      await api.post(`/admin/users/${userId}/ban`, { reason });
      toast.success('User banned'); fetchData();
    } catch (e) { toast.error('Failed'); }
  };

  const resolveReport = async (reportId, status) => {
    try {
      await api.patch(`/admin/reports/${reportId}`, { status });
      toast.success('Report updated'); fetchData();
    } catch (e) { toast.error('Failed'); }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner-lg spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>🛡️ Admin Panel</h1>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {['dashboard', 'users', 'reports'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, textTransform: 'capitalize', background: tab === t ? 'var(--gradient-main)' : 'var(--bg-glass)', color: tab === t ? 'white' : 'var(--text-secondary)', transition: 'var(--transition)' }}>{t}</button>
          ))}
        </div>
      </div>

      <div className="page-content">
        {tab === 'dashboard' && stats && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Total Users', value: stats.totalUsers, emoji: '👥' },
                { label: 'Active Today', value: stats.activeToday, emoji: '🟢' },
                { label: 'Total Matches', value: stats.totalMatches, emoji: '💜' },
                { label: 'Open Reports', value: stats.openReports, emoji: '🚨' },
              ].map((s, i) => (
                <div key={i} className="glass" style={{ padding: 20, borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{s.emoji}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value?.toLocaleString() || 0}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div className="glass" style={{ padding: 20, borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>⚡ Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn btn-glass" onClick={() => setTab('reports')} style={{ justifyContent: 'flex-start' }}>📋 Review Reports ({reports.filter(r => r.status === 'pending').length} pending)</button>
                <button className="btn btn-glass" onClick={() => setTab('users')} style={{ justifyContent: 'flex-start' }}>👥 Manage Users</button>
              </div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div>
            <h2 style={{ fontWeight: 700, marginBottom: 16 }}>Users ({users.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {users.map(u => (
                <div key={u._id} className="glass card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="avatar avatar-md" style={{ background: 'var(--gradient-main)', flexShrink: 0 }}>
                    {u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : u.name?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {u.name}
                      {u.banned && <span className="badge badge-danger">Banned</span>}
                      {u.role === 'admin' && <span className="badge badge-warning">Admin</span>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>@{u.username} · Safety: {u.safetyScore?.overall || 0}</div>
                  </div>
                  {!u.banned && u.role !== 'admin' && (
                    <button className="btn btn-danger btn-sm" onClick={() => { const r = prompt('Ban reason?'); if (r) banUser(u._id, r); }}>Ban</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <div>
            <h2 style={{ fontWeight: 700, marginBottom: 16 }}>Reports ({reports.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reports.map(r => (
                <div key={r._id} className="glass card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span className={`badge ${r.status === 'pending' ? 'badge-danger' : 'badge-success'}`}>{r.status}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 14, marginBottom: 8 }}>
                    <strong>Reason:</strong> {r.reason} · <strong>By:</strong> {r.reporter?.name || 'Unknown'}
                  </div>
                  {r.description && <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>{r.description}</p>}
                  {r.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => resolveReport(r._id, 'resolved')}>Resolve</button>
                      <button className="btn btn-glass btn-sm" onClick={() => resolveReport(r._id, 'dismissed')}>Dismiss</button>
                    </div>
                  )}
                </div>
              ))}
              {reports.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>No reports! 🎉</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
