import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { COMMUNITY_CATEGORIES } from '../utils/constants';

const Communities = () => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', category: 'coders', isPrivate: false });
  const navigate = useNavigate();

  useEffect(() => { fetchCommunities(); }, [activeCategory]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeCategory !== 'all') params.category = activeCategory;
      if (search) params.search = search;
      const res = await api.get('/communities', { params });
      setCommunities(res.data.communities);
    } catch (e) { toast.error('Failed to load communities'); }
    finally { setLoading(false); }
  };

  const handleJoin = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post(`/communities/${id}/join`);
      toast.success('Joined! 🎉');
      fetchCommunities();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const handleCreate = async () => {
    try {
      const res = await api.post('/communities', form);
      toast.success('Community created!');
      setShowCreate(false);
      navigate(`/communities/${res.data.community._id}`);
    } catch (e) { toast.error('Create failed'); }
  };

  const getCatColor = (cat) => COMMUNITY_CATEGORIES.find(c => c.id === cat)?.color || 'var(--primary)';

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>Communities</h1>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Create</button>
        </div>
        <input className="input" placeholder="🔍 Search communities..." value={search}
          onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchCommunities()}
          style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {[{ id: 'all', label: '✨ All', color: 'var(--primary)' }, ...COMMUNITY_CATEGORIES].map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              style={{ padding: '6px 16px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600, fontSize: 13, transition: 'var(--transition)',
                background: activeCategory === cat.id ? cat.color || 'var(--gradient-main)' : 'var(--bg-glass)',
                color: activeCategory === cat.id ? 'white' : 'var(--text-secondary)' }}>
              {cat.label || (cat.emoji + ' ' + cat.label)}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ display: 'grid', gap: 16 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        ) : communities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🏘️</div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No communities yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Be the first to create one!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {communities.map(c => (
              <div key={c._id} onClick={() => navigate(`/communities/${c._id}`)}
                style={{ padding: 20, borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'var(--transition)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', background: `linear-gradient(135deg, ${getCatColor(c.category)}, ${getCatColor(c.category)}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                    {COMMUNITY_CATEGORIES.find(cat => cat.id === c.category)?.emoji || '👥'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h3 style={{ fontWeight: 700, fontSize: 16, truncate: true }}>{c.name}</h3>
                      {c.isPrivate && <span className="badge" style={{ fontSize: 10 }}>🔒 Private</span>}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>👥 {c.memberCount?.toLocaleString()} members</span>
                      <span className="badge" style={{ fontSize: 11, color: getCatColor(c.category), borderColor: getCatColor(c.category) + '44', background: getCatColor(c.category) + '22' }}>{c.category}</span>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={e => handleJoin(c._id, e)} style={{ flexShrink: 0 }}>Join</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="glass" style={{ width: '100%', maxWidth: 480, padding: 32, borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 800, fontSize: 20 }}>Create Community</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group"><label className="input-label">Name</label><input className="input" placeholder="Community name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="input-group"><label className="input-label">Description</label><textarea className="input" placeholder="What's this community about?" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
              <div className="input-group">
                <label className="input-label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {COMMUNITY_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isPrivate} onChange={e => setForm(p => ({ ...p, isPrivate: e.target.checked }))} />
                <span style={{ fontSize: 14 }}>🔒 Private community</span>
              </label>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="btn btn-glass" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleCreate}>🚀 Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Communities;
