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

# Milestone 5 — Game Engine

## Goals

Implement the chess game engine.

## Tasks

- Integrate chess.js
- Implement GameSession
- Server-side move validation
- Turn management
- Board state management
- Move history
- Check detection
- Checkmate detection
- Stalemate detection
- Castling
- En passant
- Pawn promotion
- Draw detection
- Resignation

## Output

- Complete chess gameplay works on the server

---

# Milestone 6 — Persistence

## Goals

Persist all game data.

## Tasks

- Create Game model
- Create Move model
- Implement repositories
- Save game after every move
- Save move history
- Save FEN after every move
- Save game status
- Save player statistics

## Output

- Every game is stored permanently
- User statistics update correctly

---

# Milestone 7 — Real-Time Game Synchronization

## Goals

Synchronize gameplay between players.

## Tasks

- MAKE_MOVE event
- GAME_STATE_UPDATE event
- MOVE_REJECTED event
- Update board in real time
- Update move history
- Handle invalid moves
- Synchronize turn changes

## Output

- Both players always see identical game state

---

# Milestone 8 — Recovery & Reconnection

## Goals

Recover active games after disconnects and server restarts.

## Tasks

### Reconnection

- 60-second disconnect timer
- Restore player connection
- Notify opponent
- Resume gameplay

### Crash Recovery

- Restore active games from database
- Reconstruct chess state using FEN
- Rebuild GameSession instances
- Allow players to continue existing games

## Output

- Refreshing browser does not lose game
- Server restart restores active games

---

# Milestone 9 — Game Completion

## Goals

Handle all game-ending scenarios.

## Tasks

- Checkmate
- Stalemate
- Draw agreement
- Insufficient material
- Threefold repetition
- Fifty-move rule
- Resignation
- Abandonment
- GameOver events
- Final statistics update

## Output

- Every game finishes correctly
- Results are permanently stored

---

# Milestone 10 — Frontend Polish

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

# Milestone 11 — Testing & Hardening

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

# Milestone 12 — Final Cleanup

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