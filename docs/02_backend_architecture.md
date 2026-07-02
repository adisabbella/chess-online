# Backend Architecture

## 1. Overview

The backend is responsible for authentication, matchmaking, gameplay, persistence, crash recovery, and real-time communication.

The backend is the single source of truth for all game state. Clients are never trusted to validate moves or maintain board state.

Every client action must be validated by the server before it affects the game.

---

# 2. Technology Stack

## Runtime

- Node.js

## Language

- TypeScript

## HTTP Framework

- Express

## Real-Time Communication

- ws

## ORM

- Prisma

## Database

- PostgreSQL

## Authentication

- JWT
- HTTP-only Cookies

## Chess Engine

- chess.js

---

# 3. Directory Structure

server/
│
├── src/
│
├── config/
│   ├── env.ts
│   ├── prisma.ts
│   └── cookie.ts
│
├── routes/
│   ├── auth.routes.ts
│   └── user.routes.ts
│
├── controllers/
│   ├── auth.controller.ts
│   └── user.controller.ts
│
├── middleware/
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   └── validation.middleware.ts
│
├── websocket/
│   ├── websocket.server.ts
│   ├── eventDispatcher.ts
│   └── websocket.types.ts
│
├── managers/
│   ├── connection.manager.ts
│   ├── matchmaking.manager.ts
│   ├── game.manager.ts
│   └── gameSession.manager.ts
│
├── sessions/
│   └── game.session.ts
│
├── services/
│   ├── chess.service.ts
│   ├── persistence.service.ts
│   ├── reconnect.service.ts
│   └── statistics.service.ts
│
├── repositories/
│   ├── game.repository.ts
│   ├── move.repository.ts
│   └── user.repository.ts
│
├── utils/
│
├── types/
│
├── app.ts
│
└── server.ts

---

# 4. Core Components

## Express

Responsible for

- Authentication APIs
- Cookie management
- User APIs

Express never manages gameplay.

---

## WebSocket Server

Responsible for

- Accepting socket connections
- Authenticating sockets
- Receiving messages
- Sending messages

Business logic must never exist here.

---

## Event Dispatcher

Every incoming WebSocket message is routed through the Event Dispatcher.

Responsibilities

- Parse incoming event
- Validate event format
- Dispatch to the appropriate manager

Examples

Move

↓

GameManager

Join Queue

↓

MatchmakingManager

Resign

↓

GameManager

---

## Connection Manager

Maintains every active WebSocket connection.

Tracks

- userId
- socket
- connection status

Responsibilities

- Register socket
- Remove socket
- Replace old connection
- Detect disconnects
- Support reconnects

---

## Matchmaking Manager

Maintains the waiting queue.

Responsibilities

- Join queue
- Leave queue
- Match two players
- Create new GameSession
- Register session

Queue strategy

FIFO

---

## GameSessionManager

Stores every active game currently running.

Maintains

activeGames

Map<gameId, GameSession>

userToGame

Map<userId, gameId>

Responsibilities

- Register active session
- Remove completed session
- Find session by gameId
- Find session by userId
- Restore sessions after crash

This manager exists purely for fast lookups and lifecycle management.

---

## GameManager

Coordinates gameplay operations.

Responsibilities

- Create GameSession
- Retrieve GameSession
- Forward events to GameSession
- Restore active sessions on startup
- Destroy completed sessions

The GameManager intentionally contains very little game logic.

---

## GameSession

Represents one active chess game.

Every running game has exactly one GameSession instance.

Owns

- chess.js instance
- White player
- Black player
- Current FEN
- Move history
- Disconnect timers
- Draw offers
- Game status

Responsibilities

- Validate moves
- Apply moves
- Broadcast state
- Handle resignations
- Handle draw offers
- Handle reconnects
- Persist updates
- Finish games

GameSession is the heart of the gameplay system.

---

## Chess Service

Thin wrapper around chess.js.

Responsibilities

- Move validation
- Board updates
- Check detection
- Checkmate detection
- Stalemate detection
- Draw detection
- Promotion
- Castling
- En passant

Contains no database logic.

---

## Persistence Service

Responsible for all persistence.

Responsibilities

- Save game
- Save move
- Update FEN
- Restore active games
- Archive completed games

---

## Statistics Service

Updates user statistics after game completion.

Tracks

- Wins
- Losses
- Draws
- Games Played

---

# 5. Server Startup

Server startup sequence

1. Load environment variables
2. Connect PostgreSQL
3. Initialize Prisma
4. Start Express server
5. Start WebSocket server
6. Load every active game
7. Create GameSession for each game
8. Register sessions inside GameSessionManager
9. Accept incoming connections

---

# 6. Game Lifecycle

Player joins queue

↓

MatchmakingManager pairs players

↓

GameManager creates GameSession

↓

GameSession registered inside GameSessionManager

↓

Players play

↓

Every move persisted

↓

Game ends

↓

Statistics updated

↓

Game archived

↓

GameSession removed from memory

---

# 7. Crash Recovery

Every accepted move updates

- Current FEN
- Move history
- Metadata

If the server crashes

↓

Restart server

↓

Load active games

↓

Create GameSession for each game

↓

Register sessions

↓

Wait for reconnects

↓

Resume games

No manual recovery is required.

---

# 8. Error Handling

The backend must gracefully handle

- Invalid JWT
- Expired JWT
- Duplicate connections
- Illegal moves
- Invalid WebSocket events
- Database failures
- Unexpected exceptions

Unexpected errors should never terminate the server.

---

# 9. Logging

Log

- Login
- Logout
- Queue join
- Queue leave
- Match created
- Game finished
- Reconnect
- Disconnect timeout
- Unexpected errors

Never log

- Passwords
- JWTs
- Cookies

---

# 10. Design Principles

The backend follows these principles.

- Server-authoritative game state
- Single Responsibility Principle
- Separation of Concerns
- Stateless HTTP APIs
- Stateful WebSocket communication
- Strong TypeScript typing
- Repository pattern
- Service layer architecture
- One GameSession per active game
- O(1) lookup for active sessions
- Modular and extensible design