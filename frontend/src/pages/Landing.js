import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const features = [
  { emoji: '🎯', title: 'Vibe Matching', desc: 'Connect with people sharing your current energy — chill, startup, travel, gaming and more.' },
  { emoji: '🤖', title: 'AI Personality Analysis', desc: 'Deep AI reads your profile and shows compatibility, green flags, and conversation starters.' },
  { emoji: '🕶️', title: 'Blind Match', desc: 'Connect through voice, personality and interests before revealing your appearance.' },
  { emoji: '🛡️', title: 'AI Red Flag Detection', desc: 'Real-time AI shields you from toxic behavior, scams, and manipulation patterns.' },
  { emoji: '💬', title: 'AI Relationship Coach', desc: 'Get personalized date ideas, conversation tips, and communication improvements.' },
  { emoji: '🌍', title: 'Event-Based Matching', desc: 'Join hackathons, college events, music shows and connect with attendees instantly.' },
  { emoji: '🏘️', title: 'Social Communities', desc: 'Discord meets Reddit — communities for coders, gamers, entrepreneurs, travelers.' },
  { emoji: '💑', title: 'Couple Mode', desc: 'After connecting, track anniversaries, shared memories, bucket lists and journals.' },
];

const vibes = ['😎 Chill','✈️ Travel','📚 Study','🚀 Startup','🎮 Gaming','💪 Fitness','🎵 Music','🎬 Movies'];

const Landing = () => {
  const [activeVibe, setActiveVibe] = useState(0);
  return (
    <div style={{minHeight:'100vh',overflowX:'hidden'}}>
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,background:'rgba(10,10,15,0.85)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)',padding:'16px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:800,background:'var(--gradient-main)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>YaarLink</span>
        <div style={{display:'flex',gap:12}}>
          <Link to="/login" className="btn btn-glass btn-sm">Login</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Join Free</Link>
        </div>
      </nav>
      <section style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'120px 24px 60px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
          <div style={{position:'absolute',top:'20%',left:'10%',width:400,height:400,background:'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)',borderRadius:'50%',animation:'float 6s ease-in-out infinite'}}/>
          <div style={{position:'absolute',bottom:'20%',right:'10%',width:350,height:350,background:'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)',borderRadius:'50%',animation:'float 8s ease-in-out infinite reverse'}}/>
        </div>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,marginBottom:24,background:'rgba(124,58,237,0.15)',border:'1px solid rgba(124,58,237,0.3)',borderRadius:'var(--radius-full)',padding:'8px 20px',fontSize:13,fontWeight:600,color:'var(--primary-light)',animation:'slideDown 0.6s ease forwards'}}>
          ✨ Next-Gen Social Connection Platform
        </div>
        <h1 style={{fontFamily:'var(--font-display)',fontWeight:900,fontSize:'clamp(42px, 8vw, 88px)',lineHeight:1.05,marginBottom:24,maxWidth:900,animation:'slideUp 0.7s ease forwards'}}>
          Find Your{' '}<span style={{background:'var(--gradient-main)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>Yaar</span><br/>Beyond Swiping
        </h1>
        <p style={{fontSize:'clamp(16px, 2.5vw, 20px)',color:'var(--text-secondary)',maxWidth:600,lineHeight:1.7,marginBottom:40}}>
          Not just dating. Dating + Friendship + Networking + Community — powered by AI, built for Gen-Z India.
        </p>
        <div style={{display:'flex',gap:16,flexWrap:'wrap',justifyContent:'center',marginBottom:60}}>
          <Link to="/register" className="btn btn-primary btn-lg animate-pulse-glow">🚀 Start for Free</Link>
          <Link to="/login" className="btn btn-glass btn-lg">Sign In →</Link>
        </div>
        <div>
          <p style={{fontSize:13,color:'var(--text-muted)',marginBottom:16,fontWeight:600,textTransform:'uppercase',letterSpacing:1}}>Current Vibes</p>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center',maxWidth:600}}>
            {vibes.map((v,i) => (
              <div key={i} onClick={() => setActiveVibe(i)} style={{padding:'8px 18px',borderRadius:'var(--radius-full)',background: activeVibe===i ? 'var(--gradient-main)' : 'var(--bg-glass)',border: activeVibe===i ? 'none' : '1px solid var(--border)',cursor:'pointer',fontSize:14,fontWeight:600,transition:'var(--transition-spring)',transform: activeVibe===i ? 'scale(1.08)' : 'scale(1)',backdropFilter:'blur(10px)'}}>{v}</div>
            ))}
          </div>
        </div>
      </section>
      <section style={{padding:'60px 24px',textAlign:'center'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))',gap:24,maxWidth:800,margin:'0 auto'}}>
          {[{num:'50K+',label:'Active Users'},{num:'12',label:'Connection Modes'},{num:'98%',label:'Safety Score'},{num:'4.9★',label:'App Rating'}].map((s,i) => (
            <div key={i} className="glass" style={{padding:'28px 20px',textAlign:'center'}}>
              <div style={{fontFamily:'var(--font-display)',fontSize:36,fontWeight:900,background:'var(--gradient-main)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{s.num}</div>
              <div style={{color:'var(--text-secondary)',fontSize:14,marginTop:4}}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>
      <section style={{padding:'60px 24px'}}>
        <div style={{maxWidth:1000,margin:'0 auto'}}>
          <h2 style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:'clamp(28px,5vw,48px)',textAlign:'center',marginBottom:12}}>
            Features That{' '}<span style={{background:'var(--gradient-main)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Actually Matter</span>
          </h2>
          <p style={{textAlign:'center',color:'var(--text-secondary)',fontSize:16,marginBottom:48}}>What Tinder, Bumble and Hinge can't offer</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))',gap:20}}>
            {features.map((f,i) => (
              <div key={i} className="glass card-hover" style={{padding:28,borderRadius:'var(--radius-lg)',background:'var(--gradient-card)'}}>
                <div style={{fontSize:36,marginBottom:16}}>{f.emoji}</div>
                <h3 style={{fontWeight:700,fontSize:18,marginBottom:8}}>{f.title}</h3>
                <p style={{color:'var(--text-secondary)',fontSize:14,lineHeight:1.6}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section style={{padding:'80px 24px',textAlign:'center',background:'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(236,72,153,0.1) 100%)'}}>
        <h2 style={{fontFamily:'var(--font-display)',fontWeight:900,fontSize:'clamp(30px,5vw,56px)',marginBottom:16}}>Ready to Find Your Yaar?</h2>
        <p style={{color:'var(--text-secondary)',fontSize:18,marginBottom:40}}>Join 50,000+ people already making real connections</p>
        <Link to="/register" className="btn btn-primary btn-lg animate-pulse-glow" style={{fontSize:18,padding:'18px 48px'}}>🚀 Create Free Account</Link>
      </section>
      <footer style={{padding:'40px 24px',borderTop:'1px solid var(--border)',textAlign:'center'}}>
        <div style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:800,marginBottom:8,background:'var(--gradient-main)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>YaarLink</div>
        <p style={{color:'var(--text-muted)',fontSize:14}}>© 2024 YaarLink. Built with ❤️ for India. Privacy · Terms · Safety</p>
      </footer>
    </div>
  );
};
export default Landing;
