const express = require('express');
const router = express.Router();
const { Match, Message, Community, CommunityPost, Event, Report } = require('../models/Models');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// ===== MATCHES ROUTES =====
const matchRouter = express.Router();

matchRouter.get('/', auth, async (req, res) => {
  try {
    const matches = await Match.find({
      users: req.user._id,
      status: 'matched'
    })
    .populate('users', 'name username avatar isOnline lastActive currentVibe')
    .populate('lastMessage')
    .sort({ lastActivity: -1 });

    const formatted = matches.map(m => {
      const other = m.users.find(u => u._id.toString() !== req.user._id.toString());
      return { ...m.toObject(), otherUser: other };
    });

    res.json({ matches: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get matches' });
  }
});

matchRouter.get('/:matchId', auth, async (req, res) => {
  try {
    const match = await Match.findOne({
      _id: req.params.matchId,
      users: req.user._id
    }).populate('users', 'name username avatar isOnline currentVibe bio');

    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json({ match });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get match' });
  }
});

matchRouter.post('/:matchId/reveal', auth, async (req, res) => {
  try {
    const match = await Match.findOneAndUpdate(
      { _id: req.params.matchId, users: req.user._id },
      { blindMatchRevealed: true, blindMatchRevealedAt: new Date() },
      { new: true }
    );
    res.json({ match, message: 'Photos revealed!' });
  } catch (err) {
    res.status(500).json({ error: 'Reveal failed' });
  }
});

// ===== MESSAGES ROUTES =====
const messageRouter = express.Router();

messageRouter.get('/:matchId', auth, async (req, res) => {
  try {
    const match = await Match.findOne({ _id: req.params.matchId, users: req.user._id });
    if (!match) return res.status(403).json({ error: 'Access denied' });

    const { page = 1, limit = 50 } = req.query;
    const messages = await Message.find({ match: req.params.matchId, deleted: false })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    await Message.updateMany(
      { match: req.params.matchId, receiver: req.user._id, seen: false },
      { seen: true, seenAt: new Date() }
    );

    res.json({ messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

messageRouter.post('/:matchId', auth, async (req, res) => {
  try {
    const match = await Match.findOne({ _id: req.params.matchId, users: req.user._id });
    if (!match) return res.status(403).json({ error: 'Access denied' });

    const receiverId = match.users.find(u => u.toString() !== req.user._id.toString());
    const { content, type = 'text', mediaUrl } = req.body;

    // Simple red flag check
    const redFlagPatterns = [
      /send me money/i, /wire transfer/i, /crypto/i,
      /click this link/i, /you\'ve won/i, /bank account/i
    ];
    const hasRedFlag = redFlagPatterns.some(p => p.test(content));

    const message = new Message({
      match: match._id,
      sender: req.user._id,
      receiver: receiverId,
      content,
      type,
      mediaUrl,
      aiRedFlag: hasRedFlag,
      aiRedFlagReason: hasRedFlag ? 'Potential scam pattern detected' : null
    });

    await message.save();
    await message.populate('sender', 'name avatar');

    match.lastMessage = message._id;
    match.lastActivity = new Date();
    await match.save();

    const io = req.app.get('io');
    io.to(`match_${match._id}`).emit('new_message', { message });

    if (hasRedFlag) {
      io.to(`user_${req.user._id}`).emit('red_flag_warning', {
        message: 'Your message may contain suspicious content. Please review.'
      });
    }

    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

messageRouter.post('/:matchId/:messageId/react', auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findOneAndUpdate(
      { _id: req.params.messageId, match: req.params.matchId },
      { $push: { reactions: { user: req.user._id, emoji } } },
      { new: true }
    );
    res.json({ message });
  } catch (err) {
    res.status(500).json({ error: 'Reaction failed' });
  }
});

// ===== COMMUNITIES ROUTES =====
const communityRouter = express.Router();

communityRouter.get('/', auth, async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};
    if (category) query.category = category;
    if (search) query.$text = { $search: search };

    const communities = await Community.find(query)
      .populate('creator', 'name avatar')
      .select('-posts')
      .sort({ memberCount: -1 })
      .limit(50);

    res.json({ communities });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get communities' });
  }
});

communityRouter.post('/', auth, async (req, res) => {
  try {
    const { name, description, category, isPrivate, tags, rules } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const community = new Community({
      name, description, category, isPrivate, tags, rules,
      slug: slug + '-' + Date.now(),
      creator: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
      memberCount: 1
    });
    await community.save();

    req.user.communities.push(community._id);
    await req.user.save();

    res.status(201).json({ community });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create community' });
  }
});

communityRouter.post('/:communityId/join', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.communityId);
    if (!community) return res.status(404).json({ error: 'Community not found' });

    const isMember = community.members.some(m => m.user.toString() === req.user._id.toString());
    if (isMember) return res.status(400).json({ error: 'Already a member' });

    community.members.push({ user: req.user._id });
    community.memberCount += 1;
    await community.save();

    req.user.communities.push(community._id);
    await req.user.save();

    res.json({ message: 'Joined community', community });
  } catch (err) {
    res.status(500).json({ error: 'Failed to join' });
  }
});

communityRouter.get('/:communityId/posts', auth, async (req, res) => {
  try {
    const posts = await CommunityPost.find({ community: req.params.communityId })
      .populate('author', 'name avatar username')
      .sort({ pinned: -1, createdAt: -1 })
      .limit(30);
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

communityRouter.post('/:communityId/posts', auth, async (req, res) => {
  try {
    const { title, content, type, media, flair } = req.body;
    const post = new CommunityPost({
      community: req.params.communityId,
      author: req.user._id,
      title, content, type, media, flair
    });
    await post.save();
    await post.populate('author', 'name avatar username');

    const io = req.app.get('io');
    io.to(`community_${req.params.communityId}`).emit('new_post', { post });

    res.status(201).json({ post });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

communityRouter.post('/:communityId/posts/:postId/like', auth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.postId);
    const liked = post.likes.includes(req.user._id);
    
    if (liked) {
      post.likes.pull(req.user._id);
      post.likeCount = Math.max(0, post.likeCount - 1);
    } else {
      post.likes.push(req.user._id);
      post.likeCount += 1;
    }
    await post.save();
    res.json({ liked: !liked, likeCount: post.likeCount });
  } catch (err) {
    res.status(500).json({ error: 'Like failed' });
  }
});

// ===== EVENTS ROUTES =====
const eventRouter = express.Router();

eventRouter.get('/', auth, async (req, res) => {
  try {
    const { type, city } = req.query;
    let query = { dateTime: { $gte: new Date() } };
    if (type) query.type = type;
    if (city) query['location.city'] = new RegExp(city, 'i');

    const events = await Event.find(query)
      .populate('creator', 'name avatar')
      .sort({ dateTime: 1 })
      .limit(30);

    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get events' });
  }
});

eventRouter.post('/', auth, async (req, res) => {
  try {
    const event = new Event({ ...req.body, creator: req.user._id });
    await event.save();
    res.status(201).json({ event });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

eventRouter.post('/:eventId/join', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const isAttending = event.attendees.some(a => a.user.toString() === req.user._id.toString());
    if (isAttending) return res.status(400).json({ error: 'Already joined' });

    if (event.maxAttendees && event.attendeeCount >= event.maxAttendees) {
      return res.status(400).json({ error: 'Event is full' });
    }

    event.attendees.push({ user: req.user._id });
    event.attendeeCount += 1;
    await event.save();

    req.user.events.push(event._id);
    await req.user.save();

    res.json({ message: 'Joined event!', event });
  } catch (err) {
    res.status(500).json({ error: 'Failed to join event' });
  }
});

// ===== SAFETY ROUTES =====
const safetyRouter = express.Router();

safetyRouter.post('/report', auth, async (req, res) => {
  try {
    const { reportedUserId, reason, description, messageId } = req.body;
    const report = new Report({
      reporter: req.user._id,
      reported: reportedUserId,
      reportedMessage: messageId,
      reason, description
    });
    await report.save();

    await User.findByIdAndUpdate(reportedUserId, {
      $push: { reportedBy: req.user._id },
      $inc: { 'safetyScore.behavior': -5 }
    });

    res.json({ message: 'Report submitted. Our team will review it.' });
  } catch (err) {
    res.status(500).json({ error: 'Report failed' });
  }
});

safetyRouter.post('/block', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!req.user.blockedUsers.includes(userId)) {
      req.user.blockedUsers.push(userId);
      await req.user.save();
    }

    await Match.updateMany(
      { users: { $all: [req.user._id, userId] } },
      { status: 'blocked' }
    );

    res.json({ message: 'User blocked' });
  } catch (err) {
    res.status(500).json({ error: 'Block failed' });
  }
});

// Users routes
const usersRouter = express.Router();

usersRouter.get('/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -refreshTokens -blockedUsers -reportedBy -emailVerificationToken -passwordResetToken');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

usersRouter.patch('/profile', auth, async (req, res) => {
  try {
    const allowed = ['name', 'bio', 'age', 'gender', 'interests', 'prompts', 'personalityType',
      'lookingFor', 'location', 'settings', 'blindMode', 'currentVibe', 'currentMood'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
      .select('-password -refreshTokens');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// Viral routes
const viralRouter = express.Router();

viralRouter.get('/profile-card/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('name username avatar bio interests currentVibe safetyScore achievements');
    res.json({ profileCard: user, shareUrl: `${process.env.CLIENT_URL}/profile/${user.username}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get profile card' });
  }
});

viralRouter.get('/leaderboard', auth, async (req, res) => {
  try {
    const users = await User.find({ banned: false })
      .select('name username avatar points level dailyStreak achievements')
      .sort({ points: -1 })
      .limit(20);
    res.json({ leaderboard: users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

module.exports = {
  matchRouter,
  messageRouter,
  communityRouter,
  eventRouter,
  safetyRouter,
  usersRouter,
  viralRouter
};
