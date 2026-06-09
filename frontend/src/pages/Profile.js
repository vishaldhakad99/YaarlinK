import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useStore from '../store/useStore';
import { VIBES, MOODS, INTERESTS } from '../utils/constants';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: me, updateUser, logout, toggleTheme, theme } = useStore();
  const isOwn = !userId || userId === me?._id;
  const [profile, setProfile] = useState(isOwn ? me : null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!isOwn) {
      api.get(`/users/${userId}`).then(r => setProfile(r.data.user)).catch(() => toast.error('User not found'));
    } else {
      setProfile(me);
      setEditForm({ bio: me?.bio||'', interests: me?.interests||[], prompts: me?.prompts||[] });
    }
  }, [userId, me]);

  const saveProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.patch('/users/profile', editForm);
      updateUser(data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); }
    finally { setLoading(false); }
  };

  const toggleInterest = (interest) => {
    const cur = editForm.interests || [];
    setEditForm(p => ({ ...p, interests: cur.includes(interest) ? cur.filter(i=>i!==interest) : [...cur, interest] }));
  };

  if (!profile) return (
    <div className="page" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'80vh'}}>
      <div className="spinner spinner-lg"/>
    </div>
  );

  const safetyColor = profile.safetyScore?.overall >= 80 ? '#10B981' : profile.safetyScore?.overall >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:20}}>
          {isOwn ? 'My Profile' : profile.name}
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-glass btn-sm" onClick={toggleTheme}>{theme==='dark'?'☀️':'🌙'}</button>
          {isOwn && <button className="btn btn-glass btn-sm" onClick={()=>setEditing(!editing)}>{editing?'Cancel':'Edit'}</button>}
          {isOwn && <button className="btn btn-danger btn-sm" onClick={()=>{logout();navigate('/login');}}>Logout</button>}
        </div>
      </div>

      <div className="page-content">
        {/* Profile Hero */}
        <div className="glass" style={{padding:24,borderRadius:'var(--radius-xl)',marginBottom:20,background:'var(--gradient-card)'}}>
          <div style={{display:'flex',gap:20,alignItems:'flex-start'}}>
            <div className="avatar avatar-xl" style={{flexShrink:0,fontSize:36}}>
              {profile.avatar ? <img src={profile.avatar} alt={profile.name} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/> : profile.name?.[0]?.toUpperCase()}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:4}}>
                <h2 style={{fontWeight:800,fontSize:22}}>{profile.name}</h2>
                {profile.verificationBadge && <span style={{color:'#60A5FA',fontSize:18}}>✓</span>}
              </div>
              <p style={{color:'var(--text-muted)',fontSize:14,marginBottom:8}}>@{profile.username} · {profile.age && `${profile.age} yrs`}</p>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
                <span className="vibe-pill">{VIBES.find(v=>v.id===profile.currentVibe)?.emoji} {profile.currentVibe}</span>
                <span className="badge">{MOODS.find(m=>m.id===profile.currentMood)?.emoji} {profile.currentMood}</span>
              </div>
              {/* Safety Score */}
              <div style={{display:'flex',gap:16}}>
                {[
                  {label:'Trust',val:profile.safetyScore?.trust},
                  {label:'Safety',val:profile.safetyScore?.overall},
                  {label:'Verify',val:profile.safetyScore?.verification},
                ].map(s => (
                  <div key={s.label} style={{textAlign:'center'}}>
                    <div style={{fontSize:16,fontWeight:800,color:safetyColor}}>{s.val}%</div>
                    <div style={{fontSize:10,color:'var(--text-muted)',fontWeight:600}}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {profile.bio && !editing && <p style={{marginTop:16,color:'var(--text-secondary)',lineHeight:1.6,fontSize:15}}>{profile.bio}</p>}
          {editing && (
            <textarea className="input" style={{marginTop:16,minHeight:80,resize:'vertical'}} placeholder="Your bio..." value={editForm.bio} onChange={e=>setEditForm(p=>({...p,bio:e.target.value}))} maxLength={500}/>
          )}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--bg-glass)',borderRadius:'var(--radius-full)',padding:4}}>
          {['profile','vibe','badges'].map(tab => (
            <button key={tab} onClick={()=>setActiveTab(tab)} style={{flex:1,padding:'10px',borderRadius:'var(--radius-full)',border:'none',cursor:'pointer',fontWeight:600,fontSize:13,background:activeTab===tab?'var(--gradient-main)':'transparent',color:activeTab===tab?'white':'var(--text-secondary)',transition:'all 0.25s',textTransform:'capitalize'}}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab==='profile' && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {/* Interests */}
            <div className="glass" style={{padding:20,borderRadius:'var(--radius-lg)'}}>
              <h3 style={{fontWeight:700,marginBottom:16,fontSize:16}}>Interests</h3>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {editing ? INTERESTS.map(i => (
                  <button key={i} onClick={()=>toggleInterest(i)} style={{padding:'6px 14px',borderRadius:'var(--radius-full)',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,background:(editForm.interests||[]).includes(i)?'var(--gradient-main)':'var(--bg-glass)',color:(editForm.interests||[]).includes(i)?'white':'var(--text-secondary)',transition:'all 0.2s'}}>
                    {i}
                  </button>
                )) : (profile.interests||[]).map(i => (
                  <span key={i} className="badge badge-primary">{i}</span>
                ))}
              </div>
            </div>

            {/* Prompts */}
            {(profile.prompts||[]).length > 0 && (
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {profile.prompts.map((p,i) => (
                  <div key={i} className="glass" style={{padding:20,borderRadius:'var(--radius-lg)',background:'var(--gradient-card)'}}>
                    <p style={{color:'var(--text-muted)',fontSize:13,marginBottom:8}}>{p.question}</p>
                    <p style={{fontWeight:600,fontSize:15}}>{p.answer}</p>
                  </div>
                ))}
              </div>
            )}

            {/* AI Profile */}
            {profile.aiProfile?.personalityTraits?.length > 0 && (
              <div className="glass" style={{padding:20,borderRadius:'var(--radius-lg)'}}>
                <h3 style={{fontWeight:700,marginBottom:12,fontSize:16}}>🤖 AI Personality Insights</h3>
                <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>
                  {profile.aiProfile.personalityTraits.map((t,i) => <span key={i} className="badge badge-primary">{t}</span>)}
                </div>
                {profile.aiProfile.greenFlags?.length > 0 && (
                  <div>{profile.aiProfile.greenFlags.map((f,i) => <div key={i} style={{color:'#34D399',fontSize:13,marginBottom:4}}>✅ {f}</div>)}</div>
                )}
              </div>
            )}

            {editing && (
              <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={saveProfile} disabled={loading}>
                {loading ? <span className="spinner"/> : '💾 Save Changes'}
              </button>
            )}
          </div>
        )}

        {activeTab==='vibe' && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div className="glass" style={{padding:20,borderRadius:'var(--radius-lg)'}}>
              <h3 style={{fontWeight:700,marginBottom:16}}>Set Your Vibe</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
                {VIBES.map(v => (
                  <button key={v.id} style={{padding:'14px 8px',borderRadius:'var(--radius-md)',border: profile.currentVibe===v.id ? `2px solid ${v.color}` : '1px solid var(--border)',background: profile.currentVibe===v.id ? `${v.color}22` : 'var(--bg-glass)',cursor:'pointer',textAlign:'center',transition:'all 0.2s'}} onClick={async()=>{ await api.patch('/auth/vibe',{vibe:v.id}); updateUser({currentVibe:v.id}); toast.success(`Vibe: ${v.label}!`);}}>
                    <div style={{fontSize:24}}>{v.emoji}</div>
                    <div style={{fontSize:11,fontWeight:600,marginTop:4,color:'var(--text-secondary)'}}>{v.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="glass" style={{padding:20,borderRadius:'var(--radius-lg)'}}>
              <h3 style={{fontWeight:700,marginBottom:16}}>Set Your Mood</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
                {MOODS.map(m => (
                  <button key={m.id} style={{padding:'14px 8px',borderRadius:'var(--radius-md)',border: profile.currentMood===m.id ? '2px solid var(--primary)' : '1px solid var(--border)',background: profile.currentMood===m.id ? 'rgba(124,58,237,0.15)' : 'var(--bg-glass)',cursor:'pointer',textAlign:'center',transition:'all 0.2s'}} onClick={async()=>{ await api.patch('/auth/mood',{mood:m.id}); updateUser({currentMood:m.id}); toast.success(`Mood: ${m.label}!`);}}>
                    <div style={{fontSize:24}}>{m.emoji}</div>
                    <div style={{fontSize:11,fontWeight:600,marginTop:4,color:'var(--text-secondary)'}}>{m.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab==='badges' && (
          <div className="glass" style={{padding:20,borderRadius:'var(--radius-lg)'}}>
            <h3 style={{fontWeight:700,marginBottom:16}}>🏆 Achievements</h3>
            <div style={{display:'flex',alignItems:'center',gap:16,padding:16,background:'var(--bg-glass)',borderRadius:'var(--radius-md)',marginBottom:16}}>
              <div style={{fontSize:32}}>🔥</div>
              <div>
                <div style={{fontWeight:700}}>{me?.dailyStreak || 0} Day Streak</div>
                <div style={{color:'var(--text-muted)',fontSize:13}}>Keep logging in daily!</div>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:16,padding:16,background:'var(--bg-glass)',borderRadius:'var(--radius-md)',marginBottom:16}}>
              <div style={{fontSize:32}}>⭐</div>
              <div>
                <div style={{fontWeight:700}}>{me?.points || 0} Points</div>
                <div style={{color:'var(--text-muted)',fontSize:13}}>Level {me?.level || 1}</div>
              </div>
            </div>
            {(me?.achievements||[]).length === 0 ? (
              <p style={{color:'var(--text-muted)',textAlign:'center',padding:20}}>No achievements yet. Keep swiping! 🎯</p>
            ) : (me?.achievements||[]).map((a,i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:12,background:'var(--bg-glass)',borderRadius:'var(--radius-md)',marginBottom:8}}>
                <span style={{fontSize:24}}>🏅</span>
                <div>
                  <div style={{fontWeight:600}}>{a.title}</div>
                  <div style={{color:'var(--text-muted)',fontSize:12}}>{new Date(a.earnedAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
            {/* Referral */}
            <div style={{marginTop:20,padding:16,background:'var(--gradient-card)',border:'1px solid rgba(124,58,237,0.2)',borderRadius:'var(--radius-md)'}}>
              <h4 style={{fontWeight:700,marginBottom:8}}>🎁 Referral Code</h4>
              <div style={{display:'flex',gap:8}}>
                <div style={{flex:1,padding:'10px 16px',background:'var(--bg-glass)',borderRadius:'var(--radius-sm)',fontWeight:700,letterSpacing:2,fontSize:16}}>{me?.referralCode}</div>
                <button className="btn btn-primary btn-sm" onClick={()=>{navigator.clipboard.writeText(me?.referralCode);toast.success('Copied!');}}>Copy</button>
              </div>
              <p style={{color:'var(--text-muted)',fontSize:12,marginTop:8}}>Earn 50 points for each friend you refer!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Profile;
