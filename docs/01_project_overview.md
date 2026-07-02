# Online Multiplayer Chess

## 1. Project Overview

Online Multiplayer Chess is a full-stack web application that allows authenticated users to play real-time chess against randomly matched opponents.

The application uses WebSockets for low-latency communication and the `chess.js` library for chess rule enforcement. The server is the single source of truth for all game state, ensuring that clients cannot manipulate game logic.

Every active game is persisted to the database after each move, allowing games to be restored in the event of a server restart or crash.

Version 1 focuses on building a reliable multiplayer experience rather than advanced competitive features such as ratings, tournaments, or spectators.

---

# 2. Goals

The primary goals of this project are:

- Build a real-time multiplayer chess application.
- Learn scalable WebSocket architecture.
- Maintain server-authoritative game state.
- Support automatic reconnection after temporary network failures.
- Recover active games after unexpected server shutdowns.
- Store completed games permanently.
- Follow clean software architecture and engineering practices.

---

# 3. Non Goals

The following features are intentionally excluded from Version 1.

- Elo rating system
- Friends system
- Private rooms
- Spectator mode
- Player chat
- Chess clocks
- Game analysis
- Engine assistance
- Tournament support
- Multiple game modes
- Multiple server deployment
- Redis-based matchmaking

These features may be added in future versions.

---

# 4. Users

Only authenticated users may play games.

There are no administrator-specific features in Version 1.

---

# 5. Functional Requirements

The application shall provide the following functionality.

## Authentication

- User registration
- User login
- User logout
- JWT authentication
- HTTP-only authentication cookies

---

## Matchmaking

- Random matchmaking
- FIFO queue
- One active game per user
- One active WebSocket connection per user

---

## Gameplay

- Real-time synchronization
- Server-authoritative move validation
- Legal move enforcement using chess.js
- Pawn promotion
- Castling
- En passant
- Check
- Checkmate
- Stalemate
- Draw by agreement
- Player resignation
- Abort game before moves are played
- Illegal move rejection
- Move history
- Game result recording

---

## Reconnection

- Allow disconnected users to reconnect within 60 seconds.
- Automatically restore the latest game state.
- Continue the game without data loss.

---

## Persistence

Persist the following information.

- Game metadata
- Current board position (FEN)
- Complete move history
- Player assignments
- Game status
- Winner
- Draw reason
- Move timestamps
- Creation and completion timestamps

---

## Player Statistics

Store and display:

- Games played
- Wins
- Losses
- Draws

---

# 6. Non Functional Requirements

The application should satisfy the following quality attributes.

## Reliability

- Active games survive server crashes.
- Server restart restores all active games.
- Invalid client actions never corrupt game state.

---

## Performance

- WebSocket latency should be minimal.
- Database writes should occur after every accepted move.
- UI updates should feel instantaneous.

---

## Security

- Server validates every move.
- Clients never control board state.
- JWT authentication required.
- Authentication cookies must be HTTP-only.
- Unauthorized users cannot join games.

---

## Maintainability

- Modular architecture
- Clear separation of concerns
- Consistent naming conventions
- Shared TypeScript types
- Reusable services

---

# 7. High-Level Architecture

The application consists of four major components.

- React frontend
- Express REST API
- WebSocket server
- PostgreSQL database

The backend owns the entire game state.

Clients only send user actions.

The server validates those actions using chess.js and broadcasts the resulting state to both players.

---

# 8. Technology Stack

Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

Backend

- Node.js
- Express
- TypeScript
- ws (WebSocket)

Database

- PostgreSQL
- Prisma ORM

Authentication

- JWT
- HTTP-only Cookies

Chess Engine

- chess.js

---

# 9. Assumptions

- Only one active game per player.
- Only one gameplay connection per player.
- Unlimited game duration.
- Internet connection may temporarily disconnect.
- Server may restart unexpectedly.
- The application runs on a single server in Version 1.

---

# 10. Future Enhancements

Potential future improvements include:

- Elo rating system
- Friends system
- Private matches
- Spectator mode
- Chess clocks
- Chat
- Stockfish integration
- Tournaments
- Multiple server deployment
- Redis matchmaking