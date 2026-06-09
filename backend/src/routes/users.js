const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ users: [] });
    const users = await User.find({
      $or: [
        { name: new RegExp(q, 'i') },
        { username: new RegExp(q, 'i') }
      ],
      _id: { $ne: req.user._id },
      banned: false
    }).select('name username avatar bio currentVibe safetyScore verified').limit(20);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -refreshTokens -blockedUsers -reportedBy -emailVerificationToken -passwordResetToken');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.patch('/profile', auth, async (req, res) => {
  try {
    const allowed = ['name', 'bio', 'age', 'gender', 'interests', 'prompts', 'personalityType',
      'lookingFor', 'location', 'settings', 'blindMode', 'currentVibe', 'currentMood', 'photos', 'avatar'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password -refreshTokens');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

router.patch('/couple-mode', auth, async (req, res) => {
  try {
    const { partnerId, action, data } = req.body;
    if (action === 'activate') {
      await User.findByIdAndUpdate(req.user._id, {
        'coupleMode.active': true, 'coupleMode.partnerId': partnerId, 'coupleMode.startDate': new Date()
      });
    } else if (action === 'add-memory') {
      await User.findByIdAndUpdate(req.user._id, { $push: { 'coupleMode.sharedMemories': data } });
    } else if (action === 'add-bucket') {
      await User.findByIdAndUpdate(req.user._id, { $push: { 'coupleMode.bucketList': { item: data, completed: false } } });
    }
    const user = await User.findById(req.user._id).select('coupleMode');
    res.json({ coupleMode: user.coupleMode });
  } catch (err) {
    res.status(500).json({ error: 'Couple mode update failed' });
  }
});

module.exports = router;
