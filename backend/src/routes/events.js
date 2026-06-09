const express = require('express');
const router = express.Router();
const { Event } = require('../models/Models');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { type, city, limit = 20 } = req.query;
    let query = { dateTime: { $gte: new Date() } };
    if (type) query.type = type;
    if (city) query['location.city'] = new RegExp(city, 'i');
    const events = await Event.find(query)
      .populate('creator', 'name avatar username')
      .sort({ dateTime: 1 })
      .limit(parseInt(limit));
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const event = new Event({ ...req.body, creator: req.user._id, attendees: [{ user: req.user._id }], attendeeCount: 1 });
    await event.save();
    res.status(201).json({ event });
  } catch (err) {
    res.status(500).json({ error: 'Create failed' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'name avatar username')
      .populate('attendees.user', 'name avatar username');
    if (!event) return res.status(404).json({ error: 'Not found' });
    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/:id/join', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Not found' });
    const isAttending = event.attendees.some(a => a.user.toString() === req.user._id.toString());
    if (isAttending) return res.status(400).json({ error: 'Already joined' });
    if (event.maxAttendees && event.attendeeCount >= event.maxAttendees) return res.status(400).json({ error: 'Event full' });
    event.attendees.push({ user: req.user._id });
    event.attendeeCount += 1;
    await event.save();
    await User.findByIdAndUpdate(req.user._id, { $push: { events: event._id } });
    res.json({ message: 'Joined event! 🎉', event });
  } catch (err) {
    res.status(500).json({ error: 'Join failed' });
  }
});

module.exports = router;
