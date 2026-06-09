import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import useStore from '../store/useStore';
import api from '../utils/api';

const VIBE_EMOJIS = { chill:'😎', travel:'✈️', study:'📚', startup:'🚀', gaming:'🎮', fitness:'💪', music:'🎵', movies:'🎬' };

export default function Matches() {
  const { user, matches } = useStore();
  const onlineUsers = new Set();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    (async () => {
      await fetchMatches();
      clearNewMatches();
      setLoading(false);
    })();
  }, []);

  const filtered = matches.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'online') return onlineUsers.has(m.otherUser?._id);
    if (filter === 'unread') return !m.lastMessage?.seen;
    return true;
  });

  if (loading) return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16 }}>Matches 💜</h1>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
          <div className="skeleton" style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 14, width: '80%' }} />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Matches 💜</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{matches.length} connections</p>
        </div>
        {newMatchCount > 0 && (
          <span className="badge badge-primary">{newMatchCount} new</span>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'online', 'unread'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '6px 16px', borderRadius: 100, border: `1.5px solid ${filter === f ? 'var(--primary)' : 'var(--border)'}`,
              background: filter === f ? 'rgba(124,58,237,0.15)' : 'var(--bg-tertiary)',
              color: filter === f ? 'var(--primary-light)' : 'var(--text-muted)',
              fontWeight: filter === f ? 700 : 500, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'capitalize'
            }}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>💜</div>
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No matches yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Keep discovering and swiping!</p>
          <Link to="/discover" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary">Discover People</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map((match, i) => {
            const other = match.otherUser;
            if (!other) return null;
            const isOnline = onlineUsers.has(other._id);
            return (
              <motion.div key={match._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/chat/${match._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
                    borderRadius: 16, transition: 'all 0.2s', cursor: 'pointer'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {other.avatar ? (
                        <img src={other.avatar} alt={other.name} className="avatar" style={{ width: 56, height: 56 }} />
                      ) : (
                        <div className="avatar" style={{ width: 56, height: 56, fontSize: '1.4rem' }}>
                          {other.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      {isOnline && <div className="online-dot" />}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{other.name}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                          {match.lastActivity ? formatDistanceToNow(new Date(match.lastActivity), { addSuffix: true }) : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {match.lastMessage ? match.lastMessage.content?.substring(0, 40) + (match.lastMessage.content?.length > 40 ? '...' : '') : 'Say hi! 👋'}
                        </span>
                        {match.compatibilityScore && (
                          <span className="badge badge-primary" style={{ fontSize: '0.7rem', flexShrink: 0 }}>
                            {match.compatibilityScore}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
