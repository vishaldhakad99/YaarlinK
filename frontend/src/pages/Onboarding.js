import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import api from '../utils/api';

const VIBES = [
  { id: 'chill', emoji: '😎', label: 'Chill', desc: 'Just vibing' },
  { id: 'travel', emoji: '✈️', label: 'Travel', desc: 'Always exploring' },
  { id: 'study', emoji: '📚', label: 'Study', desc: 'Learning mode' },
  { id: 'startup', emoji: '🚀', label: 'Startup', desc: 'Building things' },
  { id: 'gaming', emoji: '🎮', label: 'Gaming', desc: 'GG ez' },
  { id: 'fitness', emoji: '💪', label: 'Fitness', desc: 'Grind mode' },
  { id: 'music', emoji: '🎵', label: 'Music', desc: 'Always listening' },
  { id: 'movies', emoji: '🎬', label: 'Movies', desc: 'Film buff' },
];

const INTERESTS = [
  '🎮 Gaming', '💻 Coding', '🎵 Music', '🎬 Movies', '📚 Reading', '✈️ Travel',
  '🍕 Food', '🏃 Fitness', '📸 Photography', '🎨 Art', '🌿 Nature', '☕ Coffee',
  '🚀 Startups', '💰 Finance', '🎭 Theater', '🎤 Singing', '🏋️ Gym', '🧘 Yoga',
  '🐾 Pets', '🌍 Culture', '⚽ Sports', '🎯 Chess', '🎲 Board Games', '🍳 Cooking'
];

const PURPOSES = [
  { id: 'dating', emoji: '💕', label: 'Dating', desc: 'Find romance' },
  { id: 'friendship', emoji: '🤝', label: 'Friends', desc: 'Make connections' },
  { id: 'networking', emoji: '💼', label: 'Network', desc: 'Professional growth' },
  { id: 'community', emoji: '🏘️', label: 'Community', desc: 'Join groups' },
];

const PROMPTS = [
  "Two truths and a lie:",
  "My love language is:",
  "I'm weirdly passionate about:",
  "Best trip I've ever taken:",
  "I'll know we vibe if you:",
  "My ideal Sunday looks like:",
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    vibe: '', interests: [], purposes: [], bio: '',
    prompts: [], blindMode: false
  });
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [promptAnswer, setPromptAnswer] = useState('');
  const { updateUser } = useStore();
  const navigate = useNavigate();

  const steps = ['Vibe', 'Purpose', 'Interests', 'Bio & Prompts', 'Safety'];
  const progress = ((step + 1) / (steps.length + 1)) * 100;

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const addPrompt = () => {
    if (!selectedPrompt || !promptAnswer) return;
    setData(d => ({ ...d, prompts: [...d.prompts.slice(0, 2), { question: selectedPrompt, answer: promptAnswer }] }));
    setSelectedPrompt(''); setPromptAnswer('');
  };

  const finish = async () => {
    try {
      const res = await api.patch('/users/profile', {
        currentVibe: data.vibe,
        lookingFor: data.purposes,
        interests: data.interests.map(i => i.split(' ').slice(1).join(' ').toLowerCase()),
        bio: data.bio,
        prompts: data.prompts,
        blindMode: data.blindMode
      });
      updateUser(res.data.user);
      toast.success('Profile set up! Welcome to YaarLink 🎉');
      navigate('/discover');
    } catch (e) {
      toast.error('Setup failed');
    }
  };

  const toggle = (arr, item) =>
    arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Progress */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Step {step + 1} of {steps.length}</span>
            <span>{steps[step]}</span>
          </div>
          <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 4 }}>
            <motion.div style={{ height: '100%', borderRadius: 4, background: 'var(--gradient-main)' }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>

            {/* Step 0: Vibe */}
            {step === 0 && (
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>What's your vibe? ⚡</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>This helps us match you with people on the same wavelength</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {VIBES.map(v => (
                    <button key={v.id} onClick={() => setData(d => ({ ...d, vibe: v.id }))}
                      style={{
                        padding: '16px', borderRadius: 16, border: `2px solid ${data.vibe === v.id ? 'var(--primary)' : 'var(--border)'}`,
                        background: data.vibe === v.id ? 'rgba(124,58,237,0.1)' : 'var(--bg-tertiary)',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                      }}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>{v.emoji}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{v.label}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{v.desc}</div>
                    </button>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={next} disabled={!data.vibe} style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}>Continue →</button>
              </div>
            )}

            {/* Step 1: Purpose */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>What are you here for? 🎯</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>Select all that apply</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {PURPOSES.map(p => {
                    const active = data.purposes.includes(p.id);
                    return (
                      <button key={p.id} onClick={() => setData(d => ({ ...d, purposes: toggle(d.purposes, p.id) }))}
                        style={{
                          padding: '20px', borderRadius: 16, border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                          background: active ? 'rgba(124,58,237,0.1)' : 'var(--bg-tertiary)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                        }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>{p.emoji}</div>
                        <div style={{ fontWeight: 700 }}>{p.label}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.desc}</div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button className="btn-secondary" onClick={back} style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
                  <button className="btn btn-primary" onClick={next} disabled={data.purposes.length === 0} style={{ flex: 2, justifyContent: 'center' }}>Continue →</button>
                </div>
              </div>
            )}

            {/* Step 2: Interests */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>Your interests 🌟</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>Pick at least 3 — the more the better!</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                  {INTERESTS.map(i => {
                    const active = data.interests.includes(i);
                    return (
                      <button key={i} onClick={() => setData(d => ({ ...d, interests: toggle(d.interests, i) }))}
                        className={active ? 'btn btn-primary' : ''}
                        style={!active ? {
                          padding: '8px 16px', borderRadius: 100, border: '1.5px solid var(--border)',
                          background: 'var(--bg-tertiary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
                          color: 'var(--text-secondary)', transition: 'all 0.2s'
                        } : { borderRadius: 100, padding: '8px 16px', fontSize: '0.875rem' }}>
                        {i}
                      </button>
                    );
                  })}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>{data.interests.length} selected</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn-secondary" onClick={back} style={{ flex: 1 }}>← Back</button>
                  <button className="btn btn-primary" onClick={next} disabled={data.interests.length < 3} style={{ flex: 2, justifyContent: 'center' }}>Continue →</button>
                </div>
              </div>
            )}

            {/* Step 3: Bio & Prompts */}
            {step === 3 && (
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>Tell your story 📝</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>A good bio gets 3x more connections</p>
                <textarea className="input" rows={4} placeholder="Write a short bio... (What makes you, you?)" value={data.bio} onChange={e => setData(d => ({ ...d, bio: e.target.value }))} style={{ resize: 'none', marginBottom: 20 }} />
                
                <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Add a prompt (optional)</h3>
                <select className="input" value={selectedPrompt} onChange={e => setSelectedPrompt(e.target.value)} style={{ marginBottom: 10, cursor: 'pointer' }}>
                  <option value="">Choose a prompt...</option>
                  {PROMPTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {selectedPrompt && <textarea className="input" rows={2} placeholder="Your answer..." value={promptAnswer} onChange={e => setPromptAnswer(e.target.value)} style={{ resize: 'none', marginBottom: 10 }} />}
                {selectedPrompt && promptAnswer && <button className="btn-secondary" onClick={addPrompt} style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}>+ Add Prompt</button>}

                {data.prompts.map((p, i) => (
                  <div key={i} style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 12, marginBottom: 8 }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>{p.question}</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{p.answer}</p>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <button className="btn-secondary" onClick={back} style={{ flex: 1 }}>← Back</button>
                  <button className="btn btn-primary" onClick={next} style={{ flex: 2, justifyContent: 'center' }}>Continue →</button>
                </div>
              </div>
            )}

            {/* Step 4: Safety & Blind Mode */}
            {step === 4 && (
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>Safety settings 🛡️</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>Customize your experience</p>

                <div className="glass card" style={{ marginBottom: 16, cursor: 'pointer' }} onClick={() => setData(d => ({ ...d, blindMode: !d.blindMode }))}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>🎭 Blind Match Mode</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hide your photos initially. Connect through personality first.</div>
                    </div>
                    <div style={{
                      width: 48, height: 28, borderRadius: 14,
                      background: data.blindMode ? 'var(--gradient-main)' : 'var(--bg-tertiary)',
                      position: 'relative', transition: 'all 0.2s', flexShrink: 0, border: '1px solid var(--border)'
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', background: 'white',
                        position: 'absolute', top: 4, left: data.blindMode ? 24 : 4,
                        transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }} />
                    </div>
                  </div>
                </div>

                <div className="glass card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.1))', border: '1px solid rgba(16,185,129,0.2)', marginBottom: 24 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--success)' }}>🛡️ AI Safety Features Enabled</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    ✓ Red flag detection active<br />
                    ✓ Scam protection enabled<br />
                    ✓ Behavior monitoring on<br />
                    ✓ Safety score assigned
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn-secondary" onClick={back} style={{ flex: 1 }}>← Back</button>
                  <button className="btn btn-primary" onClick={finish} style={{ flex: 2, justifyContent: 'center' }}>
                    🎉 Start Discovering!
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
