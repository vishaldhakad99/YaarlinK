const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const { Match } = require('../models/Models');

// AI Personality Analysis
router.post('/analyze-personality', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const interests = user.interests?.join(', ') || 'various topics';
    const prompts = user.prompts?.map(p => `${p.question}: ${p.answer}`).join('; ') || '';
    const vibe = user.currentVibe;
    const bio = user.bio || '';

    // AI analysis via Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `Analyze this person's profile for a social connection app called YaarLink. Return ONLY valid JSON, no markdown.

Profile:
- Bio: ${bio}
- Interests: ${interests}
- Current Vibe: ${vibe}
- Prompts: ${prompts}

Return JSON: {
  "communicationStyle": "string (e.g. Expressive & Warm)",
  "personalityTraits": ["trait1","trait2","trait3"],
  "greenFlags": ["flag1","flag2","flag3"],
  "potentialChallenges": ["challenge1","challenge2"],
  "compatibilityNotes": "string",
  "conversationStarters": ["starter1","starter2","starter3"]
}`
        }]
      })
    });

    let analysis = {
      communicationStyle: 'Expressive & Warm',
      personalityTraits: ['Curious', 'Open-minded', 'Adventurous'],
      greenFlags: ['Active listener', 'Values authenticity', 'Good sense of humor'],
      potentialChallenges: ['May need personal space', 'High standards'],
      compatibilityNotes: 'Great match for people who value deep conversations',
      conversationStarters: ['What\'s your latest obsession?', 'Best trip you\'ve taken?', 'Current vibe?']
    };

    if (response.ok) {
      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      try {
        analysis = JSON.parse(text);
      } catch (e) { /* use defaults */ }
    }

    await User.findByIdAndUpdate(req.user._id, {
      'aiProfile.communicationStyle': analysis.communicationStyle,
      'aiProfile.personalityTraits': analysis.personalityTraits,
      'aiProfile.greenFlags': analysis.greenFlags,
      'aiProfile.lastAnalyzed': new Date()
    });

    res.json({ analysis });
  } catch (err) {
    console.error('AI analyze error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// AI Compatibility Check between two users
router.get('/compatibility/:userId', auth, async (req, res) => {
  try {
    const [userA, userB] = await Promise.all([
      User.findById(req.user._id),
      User.findById(req.params.userId)
    ]);
    if (!userB) return res.status(404).json({ error: 'User not found' });

    const sharedInterests = userA.interests?.filter(i => userB.interests?.includes(i)) || [];
    const vibeMatch = userA.currentVibe === userB.currentVibe;
    const moodMatch = userA.currentMood === userB.currentMood;
    const baseScore = Math.min(100, sharedInterests.length * 12 + (vibeMatch ? 20 : 0) + (moodMatch ? 15 : 0) + 40);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: `Compare two YaarLink users and return ONLY valid JSON:

Person A: interests=${userA.interests?.join(',')}, vibe=${userA.currentVibe}, mood=${userA.currentMood}
Person B: interests=${userB.interests?.join(',')}, vibe=${userB.currentVibe}, mood=${userB.currentMood}
Shared interests: ${sharedInterests.join(', ') || 'none'}

JSON: {"score":${baseScore},"greenFlags":["flag1","flag2"],"challenges":["ch1"],"conversationStarters":["s1","s2","s3"],"summary":"brief summary"}`
        }]
      })
    });

    let result = {
      score: baseScore,
      greenFlags: sharedInterests.length > 0 ? [`Both love ${sharedInterests[0]}`] : ['Open to new connections'],
      challenges: ['Different schedules may be tricky'],
      conversationStarters: ['What\'s your favorite thing to do on weekends?', `How did you get into ${sharedInterests[0] || 'your interests'}?`],
      summary: `${baseScore}% compatible based on shared vibes and interests`
    };

    if (response.ok) {
      const data = await response.json();
      try { result = JSON.parse(data.content?.[0]?.text || '{}'); } catch (e) {}
    }

    res.json({ compatibility: result, sharedInterests });
  } catch (err) {
    res.status(500).json({ error: 'Compatibility check failed' });
  }
});

// AI Red Flag Detection on message
router.post('/check-message', auth, async (req, res) => {
  try {
    const { message } = req.body;

    const redFlagPatterns = [
      { pattern: /send money|wire transfer|bank account|western union/i, type: 'financial_scam', severity: 'high' },
      { pattern: /click (this|the) link|bit\.ly|tinyurl/i, type: 'phishing', severity: 'high' },
      { pattern: /you('ve| have) won|lottery|prize/i, type: 'scam', severity: 'high' },
      { pattern: /kill|hurt|harm|threat/i, type: 'threat', severity: 'critical' },
      { pattern: /nude|naked|send photos/i, type: 'inappropriate', severity: 'medium' },
      { pattern: /meet me alone at night/i, type: 'safety', severity: 'medium' }
    ];

    let detected = null;
    for (const rf of redFlagPatterns) {
      if (rf.pattern.test(message)) {
        detected = rf;
        break;
      }
    }

    res.json({
      safe: !detected,
      redFlag: detected,
      warning: detected ? `⚠️ Warning: This message may contain ${detected.type.replace('_', ' ')}. Please be careful.` : null
    });
  } catch (err) {
    res.status(500).json({ error: 'Check failed' });
  }
});

// AI Relationship Coach
router.post('/coach', auth, async (req, res) => {
  try {
    const { context, question } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: 'You are YaarLink\'s AI Relationship Coach — warm, supportive, and practical. Give concise, actionable advice for real human connections. Keep responses under 150 words.',
        messages: [{
          role: 'user',
          content: `Context: ${context || 'General relationship advice'}\nQuestion: ${question}`
        }]
      })
    });

    let advice = 'Focus on being authentic and showing genuine curiosity about the other person. Ask open-ended questions and listen actively.';

    if (response.ok) {
      const data = await response.json();
      advice = data.content?.[0]?.text || advice;
    }

    res.json({ advice });
  } catch (err) {
    res.status(500).json({ error: 'Coach unavailable' });
  }
});

// AI Date Planner
router.post('/date-planner', auth, async (req, res) => {
  try {
    const { matchId, city, preferences, budget } = req.body;
    const user = await User.findById(req.user._id);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 700,
        messages: [{
          role: 'user',
          content: `Create a personalized date plan. Return ONLY valid JSON.

City: ${city || 'the user\'s city'}
Interests: ${user.interests?.join(', ') || 'general'}
Preferences: ${preferences || 'casual and fun'}
Budget: ${budget || 'moderate'}

JSON: {
  "title": "Date Plan Name",
  "duration": "3-4 hours",
  "vibe": "Adventurous & Fun",
  "steps": [
    {"time":"6:00 PM","activity":"string","description":"string","tip":"string"},
    {"time":"7:30 PM","activity":"string","description":"string","tip":"string"},
    {"time":"9:00 PM","activity":"string","description":"string","tip":"string"}
  ],
  "conversationTopics": ["topic1","topic2","topic3"],
  "whatToWear": "string",
  "budget": "Approx ₹1500-2000"
}`
        }]
      })
    });

    let plan = {
      title: 'Perfect Evening Out',
      duration: '3-4 hours',
      vibe: 'Chill & Connected',
      steps: [
        { time: '6:00 PM', activity: 'Coffee Walk', description: 'Start with a casual walk and coffee', tip: 'Pick a scenic spot' },
        { time: '7:30 PM', activity: 'Dinner', description: 'Try a cozy local restaurant', tip: 'Share dishes to break the ice' },
        { time: '9:00 PM', activity: 'Dessert & Chat', description: 'Dessert and deep conversations', tip: 'Turn off notifications' }
      ],
      conversationTopics: ['Childhood dreams', 'Bucket list adventures', 'Guilty pleasures'],
      whatToWear: 'Smart casual — be comfortable and yourself',
      budget: 'Approx ₹1500-2500'
    };

    if (response.ok) {
      const data = await response.json();
      try { plan = JSON.parse(data.content?.[0]?.text || '{}'); } catch (e) {}
    }

    res.json({ plan });
  } catch (err) {
    res.status(500).json({ error: 'Date planner failed' });
  }
});

module.exports = router;
