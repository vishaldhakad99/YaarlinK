const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'yaarlink_secret',
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET || 'yaarlink_refresh',
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

const generateReferralCode = () => {
  return 'YAAR' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password, age, gender, referralCode } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        error: existingUser.email === email ? 'Email already registered' : 'Username taken'
      });
    }

    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        referredBy = referrer._id;
        referrer.referralCount += 1;
        referrer.points += 50;
        await referrer.save();
      }
    }

    const user = new User({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      age,
      gender,
      referralCode: generateReferralCode(),
      referredBy,
      safetyScore: { overall: 70, trust: 50, verification: 0, behavior: 100 }
    });

    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshTokens = [refreshToken];
    await user.save();

    res.status(201).json({
      message: 'Account created successfully',
      user: user.toPublicJSON(),
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      $or: [{ email: email?.toLowerCase() }, { username: email?.toLowerCase() }]
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.banned) {
      return res.status(403).json({ error: 'Account banned', reason: user.banReason });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshTokens = user.refreshTokens.slice(-4);
    user.refreshTokens.push(refreshToken);
    user.isOnline = true;
    user.lastActive = new Date();

    // Update streak
    const now = new Date();
    const lastStreakUpdate = user.streakLastUpdated;
    if (lastStreakUpdate) {
      const daysDiff = Math.floor((now - lastStreakUpdate) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        user.dailyStreak += 1;
        user.points += 10;
        if (user.dailyStreak % 7 === 0) {
          user.achievements.push({ badge: 'streak', title: `${user.dailyStreak} Day Streak!`, earnedAt: now });
        }
      } else if (daysDiff > 1) {
        user.dailyStreak = 1;
      }
    } else {
      user.dailyStreak = 1;
    }
    user.streakLastUpdated = now;

    await user.save();

    res.json({
      message: 'Login successful',
      user: user.toPublicJSON(),
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh Token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'yaarlink_refresh');
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user._id);
    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Token refresh failed' });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    req.user.refreshTokens = req.user.refreshTokens.filter(t => t !== refreshToken);
    req.user.isOnline = false;
    await req.user.save();
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('communities', 'name avatar category')
      .select('-password -refreshTokens');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update vibe
router.patch('/vibe', auth, async (req, res) => {
  try {
    const { vibe } = req.body;
    const validVibes = ['chill', 'travel', 'study', 'startup', 'gaming', 'fitness', 'music', 'movies'];
    if (!validVibes.includes(vibe)) return res.status(400).json({ error: 'Invalid vibe' });

    req.user.currentVibe = vibe;
    req.user.vibeHistory.push({ vibe, setAt: new Date() });
    if (req.user.vibeHistory.length > 50) req.user.vibeHistory.shift();
    await req.user.save();

    res.json({ vibe, message: 'Vibe updated!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update vibe' });
  }
});

// Update mood
router.patch('/mood', auth, async (req, res) => {
  try {
    const { mood } = req.body;
    req.user.currentMood = mood;
    await req.user.save();
    res.json({ mood, message: 'Mood updated!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update mood' });
  }
});

module.exports = router;
