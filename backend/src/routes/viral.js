const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

router.get('/profile-card/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('name username avatar bio interests currentVibe safetyScore achievements points level dailyStreak');
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ profileCard: user, shareUrl: `${process.env.CLIENT_URL}/profile/${user.username}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/leaderboard', auth, async (req, res) => {
  try {
    const users = await User.find({ banned: false })
      .select('name username avatar points level dailyStreak achievements')
      .sort({ points: -1 }).limit(20);
    res.json({ leaderboard: users });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/referral-stats', auth, async (req, res) => {
  try {
    res.json({
      referralCode: req.user.referralCode,
      referralCount: req.user.referralCount,
      pointsEarned: req.user.referralCount * 50,
      shareUrl: `${process.env.CLIENT_URL}/register?ref=${req.user.referralCode}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/achievements', auth, async (req, res) => {
  res.json({ achievements: req.user.achievements, points: req.user.points, level: req.user.level, dailyStreak: req.user.dailyStreak });
});

module.exports = router;
