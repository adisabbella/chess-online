# Chess Online

Real-time multiplayer chess built with Node.js, React, and WebSockets.

## Features

- **Authentication** — JWT stored in an HttpOnly cookie; signup, login, logout, session refresh
- **Matchmaking** — FIFO queue; two players are matched and placed into a game automatically
- **Real-time gameplay** — server-authoritative chess over WebSocket; all move validation runs on the server
- **Complete chess rules** — check, checkmate, stalemate, castling, en passant, promotion, insufficient material, threefold repetition, fifty-move rule
- **Resignation and draw offers** — resign at any time; offer/accept/decline a draw
- **Persistence** — every move and game result is stored in PostgreSQL
- **Player statistics** — wins, losses, draws, and games played per user
- **Reconnection** — disconnected players have 60 seconds to reconnect; board state is fully restored
- **Crash recovery** — active games are restored from the database on server restart

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js · Express · TypeScript |
| Real-time | WebSocket (`ws`) |
| Database ORM | Prisma |
| Database | PostgreSQL |
| Authentication | JWT · bcrypt · HttpOnly cookies |
| Frontend | React · TypeScript · Vite · Tailwind CSS · React Router |
| Shared | TypeScript types and constants (npm workspace) |

## Architecture

```
Frontend (React)
    ↓ HTTP / WebSocket
Express + WebSocket Server
    ↓
Controllers / WebSocket Event Dispatcher
    ↓
Managers (ConnectionManager, MatchmakingManager, GameManager)
    ↓
Services (AuthService, ChessService, PersistenceService)
    ↓
Repositories (GameRepository, MoveRepository, UserRepository)
    ↓
PostgreSQL
```

**Runtime game state** lives entirely in memory (`GameSession`, `GameSessionManager`).  
**Durable game state** is persisted to PostgreSQL after every accepted move and on game completion.

## Project Structure

```
chess-online/
├── client/     # React frontend (Vite + Tailwind CSS)
├── server/     # Express + WebSocket backend
├── shared/     # Shared TypeScript types and WebSocket event constants
└── docs/       # Architecture documentation
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL

### Setup

```bash
# 1. Install all workspace dependencies
npm install

# 2. Configure the server environment
#    Create server/.env with the following variables:
#
#    DATABASE_URL=postgresql://user:password@localhost:5432/chess_online
#    JWT_SECRET=your-secret-key-here
#    PORT=3000                  (optional, defaults to 3000)
#    NODE_ENV=development       (optional)

# 3. Run the database migration
cd server
npx prisma migrate dev --name init
cd ..

# 4. Start both client and server in development mode
npm run dev
```

The frontend runs at `http://localhost:5173`.  
The backend runs at `http://localhost:3000`.

WebSocket connections are proxied through the Vite dev server at `/ws`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start client and server concurrently |
| `npm run build` | Build shared, server, and client for production |
| `npm run format` | Format all TypeScript/JSON/Markdown with Prettier |
| `npm run typecheck` (in `server/` or `client/`) | TypeScript type check without emit |

### Database Commands

```bash
# Apply pending migrations
cd server && npx prisma migrate dev

# Open Prisma Studio (database browser)
cd server && npx prisma studio
```

## HTTP API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | — | Register (username + password) |
| POST | `/api/auth/login` | — | Login; sets HttpOnly JWT cookie |
| POST | `/api/auth/logout` | — | Clear session cookie |
| GET | `/api/auth/me` | ✓ | Get current user and stats |
| GET | `/health` | — | Health check |

## WebSocket Protocol

WebSocket connections are authenticated via the `auth_token` cookie.  
All messages use the format `{ type: string, payload: object }`.

Key events (defined in `shared/src/index.ts`):

| Direction | Event | Description |
|-----------|-------|-------------|
| C → S | `JOIN_QUEUE` | Enter matchmaking |
| C → S | `LEAVE_QUEUE` | Cancel matchmaking |
| S → C | `GAME_FOUND` | Match found; includes game ID and colors |
| C → S | `MAKE_MOVE` | Submit a move `{ gameId, from, to, promotion? }` |
| S → C | `GAME_STATE_UPDATE` | Board state after every accepted move; also sent on reconnect |
| S → C | `MOVE_REJECTED` | Move was illegal or out-of-turn |
| C → S | `RESIGN` | Forfeit the game |
| C → S | `OFFER_DRAW` | Offer a draw to the opponent |
| C → S | `RESPOND_DRAW` | Accept or decline a pending draw offer |
| S → C | `GAME_OVER` | Game ended (checkmate, resign, draw, abandonment) |
| S → C | `PLAYER_DISCONNECTED` | Opponent disconnected; includes remaining seconds |
| S → C | `PLAYER_RECONNECTED` | Opponent reconnected |

## Authentication

Authentication uses JWT stored in an HttpOnly cookie (`SameSite=Lax`, 7-day expiry).  
The token is never exposed to JavaScript — it is read and set only by the server.  
WebSocket connections are authenticated by reading the same cookie on the HTTP upgrade request.

## Docs

See [`docs/`](./docs) for full architecture documentation, database schema, WebSocket protocol details, coding standards, and game rules.
