const express = require('express');
const router = express.Router();
const { Community, CommunityPost } = require('../models/Models');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { category, search, limit = 30 } = req.query;
    let query = {};
    if (category) query.category = category;
    if (search) query.name = new RegExp(search, 'i');
    const communities = await Community.find(query)
      .populate('creator', 'name avatar username')
      .select('-posts')
      .sort({ memberCount: -1 })
      .limit(parseInt(limit));
    res.json({ communities });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get communities' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('creator', 'name avatar username')
      .populate('members.user', 'name avatar username');
    if (!community) return res.status(404).json({ error: 'Not found' });
    res.json({ community });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description, category, isPrivate, tags, rules } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
    const community = new Community({
      name, description, category, isPrivate, tags, rules, slug,
      creator: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
      memberCount: 1
    });
    await community.save();
    await User.findByIdAndUpdate(req.user._id, { $push: { communities: community._id } });
    res.status(201).json({ community });
  } catch (err) {
    res.status(500).json({ error: 'Create failed' });
  }
});

router.post('/:id/join', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Not found' });
    const isMember = community.members.some(m => m.user.toString() === req.user._id.toString());
    if (isMember) return res.status(400).json({ error: 'Already a member' });
    community.members.push({ user: req.user._id });
    community.memberCount += 1;
    await community.save();
    await User.findByIdAndUpdate(req.user._id, { $push: { communities: community._id } });
    res.json({ message: 'Joined!', community });
  } catch (err) {
    res.status(500).json({ error: 'Join failed' });
  }
});

router.post('/:id/leave', auth, async (req, res) => {
  try {
    const community = await Community.findByIdAndUpdate(req.params.id, {
      $pull: { members: { user: req.user._id } },
      $inc: { memberCount: -1 }
    });
    await User.findByIdAndUpdate(req.user._id, { $pull: { communities: req.params.id } });
    res.json({ message: 'Left community' });
  } catch (err) {
    res.status(500).json({ error: 'Leave failed' });
  }
});

router.get('/:id/posts', auth, async (req, res) => {
  try {
    const posts = await CommunityPost.find({ community: req.params.id })
      .populate('author', 'name avatar username verified')
      .sort({ pinned: -1, createdAt: -1 })
      .limit(30);
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/:id/posts', auth, async (req, res) => {
  try {
    const { title, content, type, media, flair } = req.body;
    const post = new CommunityPost({
      community: req.params.id, author: req.user._id,
      title, content, type, media, flair
    });
    await post.save();
    await post.populate('author', 'name avatar username');
    const io = req.app.get('io');
    io.to(`community_${req.params.id}`).emit('new_post', { post });
    res.status(201).json({ post });
  } catch (err) {
    res.status(500).json({ error: 'Post failed' });
  }
});

router.post('/:id/posts/:postId/like', auth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.postId);
    const liked = post.likes.includes(req.user._id);
    if (liked) { post.likes.pull(req.user._id); post.likeCount = Math.max(0, post.likeCount - 1); }
    else { post.likes.push(req.user._id); post.likeCount += 1; }
    await post.save();
    res.json({ liked: !liked, likeCount: post.likeCount });
  } catch (err) {
    res.status(500).json({ error: 'Like failed' });
  }
});

router.post('/:id/posts/:postId/comment', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const post = await CommunityPost.findByIdAndUpdate(req.params.postId,
      { $push: { comments: { author: req.user._id, content } }, $inc: { commentCount: 1 } },
      { new: true }
    ).populate('comments.author', 'name avatar');
    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: 'Comment failed' });
  }
});

module.exports = router;
