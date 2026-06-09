const mongoose = require('mongoose');
const User = require('../models/User');
const { Community, Event } = require('../models/Models');
require('dotenv').config();

const seedData = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yaarlink');
  console.log('Connected to MongoDB');

  // Clear existing
  await User.deleteMany({});
  await Community.deleteMany({});
  await Event.deleteMany({});

  // Create admin
  const admin = new User({
    name: 'YaarLink Admin',
    username: 'admin',
    email: 'admin@yaarlink.com',
    password: 'Admin@123',
    role: 'admin',
    age: 28,
    gender: 'non-binary',
    bio: 'Building the future of connections 🚀',
    referralCode: 'YAARADMIN',
    interests: ['technology', 'design', 'startups'],
    currentVibe: 'startup',
    verified: { email: true, phone: true, photo: true },
    safetyScore: { overall: 100, trust: 100, verification: 100, behavior: 100 }
  });
  await admin.save();

  // Create sample users
  const users = [
    { name: 'Arjun Sharma', username: 'arjun_s', email: 'arjun@test.com', age: 24, gender: 'male', bio: 'Full-stack dev | Coffee addict ☕', interests: ['coding', 'gaming', 'music'], currentVibe: 'startup', currentMood: 'focused' },
    { name: 'Priya Kapoor', username: 'priya_k', email: 'priya@test.com', age: 22, gender: 'female', bio: 'Designer by day, traveler by heart 🌍', interests: ['design', 'travel', 'photography'], currentVibe: 'travel', currentMood: 'adventurous' },
    { name: 'Rohan Verma', username: 'rohan_v', email: 'rohan@test.com', age: 26, gender: 'male', bio: 'Entrepreneur | Building cool stuff', interests: ['startups', 'fitness', 'reading'], currentVibe: 'startup', currentMood: 'energetic' },
    { name: 'Sneha Patel', username: 'sneha_p', email: 'sneha@test.com', age: 23, gender: 'female', bio: 'Music producer | Movie buff 🎬', interests: ['music', 'movies', 'art'], currentVibe: 'music', currentMood: 'creative' },
    { name: 'Karan Singh', username: 'karan_s', email: 'karan@test.com', age: 25, gender: 'male', bio: 'Gamer & Coder. GG ez.', interests: ['gaming', 'coding', 'anime'], currentVibe: 'gaming', currentMood: 'chill' },
    { name: 'Meera Nair', username: 'meera_n', email: 'meera@test.com', age: 24, gender: 'female', bio: 'Fitness freak | Yoga teacher 🧘', interests: ['fitness', 'yoga', 'wellness'], currentVibe: 'fitness', currentMood: 'energetic' },
  ];

  for (const u of users) {
    const user = new User({
      ...u,
      password: 'Test@123',
      referralCode: 'YAAR' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      verified: { email: true },
      safetyScore: { overall: 75, trust: 70, verification: 50, behavior: 90 },
      lookingFor: ['dating', 'friendship'],
      prompts: [
        { question: 'Two truths and a lie:', answer: 'I can code in 5 languages, I\'ve been to 10 countries, I can cook' },
        { question: 'My love language:', answer: 'Quality time and deep conversations' }
      ]
    });
    await user.save();
  }

  // Create communities
  const communities = [
    { name: 'Coders Hub', category: 'coders', description: 'For developers, by developers. Share, learn, grow together.' },
    { name: 'Gamer Zone', category: 'gamers', description: 'Where gamers unite. All platforms welcome.' },
    { name: 'Fit Squad', category: 'fitness', description: 'Your daily fitness motivation and community.' },
    { name: 'Startup Circle', category: 'entrepreneurs', description: 'Connect with founders, builders, and dreamers.' },
    { name: 'Wanderlust Tribe', category: 'travelers', description: 'Travel stories, tips, and finding travel buddies.' },
  ];

  const adminUser = await User.findOne({ role: 'admin' });
  for (const c of communities) {
    const community = new Community({
      ...c,
      slug: c.name.toLowerCase().replace(/\s+/g, '-'),
      creator: adminUser._id,
      members: [{ user: adminUser._id, role: 'admin' }],
      memberCount: 1
    });
    await community.save();
  }

  // Create events
  const events = [
    { title: 'YaarLink Hackathon 2024', type: 'hackathon', description: '48-hour hackathon to build the future!', location: { name: 'TechHub Bhopal', city: 'Bhopal', virtual: false }, dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { title: 'Startup Founders Meetup', type: 'startup', description: 'Connect with fellow founders and investors', location: { name: 'Innovation Center', city: 'Bhopal', virtual: false }, dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
    { title: 'Gaming Night Online', type: 'gaming', description: 'Join us for a fun gaming night!', location: { virtual: true, meetUrl: 'https://discord.gg/yaarlink' }, dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
  ];

  for (const e of events) {
    const event = new Event({ ...e, creator: adminUser._id, attendees: [{ user: adminUser._id }], attendeeCount: 1 });
    await event.save();
  }

  console.log('✅ Seed complete!');
  console.log('Admin: admin@yaarlink.com / Admin@123');
  console.log('Test users: arjun@test.com / Test@123');
  process.exit(0);
};

seedData().catch(console.error);
