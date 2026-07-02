# Database Schema

## 1. Overview

The application uses PostgreSQL as the primary database and Prisma as the ORM.

The database is responsible for storing:

- User accounts
- Active games
- Completed games
- Move history
- Player statistics

The database is designed to ensure that active games can be restored after an unexpected server shutdown.

---

# 2. Design Goals

The database should satisfy the following goals:

- Keep the schema simple and easy to understand.
- Avoid unnecessary complexity.
- Support crash recovery.
- Preserve completed games permanently.
- Store complete move history.
- Store player statistics.

---

# 3. Entities

Version 1 consists of three primary entities:

- User
- Game
- Move

---

# 4. User

The User table stores account information and player statistics.

Each user can participate in many games but can have only one active game at a time.

## Fields

- id
- username
- email
- passwordHash
- wins
- losses
- draws
- gamesPlayed
- createdAt
- updatedAt

## Constraints

- Username must be unique.
- Email must be unique.
- Passwords must be stored as hashed values.

---

# 5. Game

The Game table stores metadata about each chess game.

A game is created when two players are matched and remains in the database permanently after completion.

## Fields

- id
- whitePlayerId
- blackPlayerId
- currentFen
- status
- result
- winnerId (nullable)
- createdAt
- updatedAt
- finishedAt (nullable)

## Relationships

- One white player
- One black player
- Many moves

---

## Game Status

Possible values:

- WAITING
- ACTIVE
- FINISHED

---

## Game Result

Possible values:

- WHITE_WIN
- BLACK_WIN
- DRAW
- ABORTED

---

# 6. Move

Every legal move is stored as a separate row.

This allows easy replay, debugging, and future game analysis.

## Fields

- id
- gameId
- moveNumber
- from
- to
- san
- fenAfterMove
- createdAt

---

# 7. Relationships

```
User
│
├── Plays many Games

Game
│
├── Has many Moves

Move
│
└── Belongs to one Game
```

---

# 8. Crash Recovery

After every valid move:

- Store the move.
- Update the game's current FEN.
- Update the game's updatedAt timestamp.

If the server crashes:

1. Load every game whose status is ACTIVE.
2. Recreate the chess board using currentFen.
3. Wait for players to reconnect.
4. Resume the game.

No moves are lost.

---

# 9. Player Statistics

When a game finishes, update:

- gamesPlayed
- wins
- losses
- draws

Statistics are stored directly in the User table for fast profile loading.

---

# 10. Database Indexes

The following fields should be indexed.

## User

- email
- username

## Game

- status
- whitePlayerId
- blackPlayerId

## Move

- gameId

---

# 11. Data Integrity Rules

The backend must ensure:

- Every move belongs to an existing game.
- Every game has exactly two players.
- Illegal moves are never stored.
- Finished games cannot accept additional moves.
- Player statistics are updated only after the game is completed.

---

# 12. Version 1 Scope

The following features are intentionally excluded:

- Elo ratings
- Friends
- Private rooms
- Spectator mode
- Chat
- Chess clocks
- Tournaments
- Notifications
- Multiple server support