# Chess Online

Real-time multiplayer chess built with Node.js, React, and WebSockets.

## Tech Stack

**Backend** — Node.js · Express · TypeScript · Prisma · PostgreSQL · JWT · bcrypt  
**Frontend** — React · TypeScript · Vite · Tailwind CSS · React Router  
**Shared** — TypeScript types and constants

## Project Structure

```
chess-online/
├── client/     # React frontend (Vite)
├── server/     # Express backend
├── shared/     # Shared types and constants
└── docs/       # Architecture documentation
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your DATABASE_URL and JWT_SECRET

# Run the database migration
cd server
npx prisma migrate dev --name init
cd ..

# Start both client and server
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend at `http://localhost:3000`.

## Milestones

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Project Setup | ✅ Done |
| 2 | Database + Authentication | ✅ Done |
| 3 | WebSocket Infrastructure | ⏳ Pending |
| 4 | Matchmaking | ⏳ Pending |
| 5 | Game Engine | ⏳ Pending |
| 6 | Persistence | ⏳ Pending |
| 7 | Real-Time Synchronization | ⏳ Pending |
| 8 | Reconnection & Recovery | ⏳ Pending |
| 9 | Game Completion | ⏳ Pending |
| 10 | Frontend Polish | ⏳ Pending |
| 11 | Testing & Hardening | ⏳ Pending |
| 12 | Final Cleanup | ⏳ Pending |

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Register with username + password |
| POST | `/api/auth/login` | Login, sets HttpOnly JWT cookie |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/auth/me` | Get current user (protected) |
| GET | `/health` | Health check |

## Authentication

Authentication uses JWT stored in an HttpOnly cookie (`SameSite=Lax`). The token is never exposed in the response body or accessible from JavaScript.

## Docs

See the [`docs/`](./docs) folder for full architecture, database schema, coding standards, and milestone plan.
