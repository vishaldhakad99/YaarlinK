# 🔗 YaarLink — Next-Gen Social Connection Platform

> Dating + Friendship + Networking + Community — Powered by AI, Built for Gen-Z India

## ✨ Features

- 🎯 **Vibe Matching** — Match by energy: Chill, Travel, Startup, Gaming, Fitness...
- 🤖 **AI Personality Analysis** — Compatibility, green flags, conversation starters
- 🕶️ **Blind Match** — Connect through personality before appearance
- 🛡️ **AI Red Flag Detection** — Real-time toxic behavior & scam detection
- 💬 **AI Relationship Coach** — Date ideas & conversation improvements
- 🌍 **Event-Based Matching** — Hackathons, concerts, college events
- 🏘️ **Social Communities** — Discord + Reddit style communities
- 💑 **Couple Mode** — Anniversaries, memories, bucket lists
- ⚡ **Safety Score** — Trust, verification & behavior scores
- 🏆 **Viral Features** — Referrals, streaks, leaderboards, badges

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Docker & Docker Compose (optional)

### Option 1: Docker (Recommended)
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your keys
docker-compose up -d
```
Open http://localhost:3000

### Option 2: Manual Setup

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

## 🔑 Environment Variables (backend/.env)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret (change in prod!) |
| `ANTHROPIC_API_KEY` | For AI features (optional) |
| `CLOUDINARY_*` | For image uploads (optional) |
| `SMTP_*` | For email verification (optional) |

## 📁 Project Structure

```
yaarlink/
├── backend/
│   ├── src/
│   │   ├── models/       # MongoDB schemas
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth, validation
│   │   ├── socket/       # Socket.IO handlers
│   │   └── utils/        # Seed data, helpers
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/        # App screens
│   │   ├── components/   # Reusable UI
│   │   ├── store/        # Zustand state
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # API, constants
│   └── package.json
└── docker-compose.yml
```

## 🔐 Default Admin

After running seed: `admin@yaarlink.com` / `Admin@123`

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/discover` | Get discovery feed |
| POST | `/api/discover/swipe` | Like/pass user |
| GET | `/api/matches` | Get matches |
| GET/POST | `/api/messages/:matchId` | Chat messages |
| GET/POST | `/api/communities` | Communities |
| GET/POST | `/api/events` | Events |
| GET | `/api/ai/analyze/:userId` | AI analysis |
| POST | `/api/safety/report` | Report user |
| GET | `/api/admin/stats` | Admin dashboard |

## 🎨 Tech Stack

**Frontend:** React 18, Zustand, Framer Motion, Socket.IO Client, React Router 6

**Backend:** Node.js, Express, MongoDB/Mongoose, Socket.IO, JWT, Bcrypt

**AI:** Anthropic Claude API (personality analysis, red flag detection, date planner)

**Infrastructure:** Docker, Nginx, Redis

## 📱 PWA Support
Add to home screen on iOS/Android for app-like experience.

---
