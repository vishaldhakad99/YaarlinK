import React from 'react';
import { NavLink } from 'react-router-dom';
import useStore from '../../store/useStore';

const BottomNav = () => {
  const { unreadCount } = useStore();
  const items = [
    { to: '/discover', emoji: '🧭', label: 'Discover' },
    { to: '/matches', emoji: '💜', label: 'Matches', badge: unreadCount },
    { to: '/communities', emoji: '👥', label: 'Community' },
    { to: '/events', emoji: '🎯', label: 'Events' },
    { to: '/profile', emoji: '✨', label: 'Profile' },
  ];
  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <NavLink key={item.to} to={item.to} className={({isActive}) => `nav-item${isActive ? ' active' : ''}`}>
          <div style={{position:'relative', fontSize:22}}>
            {item.emoji}
            {item.badge > 0 && (
              <span style={{
                position:'absolute', top:-6, right:-8, background:'var(--danger)',
                color:'white', borderRadius:'50%', width:16, height:16,
                fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700
              }}>{item.badge > 9 ? '9+' : item.badge}</span>
            )}
          </div>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
