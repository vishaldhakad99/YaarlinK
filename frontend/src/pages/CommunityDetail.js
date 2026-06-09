import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { COMMUNITY_CATEGORIES } from '../utils/constants';

const CommunityDetail = () => {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => { fetchData(); }, [communityId]);

  const fetchData = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        api.get(`/communities/${communityId}`),
        api.get(`/communities/${communityId}/posts`)
      ]);
      setCommunity(cRes.data.community);
      setPosts(pRes.data.posts);
    } catch (e) { toast.error('Failed to load'); navigate('/communities'); }
    finally { setLoading(false); }
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      const res = await api.post(`/communities/${communityId}/posts`, { content: newPost, type: 'text' });
      setPosts(p => [res.data.post, ...p]);
      setNewPost('');
      toast.success('Posted! 🎉');
    } catch (e) { toast.error('Post failed'); }
    finally { setPosting(false); }
  };

  const handleLike = async (postId) => {
    try {
      const res = await api.post(`/communities/${communityId}/posts/${postId}/like`);
      setPosts(p => p.map(post => post._id === postId ? { ...post, likeCount: res.data.likeCount } : post));
    } catch (e) {}
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner-lg spinner" /></div>;

  const catColor = COMMUNITY_CATEGORIES.find(c => c.id === community?.category)?.color || 'var(--primary)';
  const catEmoji = COMMUNITY_CATEGORIES.find(c => c.id === community?.category)?.emoji || '👥';

  return (
    <div className="page">
      {/* Header */}
      <div style={{ position: 'relative', height: 160, background: `linear-gradient(135deg, ${catColor}44, ${catColor}22)`, overflow: 'hidden' }}>
        <button onClick={() => navigate('/communities')} style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: 'var(--radius-full)', padding: '8px 16px', cursor: 'pointer', fontSize: 14 }}>← Back</button>
        <div style={{ position: 'absolute', bottom: 20, left: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', background: catColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, border: '3px solid white' }}>{catEmoji}</div>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: 22, color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{community?.name}</h1>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>👥 {community?.memberCount?.toLocaleString()} members</span>
          </div>
        </div>
      </div>

      <div className="page-content" style={{ paddingTop: 20 }}>
        {/* About */}
        {community?.description && (
          <div className="glass" style={{ padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{community.description}</p>
          </div>
        )}

        {/* Post Box */}
        <div className="glass" style={{ padding: 16, borderRadius: 'var(--radius-lg)', marginBottom: 20 }}>
          <textarea className="input" placeholder="Share something with the community..." value={newPost}
            onChange={e => setNewPost(e.target.value)} rows={3} style={{ marginBottom: 12, resize: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" onClick={handlePost} disabled={posting || !newPost.trim()}>
              {posting ? <span className="spinner" /> : '🚀 Post'}
            </button>
          </div>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <p style={{ color: 'var(--text-secondary)' }}>No posts yet. Be the first!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {posts.map(post => (
              <div key={post._id} className="glass card" style={{ borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div className="avatar avatar-sm" style={{ background: 'var(--gradient-main)' }}>
                    {post.author?.avatar ? <img src={post.author.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : post.author?.name?.[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{post.author?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(post.createdAt).toLocaleDateString()}</div>
                  </div>
                  {post.pinned && <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>📌 Pinned</span>}
                </div>
                {post.title && <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{post.title}</h3>}
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 15 }}>{post.content}</p>
                <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => handleLike(post._id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                    ❤️ {post.likeCount || 0}
                  </button>
                  <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                    💬 {post.commentCount || 0}
                  </button>
                  <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                    🔗 Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityDetail;
