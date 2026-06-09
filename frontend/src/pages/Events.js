import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { EVENT_TYPES } from '../utils/constants';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'hackathon', dateTime: '', location: { name: '', city: '', virtual: false } });

  useEffect(() => { fetchEvents(); }, [activeType]);

  const fetchEvents = async () => {
    try { setLoading(true);
      const params = activeType !== 'all' ? { type: activeType } : {};
      const res = await api.get('/events', { params });
      setEvents(res.data.events);
    } catch (e) { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  const handleJoin = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post(`/events/${id}/join`);
      toast.success('Joined event! 🎉');
      fetchEvents();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const handleCreate = async () => {
    try {
      await api.post('/events', form);
      toast.success('Event created!');
      setShowCreate(false);
      fetchEvents();
    } catch (e) { toast.error('Failed to create'); }
  };

  const getTypeInfo = (type) => EVENT_TYPES.find(t => t.id === type) || { emoji: '🎯', label: type };

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>Events</h1>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Create</button>
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {[{ id: 'all', label: '✨ All' }, ...EVENT_TYPES].map(t => (
            <button key={t.id} onClick={() => setActiveType(t.id)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600, fontSize: 13, transition: 'var(--transition)', background: activeType === t.id ? 'var(--gradient-main)' : 'var(--bg-glass)', color: activeType === t.id ? 'white' : 'var(--text-secondary)' }}>
              {t.emoji ? `${t.emoji} ${t.label}` : t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content">
        {loading ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)', marginBottom: 16 }} />) :
          events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>🎯</div>
              <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No upcoming events</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Create the first one!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {events.map(ev => {
                const typeInfo = getTypeInfo(ev.type);
                const date = new Date(ev.dateTime);
                return (
                  <div key={ev._id} className="glass card" style={{ borderRadius: 'var(--radius-lg)', padding: 20 }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', background: 'var(--gradient-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>{typeInfo.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{ev.description}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📅 {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📍 {ev.location?.virtual ? 'Virtual' : (ev.location?.city || 'TBD')}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>👥 {ev.attendeeCount || 0} joined</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                      <span className="badge badge-primary">{typeInfo.emoji} {typeInfo.label}</span>
                      <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={e => handleJoin(ev._id, e)}>Join Event</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto' }}>
          <div className="glass" style={{ width: '100%', maxWidth: 480, padding: 32, borderRadius: 'var(--radius-xl)', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 800, fontSize: 20 }}>Create Event</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group"><label className="input-label">Event Title</label><input className="input" placeholder="YaarLink Hackathon 2024" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div className="input-group"><label className="input-label">Description</label><textarea className="input" rows={3} placeholder="What's this event about?" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="input-group"><label className="input-label">Type</label>
                <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {EVENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
                </select>
              </div>
              <div className="input-group"><label className="input-label">Date & Time</label><input className="input" type="datetime-local" value={form.dateTime} onChange={e => setForm(p => ({ ...p, dateTime: e.target.value }))} /></div>
              <div className="input-group"><label className="input-label">City</label><input className="input" placeholder="Mumbai / Virtual" value={form.location.city} onChange={e => setForm(p => ({ ...p, location: { ...p.location, city: e.target.value } }))} /></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.location.virtual} onChange={e => setForm(p => ({ ...p, location: { ...p.location, virtual: e.target.checked } }))} />
                <span style={{ fontSize: 14 }}>🌐 Virtual event</span>
              </label>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="btn btn-glass" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleCreate}>🚀 Create Event</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
