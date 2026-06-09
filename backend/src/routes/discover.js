const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { Match, Swipe } = require('../models/Models');
const { auth } = require('../middleware/auth');

// Get discover feed
router.get('/', auth, async (req, res) => {
  try {
    const { mode = 'ai', vibe, mood, limit = 20 } = req.query;
    const currentUser = req.user;

    // Build query to exclude already-swiped, blocked, self
    const swipedUserIds = await Swipe.find({ swiper: currentUser._id }).distinct('swiped');
    const excludeIds = [...swipedUserIds, ...currentUser.blockedUsers, currentUser._id];

    let query = {
      _id: { $nin: excludeIds },
      banned: false,
      'settings.discovery.genderPreference': { $exists: true }
    };

    // Vibe matching
    if (mode === 'vibe' && vibe) {
      query.currentVibe = vibe;
    } else if (mode === 'vibe') {
      query.currentVibe = currentUser.currentVibe;
    }

    // Mood matching
    if (mode === 'mood' && mood) {
      query.currentMood = mood;
    } else if (mode === 'mood') {
      query.currentMood = currentUser.currentMood;
    }

    // Blind mode - no filter needed, photos handled on frontend
    const users = await User.find(query)
      .select('name username avatar photos bio age gender currentVibe currentMood interests prompts safetyScore verified aiProfile blindMode lookingFor location')
      .limit(parseInt(limit))
      .sort({ 'safetyScore.overall': -1, lastActive: -1 });

    // Calculate compatibility scores
    const usersWithScores = users.map(user => {
      const sharedInterests = user.interests?.filter(i => currentUser.interests?.includes(i)) || [];
      const vibeMatch = user.currentVibe === currentUser.currentVibe;
      const moodMatch = user.currentMood === currentUser.currentMood;

      const compatibilityScore = Math.min(100, Math.round(
        (sharedInterests.length * 10) +
        (vibeMatch ? 20 : 0) +
        (moodMatch ? 15 : 0) +
        (user.safetyScore?.overall || 70) * 0.3
      ));

      return {
        ...user.toObject(),
        compatibilityScore,
        sharedInterests,
        vibeMatch,
        moodMatch,
        // Apply blind mode
        photos: (user.blindMode || currentUser.blindMode) ? [] : user.photos,
        avatar: (user.blindMode || currentUser.blindMode) ? '' : user.avatar
      };
    });

    res.json({ users: usersWithScores, mode });
  } catch (err) {
    console.error('Discover error:', err);
    res.status(500).json({ error: 'Failed to fetch discover feed' });
  }
});

// Swipe/Like
router.post('/swipe', auth, async (req, res) => {
  try {
    const { targetUserId, direction } = req.body;

    if (!['like', 'pass', 'superlike'].includes(direction)) {
      return res.status(400).json({ error: 'Invalid direction' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Check if already swiped
    const existingSwipe = await Swipe.findOne({ swiper: req.user._id, swiped: targetUserId });
    if (existingSwipe) return res.status(400).json({ error: 'Already swiped on this user' });

    const swipe = new Swipe({
      swiper: req.user._id,
      swiped: targetUserId,
      direction
    });
    await swipe.save();

    let matched = false;
    let match = null;

    if (direction === 'like' || direction === 'superlike') {
      // Check if target liked back
      const reverseSwipe = await Swipe.findOne({
        swiper: targetUserId,
        swiped: req.user._id,
        direction: { $in: ['like', 'superlike'] }
      });

      if (reverseSwipe) {
        // Create match
        const sharedInterests = req.user.interests?.filter(i => targetUser.interests?.includes(i)) || [];
        const compatibilityScore = Math.min(100, sharedInterests.length * 15 + 40);

        match = new Match({
          users: [req.user._id, targetUserId],
          status: 'matched',
          initiator: req.user._id,
          matchType: req.user.currentVibe === targetUser.currentVibe ? 'vibe' : 'ai',
          compatibilityScore,
          sharedInterests,
          aiInsight: {
            greenFlags: ['Similar interests', 'Compatible vibes'],
            challenges: ['Distance may be a factor'],
            conversationStarters: [
              `You both love ${sharedInterests[0] || 'discovering new things'}!`,
              'What\'s your current vibe story?'
            ]
          }
        });
        await match.save();

        swipe.matchId = match._id;
        reverseSwipe.matchId = match._id;
        await swipe.save();
        await reverseSwipe.save();

        matched = true;

        // Update points
        req.user.points += 20;
        await req.user.save();

        // Emit socket event
        const io = req.app.get('io');
        io.to(`user_${targetUserId}`).emit('new_match', {
          match: match.toObject(),
          user: req.user.toPublicJSON()
        });
      }
    }

    res.json({ matched, match, direction });
  } catch (err) {
    console.error('Swipe error:', err);
    res.status(500).json({ error: 'Swipe failed' });
  }
});

// Get vibe matches
router.get('/vibe-matches', auth, async (req, res) => {
  try {
    const { vibe } = req.query;
    const targetVibe = vibe || req.user.currentVibe;

    const swipedIds = await Swipe.find({ swiper: req.user._id }).distinct('swiped');
    
    const users = await User.find({
      currentVibe: targetVibe,
      _id: { $nin: [...swipedIds, ...req.user.blockedUsers, req.user._id] },
      banned: false
    })
    .select('name username avatar bio age currentVibe interests safetyScore verified')
    .limit(20);

    res.json({ users, vibe: targetVibe });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get vibe matches' });
  }
});

module.exports = router;
