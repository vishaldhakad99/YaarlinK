const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true, minlength: 6 },
  
  // Profile
  avatar: { type: String, default: '' },
  photos: [{ type: String }],
  bio: { type: String, maxlength: 500 },
  age: { type: Number, min: 18, max: 100 },
  gender: { type: String, enum: ['male', 'female', 'non-binary', 'prefer-not-to-say'] },
  location: {
    city: String,
    state: String,
    country: String,
    coordinates: {
      type: { type: String, default: 'Point' },
      coordinates: [Number]
    }
  },
  
  // Purpose
  lookingFor: [{
    type: String,
    enum: ['dating', 'friendship', 'networking', 'community']
  }],
  
  // Vibe System
  currentVibe: {
    type: String,
    enum: ['chill', 'travel', 'study', 'startup', 'gaming', 'fitness', 'music', 'movies'],
    default: 'chill'
  },
  vibeHistory: [{
    vibe: String,
    setAt: { type: Date, default: Date.now }
  }],
  
  // Mood
  currentMood: {
    type: String,
    enum: ['happy', 'adventurous', 'focused', 'social', 'reflective', 'creative', 'energetic', 'chill'],
    default: 'happy'
  },
  
  // Interests & Personality
  interests: [{ type: String }],
  prompts: [{
    question: String,
    answer: String
  }],
  personalityType: { type: String }, // MBTI
  
  // AI Analysis
  aiProfile: {
    communicationStyle: String,
    personalityTraits: [String],
    compatibilityScore: Number,
    lastAnalyzed: Date,
    greenFlags: [String],
    redFlags: [String]
  },
  
  // Safety & Trust
  safetyScore: {
    overall: { type: Number, default: 70, min: 0, max: 100 },
    trust: { type: Number, default: 50, min: 0, max: 100 },
    verification: { type: Number, default: 0, min: 0, max: 100 },
    behavior: { type: Number, default: 100, min: 0, max: 100 }
  },
  
  // Verification
  verified: {
    email: { type: Boolean, default: false },
    phone: { type: Boolean, default: false },
    photo: { type: Boolean, default: false },
    government: { type: Boolean, default: false }
  },
  verificationBadge: { type: Boolean, default: false },
  
  // Blind Mode
  blindMode: { type: Boolean, default: false },
  
  // Couple Mode
  coupleMode: {
    active: { type: Boolean, default: false },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startDate: Date,
    anniversary: Date,
    sharedMemories: [{ title: String, date: Date, photo: String }],
    bucketList: [{ item: String, completed: Boolean }],
    journalEntries: [{ entry: String, date: Date, author: mongoose.Schema.Types.ObjectId }]
  },
  
  // Viral Features
  referralCode: { type: String, unique: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralCount: { type: Number, default: 0 },
  achievements: [{
    badge: String,
    title: String,
    earnedAt: Date
  }],
  dailyStreak: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  streakLastUpdated: Date,
  
  // Gamification
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  
  // Settings
  settings: {
    notifications: {
      matches: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      events: { type: Boolean, default: true }
    },
    privacy: {
      showAge: { type: Boolean, default: true },
      showLocation: { type: Boolean, default: true },
      onlineStatus: { type: Boolean, default: true }
    },
    discovery: {
      ageRange: { min: { type: Number, default: 18 }, max: { type: Number, default: 35 } },
      distance: { type: Number, default: 50 },
      genderPreference: [String]
    }
  },
  
  // Social
  communities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Community' }],
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Auth
  emailVerificationToken: String,
  emailVerificationExpiry: Date,
  passwordResetToken: String,
  passwordResetExpiry: Date,
  refreshTokens: [String],
  
  // Admin
  role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
  banned: { type: Boolean, default: false },
  banReason: String,
  
  isOnline: { type: Boolean, default: false },
  premium: { type: Boolean, default: false },
  premiumExpiry: Date

}, { timestamps: true });

userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ currentVibe: 1 });
userSchema.index({ currentMood: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  delete obj.refreshTokens;
  delete obj.blockedUsers;
  delete obj.reportedBy;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
