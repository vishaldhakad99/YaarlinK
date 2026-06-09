const express = require('express');
const router = express.Router();
const { Report } = require('../models/Models');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

router.post('/report', auth, async (req, res) => {
  try {
    const { reportedUserId, reason, description, messageId } = req.body;
    const report = new Report({
      reporter: req.user._id, reported: reportedUserId,
      reportedMessage: messageId, reason, description
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

router.post('/block', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!req.user.blockedUsers.includes(userId)) {
      await User.findByIdAndUpdate(req.user._id, { $push: { blockedUsers: userId } });
    }
    const { Match } = require('../models/Models');
    await Match.updateMany({ users: { $all: [req.user._id, userId] } }, { status: 'blocked' });
    res.json({ message: 'User blocked' });
  } catch (err) {
    res.status(500).json({ error: 'Block failed' });
  }
});

router.post('/unblock', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    await User.findByIdAndUpdate(req.user._id, { $pull: { blockedUsers: userId } });
    res.json({ message: 'User unblocked' });
  } catch (err) {
    res.status(500).json({ error: 'Unblock failed' });
  }
});

router.get('/score', auth, async (req, res) => {
  res.json({ safetyScore: req.user.safetyScore, verified: req.user.verified });
});

module.exports = router;
