const express = require('express');
const router = express.Router();
const { Match, Swipe } = require('../models/Models');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get all matches
router.get('/', auth, async (req, res) => {
  try {
    const matches = await Match.find({ users: req.user._id, status: 'matched' })
      .populate('users', 'name username avatar isOnline lastActive currentVibe currentMood')
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

// Get single match
router.get('/:matchId', auth, async (req, res) => {
  try {
    const match = await Match.findOne({ _id: req.params.matchId, users: req.user._id })
      .populate('users', 'name username avatar isOnline currentVibe bio interests prompts safetyScore verified');
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json({ match });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get match' });
  }
});

// Reveal blind match
router.post('/:matchId/reveal', auth, async (req, res) => {
  try {
    const match = await Match.findOneAndUpdate(
      { _id: req.params.matchId, users: req.user._id },
      { blindMatchRevealed: true, blindMatchRevealedAt: new Date() },
      { new: true }
    );
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json({ match, message: 'Photos revealed! 🎉' });
  } catch (err) {
    res.status(500).json({ error: 'Reveal failed' });
  }
});

// Unmatch
router.delete('/:matchId', auth, async (req, res) => {
  try {
    await Match.findOneAndUpdate(
      { _id: req.params.matchId, users: req.user._id },
      { status: 'rejected' }
    );
    res.json({ message: 'Unmatched' });
  } catch (err) {
    res.status(500).json({ error: 'Unmatch failed' });
  }
});

module.exports = router;
