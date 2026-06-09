const express = require('express');
const router = express.Router();
const { Match, Message } = require('../models/Models');
const { auth } = require('../middleware/auth');

// Get messages for a match
router.get('/:matchId', auth, async (req, res) => {
  try {
    const match = await Match.findOne({ _id: req.params.matchId, users: req.user._id });
    if (!match) return res.status(403).json({ error: 'Access denied' });
    const { page = 1, limit = 50 } = req.query;
    const messages = await Message.find({ match: req.params.matchId, deleted: false })
      .populate('sender', 'name avatar username')
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

// Send message
router.post('/:matchId', auth, async (req, res) => {
  try {
    const match = await Match.findOne({ _id: req.params.matchId, users: req.user._id });
    if (!match) return res.status(403).json({ error: 'Access denied' });
    const receiverId = match.users.find(u => u.toString() !== req.user._id.toString());
    const { content, type = 'text', mediaUrl } = req.body;
    const redFlagPatterns = [/send me money/i, /wire transfer/i, /bank account/i, /you.ve won/i, /click this link/i];
    const hasRedFlag = redFlagPatterns.some(p => p.test(content || ''));
    const message = new Message({
      match: match._id, sender: req.user._id, receiver: receiverId,
      content, type, mediaUrl, aiRedFlag: hasRedFlag,
      aiRedFlagReason: hasRedFlag ? 'Suspicious content detected' : null
    });
    await message.save();
    await message.populate('sender', 'name avatar username');
    match.lastMessage = message._id;
    match.lastActivity = new Date();
    await match.save();
    const io = req.app.get('io');
    io.to(`match_${match._id}`).emit('new_message', { message });
    if (hasRedFlag) io.to(`user_${req.user._id}`).emit('red_flag_warning', { message: 'Message may contain suspicious content.' });
    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ error: 'Send failed' });
  }
});

// React to message
router.post('/:matchId/:messageId/react', auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findOneAndUpdate(
      { _id: req.params.messageId, match: req.params.matchId },
      { $push: { reactions: { user: req.user._id, emoji } } },
      { new: true }
    );
    const io = req.app.get('io');
    io.to(`match_${req.params.matchId}`).emit('message_reaction', { messageId: req.params.messageId, emoji, userId: req.user._id });
    res.json({ message });
  } catch (err) {
    res.status(500).json({ error: 'Reaction failed' });
  }
});

// Delete message
router.delete('/:matchId/:messageId', auth, async (req, res) => {
  try {
    await Message.findOneAndUpdate(
      { _id: req.params.messageId, sender: req.user._id },
      { deleted: true, content: 'Message deleted' }
    );
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
