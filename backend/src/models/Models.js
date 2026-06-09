const mongoose = require('mongoose');

// Match Model
const matchSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  status: {
    type: String,
    enum: ['pending', 'matched', 'rejected', 'blocked'],
    default: 'pending'
  },
  initiator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  matchType: {
    type: String,
    enum: ['vibe', 'mood', 'ai', 'blind', 'event', 'community'],
    default: 'ai'
  },
  compatibilityScore: { type: Number, min: 0, max: 100 },
  sharedVibes: [String],
  sharedInterests: [String],
  aiInsight: {
    greenFlags: [String],
    challenges: [String],
    conversationStarters: [String]
  },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastActivity: { type: Date, default: Date.now },
  blindMatchRevealed: { type: Boolean, default: false },
  blindMatchRevealedAt: Date
}, { timestamps: true });

matchSchema.index({ users: 1 });

// Message Model
const messageSchema = new mongoose.Schema({
  match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, maxlength: 2000 },
  type: {
    type: String,
    enum: ['text', 'image', 'voice', 'video', 'gif', 'location', 'date-plan'],
    default: 'text'
  },
  mediaUrl: String,
  seen: { type: Boolean, default: false },
  seenAt: Date,
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: String
  }],
  aiRedFlag: { type: Boolean, default: false },
  aiRedFlagReason: String,
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

messageSchema.index({ match: 1, createdAt: -1 });

// Community Model
const communitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  description: { type: String, maxlength: 1000 },
  category: {
    type: String,
    enum: ['coders', 'gamers', 'fitness', 'entrepreneurs', 'travelers', 'music', 'movies', 'study', 'other'],
    required: true
  },
  avatar: String,
  banner: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    role: { type: String, enum: ['member', 'moderator', 'admin'], default: 'member' }
  }],
  memberCount: { type: Number, default: 0 },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost' }],
  isPrivate: { type: Boolean, default: false },
  tags: [String],
  rules: [String]
}, { timestamps: true });

// Community Post Model
const communityPostSchema = new mongoose.Schema({
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  content: { type: String, required: true, maxlength: 5000 },
  media: [String],
  type: { type: String, enum: ['text', 'image', 'poll', 'event'], default: 'text' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likeCount: { type: Number, default: 0 },
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
  }],
  commentCount: { type: Number, default: 0 },
  pinned: { type: Boolean, default: false },
  flair: String
}, { timestamps: true });

// Event Model
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, maxlength: 2000 },
  type: {
    type: String,
    enum: ['hackathon', 'college', 'startup', 'music', 'travel', 'gaming', 'fitness', 'social', 'other'],
    required: true
  },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  banner: String,
  location: {
    name: String,
    address: String,
    city: String,
    virtual: { type: Boolean, default: false },
    meetUrl: String
  },
  dateTime: { type: Date, required: true },
  endDateTime: Date,
  maxAttendees: Number,
  attendees: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now }
  }],
  attendeeCount: { type: Number, default: 0 },
  tags: [String],
  isPublic: { type: Boolean, default: true },
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' }
}, { timestamps: true });

// Report Model
const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reported: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportedMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  reason: {
    type: String,
    enum: ['harassment', 'spam', 'inappropriate', 'fake', 'scam', 'violence', 'other'],
    required: true
  },
  description: String,
  status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'dismissed'], default: 'pending' },
  adminNote: String
}, { timestamps: true });

// Swipe/Like Model
const swipeSchema = new mongoose.Schema({
  swiper: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  swiped: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  direction: { type: String, enum: ['like', 'pass', 'superlike'], required: true },
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' }
}, { timestamps: true });

swipeSchema.index({ swiper: 1, swiped: 1 }, { unique: true });

module.exports = {
  Match: mongoose.model('Match', matchSchema),
  Message: mongoose.model('Message', messageSchema),
  Community: mongoose.model('Community', communitySchema),
  CommunityPost: mongoose.model('CommunityPost', communityPostSchema),
  Event: mongoose.model('Event', eventSchema),
  Report: mongoose.model('Report', reportSchema),
  Swipe: mongoose.model('Swipe', swipeSchema)
};
