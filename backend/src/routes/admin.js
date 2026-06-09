const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const { Match, Report, Community, Event } = require('../models/Models');

// Dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [totalUsers, activeToday, totalMatches, pendingReports, totalCommunities, totalEvents] = await Promise.all([
      User.countDocuments({ banned: false }),
      User.countDocuments({ lastActive: { $gte: new Date(Date.now() - 24*60*60*1000) } }),
      Match.countDocuments({ status: 'matched' }),
      Report.countDocuments({ status: 'pending' }),
      Community.countDocuments(),
      Event.countDocuments({ dateTime: { $gte: new Date() } })
    ]);

    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
    });

    const topVibes = await User.aggregate([
      { $group: { _id: '$currentVibe', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      stats: { totalUsers, activeToday, totalMatches, pendingReports, totalCommunities, totalEvents, newUsersToday },
      topVibes
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, banned } = req.query;
    let query = {};
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    if (banned !== undefined) query.banned = banned === 'true';

    const users = await User.find(query)
      .select('-password -refreshTokens')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);
    res.json({ users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Ban user
router.patch('/users/:userId/ban', adminAuth, async (req, res) => {
  try {
    const { banned, reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { banned, banReason: reason || '' },
      { new: true }
    ).select('-password');
    res.json({ user, message: banned ? 'User banned' : 'User unbanned' });
  } catch (err) {
    res.status(500).json({ error: 'Ban failed' });
  }
});

// Get reports
router.get('/reports', adminAuth, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const reports = await Report.find({ status })
      .populate('reporter', 'name email avatar')
      .populate('reported', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get reports' });
  }
});

// Resolve report
router.patch('/reports/:reportId', adminAuth, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.reportId,
      { status, adminNote },
      { new: true }
    );
    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// Update safety score
router.patch('/users/:userId/safety', adminAuth, async (req, res) => {
  try {
    const { trust, verification, behavior } = req.body;
    const updates = {};
    if (trust !== undefined) updates['safetyScore.trust'] = trust;
    if (verification !== undefined) updates['safetyScore.verification'] = verification;
    if (behavior !== undefined) updates['safetyScore.behavior'] = behavior;

    const user = await User.findById(req.params.userId);
    Object.assign(user.safetyScore, { trust, verification, behavior });
    user.safetyScore.overall = Math.round((user.safetyScore.trust + user.safetyScore.verification + user.safetyScore.behavior) / 3);
    await user.save();

    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update safety score' });
  }
});

module.exports = router;
