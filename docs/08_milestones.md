# Implementation Milestones

## Overview

This document defines the step-by-step implementation plan for the Online Multiplayer Chess application.

Each milestone must be completed fully before moving to the next.

No feature from a later milestone should be implemented early.

---

# Milestone 1 — Project Setup

## Goals

Set up the monorepo and base tooling.

## Tasks

- Create monorepo structure
  - client
  - server
  - shared
- Initialize Git repository
- Setup npm workspaces
- Configure TypeScript
- Configure ESLint and Prettier
- Setup Express backend
- Setup React (Vite) frontend
- Setup shared package
- Configure concurrent development scripts

## Output

- Frontend runs successfully
- Backend runs successfully
- `/health` endpoint responds correctly
- Root `npm run dev` starts both applications

---

# Milestone 2 — Database + Authentication

## Goals

Create the persistent user system and secure authentication.

## Tasks

### Database

- Setup PostgreSQL
- Setup Prisma
- Configure Prisma Client
- Create initial migration

### User Model

- User schema
- Prisma repositories

### Authentication

- Signup API
- Login API
- Logout API
- Current user API (`/me`)
- Password hashing using bcrypt
- JWT generation
- HTTP-only cookies
- Authentication middleware

### Frontend

- Login page
- Signup page
- Protected route support
- Authentication state management

## Output

- Users can register
- Users can login
- Authentication persists after refresh
- Protected APIs work
- Users are stored in PostgreSQL

---

# Milestone 3 — WebSocket Infrastructure

## Goals

Establish authenticated real-time communication.

## Tasks

- Setup WebSocket server
- Authenticate WebSocket connections using JWT
- Implement ConnectionManager
- Socket event dispatcher
- Handle duplicate connections
- Handle disconnect events
- Handle reconnect events

## Output

- Authenticated users can establish WebSocket connections
- Connection lifecycle is managed correctly

---

# Milestone 4 — Matchmaking

## Goals

Match random players into games.

## Tasks

- MatchmakingManager
- FIFO matchmaking queue
- Join queue
- Leave queue
- Create GameSession
- Send GAME_FOUND event
- Redirect users to game screen

## Output

- Two random players are matched
- GameSession is created successfully

---

# Milestone 5 — Game Engine & Real-Time Gameplay

## Goals

Implement a complete playable real-time chess game.

The server becomes the authoritative owner of all game state, while clients send only user actions and render server responses.

## Tasks

### Chess Engine

- Integrate chess.js
- Implement ChessService
- Expand GameSession into the core gameplay class
- Server-side move validation
- Turn management
- Board state management
- Current FEN management
- In-memory move history

### Chess Rules

Support all standard chess rules:

- Legal move validation
- Check
- Checkmate
- Stalemate
- Castling
- En passant
- Pawn promotion
- Insufficient material
- Threefold repetition
- Fifty-move rule

### Gameplay

Implement:

- MAKE_MOVE event
- GAME_STATE_UPDATE event
- MOVE_REJECTED event
- GAME_OVER event
- RESIGN event
- OFFER_DRAW event
- RESPOND_DRAW event

### Frontend

- Chess board rendering
- Piece rendering using server FEN
- Click-to-move interaction
- Move history panel
- Turn indicator
- Game status display
- Resign button
- Draw offer UI

## Output

- Two players can play a complete chess game in real time.
- The server enforces all chess rules.
- Both clients remain synchronized through WebSockets.
- Games exist only in memory.

---

# Milestone 6 — Persistence

## Goals

Persist all game data permanently.

## Tasks

- Create Game model
- Create Move model
- Implement GameRepository
- Implement MoveRepository
- Save every accepted move
- Save move history
- Save current FEN
- Save game status
- Save game result
- Save winner
- Update player statistics after game completion

## Output

- Every game is stored permanently.
- Move history is persisted.
- User statistics update correctly.

---

# Milestone 7 — Recovery & Reconnection

## Goals

Recover active games after disconnects and server restarts.

## Tasks

### Reconnection

- 60-second disconnect timer
- Notify opponent on disconnect
- Restore player connection
- Restore current game state
- Resume gameplay

### Crash Recovery

- Restore active games from database
- Reconstruct chess state using saved FEN
- Recreate GameSession instances
- Register restored sessions
- Allow players to reconnect and continue

## Output

- Refreshing the browser does not lose the game.
- Temporary network failures are handled correctly.
- Active games survive server restarts.

---

# Milestone 8 — Game Completion

## Goals

Finalize completed games and clean up active sessions.

## Tasks

- Finalize completed GameSession instances
- Archive completed games in memory after persistence
- Remove finished sessions from GameSessionManager
- Release player mappings
- Prevent further actions on finished games
- Broadcast final game state where necessary
- Verify all game-ending flows

## Output

- Completed games are finalized correctly.
- Active session memory remains clean.
- Finished games cannot receive additional actions.

---

# Milestone 9 — Frontend Polish

## Goals

Improve user experience.

## Tasks

- Chess board improvements
- Move history panel
- Game status indicators
- Loading states
- Queue screen improvements
- Error handling
- Responsive layout
- Better styling

## Output

- Smooth and polished gameplay experience

---

# Milestone 10 — Testing & Hardening

## Goals

Improve stability and reliability.

## Tasks

- Unit testing
- Integration testing
- End-to-end gameplay testing
- Error handling improvements
- Validation improvements
- Performance review
- Security review
- Bug fixes

## Output

- Stable local application

---

# Milestone 11 — Final Cleanup

## Goals

Prepare the repository for long-term maintenance.

## Tasks

- Remove dead code
- Refactor large files
- Improve documentation
- Improve comments where necessary
- Verify coding standards
- Verify architecture consistency
- Final code review

## Output

- Clean, maintainable, production-quality codebase

---

# Final Outcome

After completing all milestones:

- Secure authentication
- Persistent PostgreSQL database
- JWT authentication with HTTP-only cookies
- Real-time multiplayer chess
- Random matchmaking
- Complete chess rules
- Automatic reconnection
- Crash recovery
- Permanent game history
- Player statistics
- Clean architecture
- Fully documented codebase

---

# Execution Rules

For every milestone:

1. Read the project documentation before implementation.
2. Implement only the current milestone.
3. Do not introduce future milestone features.
4. Test locally before proceeding.
5. Fix all issues before starting the next milestone.
6. Keep the architecture consistent with the documentation.