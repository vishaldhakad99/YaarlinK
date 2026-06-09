import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import api from '../utils/api';

const VIBES = ['chill','travel','study','startup','gaming','fitness','music','movies'];
const MOODS = ['😊 Happy','🤩 Adventurous','🎯 Focused','🥳 Social','🤔 Reflective','🎨 Creative','⚡ Energetic','😴 Chill'];
const VIBE_EMOJIS = { chill:'😎', travel:'✈️', study:'📚', startup:'🚀', gaming:'🎮', fitness:'💪', music:'🎵', movies:'🎬' };

function SafetyRing({ score, size = 40 }) {
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  return (
    <div className="safety-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={3} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" />
      </svg>
      <span className="score-text" style={{ color: 'white', fontSize: size * 0.22 }}>{score}</span>
    </div>
  );
}

function SwipeCard({ user, onSwipe, blindMode }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-20, 20]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 100) onSwipe(user._id, 'like');
    else if (info.offset.x < -100) onSwipe(user._id, 'pass');
  };

  const showPhoto = !blindMode && !user.blindMode;
  const displayPhoto = showPhoto && user.photos?.[0];

  return (
    <motion.div
      style={{ x, rotate, opacity, position: 'absolute', width: '100%', cursor: 'grab', touchAction: 'none' }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
    >
      <div className="match-card" style={{ margin: '0 auto', background: 'var(--bg-tertiary)' }}>
        {/* Like/Pass overlays */}
        <motion.div style={{ opacity: likeOpacity, position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
          <div style={{ background: 'var(--success)', color: 'white', padding: '8px 20px', borderRadius: 12, fontWeight: 800, fontSize: '1.4rem', border: '3px solid white', transform: 'rotate(-15deg)' }}>YAAR!</div>
        </motion.div>
        <motion.div style={{ opacity: passOpacity, position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
          <div style={{ background: 'var(--danger)', color: 'white', padding: '8px 20px', borderRadius: 12, fontWeight: 800, fontSize: '1.4rem', border: '3px solid white', transform: 'rotate(15deg)' }}>NOPE</div>
        </motion.div>

        {/* Card image/placeholder */}
        {displayPhoto ? (
          <img src={displayPhoto} alt={user.name} style={{ width: '100%', height: 480, objectFit: 'cover', display: 'block', userSelect: 'none', pointerEvents: 'none' }} />
        ) : (
          <div style={{
            height: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${blindMode || user.blindMode ? '#1A1A24' : 'var(--bg-tertiary)'}, var(--bg-secondary))`,
            fontSize: blindMode || user.blindMode ? 80 : 64
          }}>
            {blindMode || user.blindMode ? '🎭' : '👤'}
            {(blindMode || user.blindMode) && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 16, textAlign: 'center', maxWidth: 200 }}>
                Blind Mode Active<br />Connect through personality first
              </p>
            )}
          </div>
        )}

        {/* Card info overlay */}
        <div className="match-card-info">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{user.name}, {user.age}</h2>
                {user.verified?.email && <span style={{ background: 'var(--primary)', borderRadius: 6, padding: '2px 6px', fontSize: '0.7rem', fontWeight: 700 }}>✓</span>}
              </div>
              <p style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: 8 }}>{user.bio || 'Living my best life ✨'}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', padding: '4px 10px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600 }}>
                  {VIBE_EMOJIS[user.currentVibe]} {user.currentVibe}
                </span>
                {user.compatibilityScore && (
                  <span style={{ background: 'rgba(16,185,129,0.8)', padding: '4px 10px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700 }}>
                    {user.compatibilityScore}% match
                  </span>
                )}
                {user.sharedInterests?.length > 0 && (
                  <span style={{ background: 'rgba(124,58,237,0.8)', padding: '4px 10px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600 }}>
                    {user.sharedInterests.length} shared interests
                  </span>
                )}
              </div>
            </div>
            <SafetyRing score={user.safetyScore?.overall || 70} size={48} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Discover() {
  const { user, setVibe, setMood } = useStore();
  const [users, setUsers] = useState([]);
  const [mode, setMode] = useState('ai');
  const [loading, setLoading] = useState(true);
  const [aiCoach, setAiCoach] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => { fetchUsers(); }, [mode]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/discover?mode=${mode}&limit=20`);
      setUsers(res.data.users);
    } catch (e) {
      toast.error('Failed to load users');
    }
    setLoading(false);
  };

  const handleSwipe = async (userId, direction) => {
    try {
      const res = await api.post('/discover/swipe', { targetUserId: userId, direction });
      if (res.data.matched) {
        toast(`🎉 It's a match!`, {
          icon: '💜',
          style: { background: 'var(--gradient-main)', color: 'white', fontWeight: 700 }
        });
      }
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (e) {}
  };

  const getAiTip = async () => {
    try {
      const res = await api.post('/ai/coach', { context: 'Discovery tips', question: 'Give me one quick tip to improve my YaarLink profile for better matches' });
      setAiCoach(res.data.advice);
    } catch (e) {}
  };

  const currentUser = users[0];

  return (
    <div style={{ padding: '16px 16px 0', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Discover 🔮</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{users.length} people nearby</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={getAiTip} title="AI Coach">🤖</button>
          <button className="btn-ghost" onClick={() => setShowFilters(!showFilters)} title="Filters">⚡</button>
        </div>
      </div>

      {/* AI Coach tip */}
      <AnimatePresence>
        {aiCoach && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass card" style={{ marginBottom: 16, background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.1))', border: '1px solid rgba(124,58,237,0.2)', position: 'relative' }}>
            <button onClick={() => setAiCoach(null)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>✕</button>
            <p style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 600, marginBottom: 4 }}>🤖 AI Coach</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{aiCoach}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {[['ai','🤖 For You'],['vibe','⚡ Vibe'],['mood','🎭 Mood'],['blind','🎭 Blind']].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)}
            style={{
              padding: '8px 16px', borderRadius: 100, border: `1.5px solid ${mode === m ? 'var(--primary)' : 'var(--border)'}`,
              background: mode === m ? 'rgba(124,58,237,0.15)' : 'var(--bg-tertiary)',
              color: mode === m ? 'var(--primary-light)' : 'var(--text-muted)',
              fontWeight: mode === m ? 700 : 500, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
            }}>{label}</button>
        ))}
      </div>

      {/* Vibe selector (shown when vibe mode) */}
      {(showFilters || mode === 'vibe') && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginBottom: 16 }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>Current vibe: <strong style={{ color: 'var(--primary-light)' }}>{user?.currentVibe}</strong></p>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {VIBES.map(v => (
              <button key={v} onClick={() => setVibe(v)}
                className={`vibe-${v}`}
                style={{
                  padding: '6px 14px', borderRadius: 100, border: 'none', color: 'white',
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                  opacity: user?.currentVibe === v ? 1 : 0.5
                }}>{VIBE_EMOJIS[v]} {v}</button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Mood selector */}
      {mode === 'mood' && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
          {MOODS.map(m => (
            <button key={m} className="mood-pill" onClick={() => setMood(m.split(' ')[1]?.toLowerCase() || 'happy')}
              style={{ flexShrink: 0, fontSize: '0.8rem' }}>{m}</button>
          ))}
        </div>
      )}

      {/* Swipe Stack */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 480, borderRadius: 24 }} />)}
        </div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>💜</div>
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>You're all caught up!</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Check back later or try a different vibe</p>
          <button className="btn btn-primary" onClick={fetchUsers} style={{ margin: '0 auto' }}>Refresh Feed</button>
        </div>
      ) : (
        <div style={{ position: 'relative', height: 540, marginBottom: 20 }}>
          <AnimatePresence>
            {users.slice(0, 3).reverse().map((u, i) => (
              <motion.div key={u._id}
                style={{
                  position: 'absolute', width: '100%',
                  transform: `scale(${1 - (users.slice(0,3).reverse().length - 1 - i) * 0.05}) translateY(${(users.slice(0,3).reverse().length - 1 - i) * -12}px)`,
                  zIndex: i
                }}
                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                animate={{ scale: 1 - (users.slice(0,3).reverse().length - 1 - i) * 0.05, y: (users.slice(0,3).reverse().length - 1 - i) * -12, opacity: 1 }}
              >
                {i === users.slice(0,3).length - 1 && (
                  <SwipeCard user={u} onSwipe={handleSwipe} blindMode={mode === 'blind' || u.blindMode} />
                )}
                {i !== users.slice(0,3).length - 1 && (
                  <div className="match-card" style={{ margin: '0 auto', background: 'var(--bg-tertiary)', height: 480 }} />
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Action buttons */}
          {users[0] && (
            <div style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 20, zIndex: 20 }}>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleSwipe(users[0]._id, 'pass')}
                style={{ width: 56, height: 56, borderRadius: '50%', background: 'white', border: '2px solid var(--danger)', fontSize: '1.5rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleSwipe(users[0]._id, 'superlike')}
                style={{ width: 48, height: 48, borderRadius: '50%', background: 'white', border: '2px solid var(--accent)', fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
                ⭐
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleSwipe(users[0]._id, 'like')}
                style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--gradient-main)', border: 'none', fontSize: '1.5rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                💜
              </motion.button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
