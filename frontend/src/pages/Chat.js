import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import api from '../utils/api';
import { getSocket } from '../hooks/useSocket';

export default function Chat() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useStore();
  const socket = getSocket();
  const [match, setMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [datePlan, setDatePlan] = useState(null);
  const [showDatePlan, setShowDatePlan] = useState(false);
  const [redFlagWarning, setRedFlagWarning] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);

  const otherUser = match?.users?.find(u => u._id !== user?._id);
  const isOnline = otherUser && onlineUsers.has(otherUser._id);

  useEffect(() => {
    loadChat();
    return () => cleanup();
  }, [matchId]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_match', matchId);

    socket.on('new_message', ({ message }) => {
      setMessages(prev => [...prev, message]);
      scrollBottom();
    });

    socket.on('typing_start', ({ userId }) => {
      if (userId !== user?._id) setOtherTyping(true);
    });
    socket.on('typing_stop', ({ userId }) => {
      if (userId !== user?._id) setOtherTyping(false);
    });

    socket.on('webrtc_offer', ({ offer, fromUserId, fromUserName }) => {
      setIncomingCall({ offer, fromUserId, fromUserName });
    });

    socket.on('webrtc_answer', async ({ answer }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(answer);
      }
    });

    socket.on('webrtc_ice_candidate', async ({ candidate }) => {
      if (peerRef.current) {
        await peerRef.current.addIceCandidate(candidate);
      }
    });

    socket.on('call_ended', () => {
      endCall();
      toast('📞 Call ended');
    });

    return () => {
      socket.emit('leave_match', matchId);
      socket.off('new_message');
      socket.off('typing_start');
      socket.off('typing_stop');
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice_candidate');
      socket.off('call_ended');
    };
  }, [socket, matchId]);

  const loadChat = async () => {
    try {
      const [matchRes, msgRes] = await Promise.all([
        api.get(`/matches/${matchId}`),
        api.get(`/messages/${matchId}`)
      ]);
      setMatch(matchRes.data.match);
      setMessages(msgRes.data.messages);
    } catch (e) {
      toast.error('Failed to load chat');
    }
    setLoading(false);
    scrollBottom();
  };

  const cleanup = () => {
    endCall();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  };

  const scrollBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const checkRedFlag = async (text) => {
    if (text.length < 10) return true;
    try {
      const res = await api.post('/ai/check-message', { message: text });
      if (!res.data.safe) {
        setRedFlagWarning(res.data.warning);
        return false;
      }
    } catch (e) {}
    return true;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const safe = await checkRedFlag(input);
    if (!safe) return;

    const tempMsg = { _id: Date.now(), content: input, sender: { _id: user._id, name: user.name, avatar: user.avatar }, createdAt: new Date(), type: 'text', seen: false };
    setMessages(prev => [...prev, tempMsg]);
    setInput('');
    setRedFlagWarning(null);
    scrollBottom();

    try {
      await api.post(`/messages/${matchId}`, { content: input, type: 'text' });
    } catch (e) {
      toast.error('Message failed');
    }
  };

  const handleTyping = (val) => {
    setInput(val);
    if (!typing) {
      setTyping(true);
      socket?.emit('typing_start', { matchId, receiverId: otherUser?._id });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setTyping(false);
      socket?.emit('typing_stop', { matchId, receiverId: otherUser?._id });
    }, 1500);
  };

  const getAiSuggestion = async () => {
    try {
      const recentMessages = messages.slice(-5).map(m => `${m.sender?.name}: ${m.content}`).join('\n');
      const res = await api.post('/ai/coach', {
        context: `Chat with ${otherUser?.name}. Recent: ${recentMessages}`,
        question: 'Suggest one natural, engaging message I could send to keep the conversation flowing'
      });
      setAiSuggestion(res.data.advice);
      setShowAI(true);
    } catch (e) {}
  };

  const getDatePlan = async () => {
    try {
      const res = await api.post('/ai/date-planner', { matchId, preferences: otherUser?.interests?.join(', ') });
      setDatePlan(res.data.plan);
      setShowDatePlan(true);
    } catch (e) {}
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peerRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      pc.onicecandidate = (e) => {
        if (e.candidate) socket?.emit('webrtc_ice_candidate', { targetUserId: otherUser._id, candidate: e.candidate });
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket?.emit('webrtc_offer', { targetUserId: otherUser._id, offer, matchId });
      setCallActive(true);
      toast('📞 Calling...');
    } catch (e) {
      toast.error('Microphone permission needed');
    }
  };

  const endCall = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current = null;
    setCallActive(false);
    socket?.emit('call_end', { targetUserId: otherUser?._id });
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peerRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      pc.onicecandidate = (e) => {
        if (e.candidate) socket?.emit('webrtc_ice_candidate', { targetUserId: incomingCall.fromUserId, candidate: e.candidate });
      };
      await pc.setRemoteDescription(incomingCall.offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket?.emit('webrtc_answer', { targetUserId: incomingCall.fromUserId, answer, matchId });
      setCallActive(true);
      setIncomingCall(null);
    } catch (e) {
      toast.error('Call failed');
    }
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading chat...</p>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="glass" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
        <button className="btn-ghost" onClick={() => navigate('/matches')}>←</button>
        <div style={{ position: 'relative' }}>
          {otherUser?.avatar ? (
            <img src={otherUser.avatar} alt={otherUser.name} className="avatar" style={{ width: 44, height: 44 }} />
          ) : (
            <div className="avatar" style={{ width: 44, height: 44, fontSize: '1.1rem' }}>{otherUser?.name?.[0]}</div>
          )}
          {isOnline && <div className="online-dot" />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>{otherUser?.name}</div>
          <div style={{ fontSize: '0.75rem', color: isOnline ? 'var(--success)' : 'var(--text-muted)' }}>
            {isOnline ? '🟢 Online' : 'Offline'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn-ghost" onClick={getAiSuggestion} title="AI Coach">🤖</button>
          <button className="btn-ghost" onClick={getDatePlan} title="Date Planner">📅</button>
          <button className="btn-ghost" onClick={callActive ? endCall : startCall} title="Voice call"
            style={{ color: callActive ? 'var(--danger)' : 'var(--success)' }}>
            {callActive ? '📵' : '📞'}
          </button>
        </div>
      </div>

      {/* Compatibility bar */}
      {match?.compatibilityScore && (
        <div style={{ padding: '8px 16px', background: 'rgba(124,58,237,0.08)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 4, background: 'var(--bg-tertiary)', borderRadius: 4 }}>
            <div style={{ height: '100%', width: `${match.compatibilityScore}%`, background: 'var(--gradient-main)', borderRadius: 4 }} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-light)' }}>{match.compatibilityScore}% compatible</span>
        </div>
      )}

      {/* Incoming call */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            style={{ background: 'var(--success)', color: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>📞 {incomingCall.fromUserName} is calling...</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button onClick={acceptCall} style={{ background: 'white', color: 'var(--success)', border: 'none', padding: '6px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Accept</button>
              <button onClick={() => setIncomingCall(null)} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '6px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Decline</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Red flag warning */}
      <AnimatePresence>
        {redFlagWarning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: 12, margin: '8px 16px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--danger)', flex: 1 }}>{redFlagWarning}</span>
            <button onClick={() => setRedFlagWarning(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {messages.map((msg) => {
          const isMine = msg.sender?._id === user?._id || msg.sender === user?._id;
          return (
            <motion.div key={msg._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6 }}>
              {!isMine && (
                <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.7rem', flexShrink: 0 }}>
                  {msg.sender?.name?.[0]}
                </div>
              )}
              <div>
                {msg.aiRedFlag && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--warning)', marginBottom: 2, textAlign: isMine ? 'right' : 'left' }}>⚠️ Flagged</div>
                )}
                <div className={`message-bubble ${isMine ? 'sent' : 'received'}`}>{msg.content}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: isMine ? 'right' : 'left', marginTop: 2 }}>
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  {isMine && <span style={{ marginLeft: 4 }}>{msg.seen ? '✓✓' : '✓'}</span>}
                </div>
              </div>
            </motion.div>
          );
        })}
        {otherTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>{otherUser?.name?.[0]}</div>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 18, padding: '10px 16px', display: 'flex', gap: 4 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: `bounce 0.6s ${i * 0.2}s infinite alternate` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* AI suggestion */}
      <AnimatePresence>
        {showAI && aiSuggestion && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{ margin: '0 16px 8px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, padding: '10px 14px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 600, marginBottom: 6 }}>🤖 AI suggests:</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{aiSuggestion}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setInput(aiSuggestion); setShowAI(false); }}
                style={{ background: 'var(--gradient-main)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                Use this
              </button>
              <button onClick={() => setShowAI(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date plan modal */}
      <AnimatePresence>
        {showDatePlan && datePlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
            onClick={(e) => e.target === e.currentTarget && setShowDatePlan(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              style={{ background: 'var(--bg-secondary)', borderRadius: '24px 24px 0 0', padding: '24px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>📅 {datePlan.title}</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{datePlan.vibe} · {datePlan.duration} · {datePlan.budget}</p>
                </div>
                <button className="btn-ghost" onClick={() => setShowDatePlan(false)}>✕</button>
              </div>
              {datePlan.steps?.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 60, flexShrink: 0, fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 600, paddingTop: 2 }}>{step.time}</div>
                  <div style={{ flex: 1, background: 'var(--bg-tertiary)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{step.activity}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{step.description}</div>
                    {step.tip && <div style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>💡 {step.tip}</div>}
                  </div>
                </div>
              ))}
              {datePlan.conversationTopics?.length > 0 && (
                <div>
                  <p style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.9rem' }}>💬 Conversation starters</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {datePlan.conversationTopics.map((t, i) => (
                      <span key={i} className="badge badge-primary">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
                onClick={() => { sendMessage && setInput(`📅 I have a date idea! ${datePlan.title}: ${datePlan.steps?.[0]?.activity} at ${datePlan.steps?.[0]?.time}`); setShowDatePlan(false); }}>
                Share Plan with {otherUser?.name}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-end', background: 'var(--bg-secondary)' }}>
        <input className="input" placeholder={`Message ${otherUser?.name}...`}
          value={input} onChange={e => handleTyping(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
          style={{ flex: 1, padding: '10px 16px' }} />
        <motion.button whileTap={{ scale: 0.9 }} onClick={sendMessage} disabled={!input.trim()}
          style={{
            width: 44, height: 44, borderRadius: '50%', border: 'none',
            background: input.trim() ? 'var(--gradient-main)' : 'var(--bg-tertiary)',
            color: 'white', fontSize: '1.1rem', cursor: input.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            transition: 'all 0.2s'
          }}>
          ➤
        </motion.button>
      </div>

      <style>{`
        @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-6px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
