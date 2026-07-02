# Game Rules

## 1. Overview

This document defines all chess-related rules and edge-case behavior for the application.

The server is the single authority for enforcing all rules using `chess.js`.

The frontend never enforces or interprets game rules.

---

## 2. Core Rule Engine

All chess rules are handled by:

- chess.js (server-side only)

The server validates:

- Legal moves
- Turn order
- Check conditions
- Checkmate conditions
- Stalemate conditions
- Draw conditions
- Special moves (castling, en passant, promotion)

---

## 3. Move Validation Rules

A move is considered valid only if:

- It is the player's turn
- The move is legal in chess rules
- The game is in ACTIVE state
- The player is part of the game

If any condition fails:
- Move is rejected
- No state update occurs

---

## 4. Special Moves

### 4.1 Castling

Allowed if:

- King and rook have not moved
- No pieces between king and rook
- King is not in check
- King does not pass through check

---

### 4.2 En Passant

Allowed only immediately after opponent's pawn moves two squares.

---

### 4.3 Pawn Promotion

When a pawn reaches the last rank:

- Player must choose promotion piece
- Allowed pieces:
  - Queen
  - Rook
  - Bishop
  - Knight

Default behavior (if not specified):
- Promote to Queen

---

## 5. Game End Conditions

A game ends when any of the following occurs:

---

### 5.1 Checkmate

- King is in check
- No legal moves available

Result:
- Winner is opponent

---

### 5.2 Stalemate

- No legal moves available
- King is NOT in check

Result:
- Draw

---

### 5.3 Resignation

- A player resigns

Result:
- Opponent wins

---

### 5.4 Draw by Agreement

- One player offers draw
- Other player accepts

Result:
- Draw

---

### 5.5 Abandonment (Disconnect Rule)

If a player disconnects:

- Server starts 60 second timer
- If player reconnects within 60 seconds:
  - Game continues
- If not:
  - Player loses OR game is aborted depending on state

Rules:

- If no moves played → game is ABORTED
- If moves played → opponent wins

---

## 6. Illegal Move Handling

If a player attempts an illegal move:

- Move is rejected
- Game state remains unchanged
- Server sends MOVE_REJECTED event

No penalties applied.

---

## 7. Turn Enforcement

- White always starts first
- Players alternate turns strictly
- Out-of-turn moves are rejected

---

## 8. Game State Transitions

### States:

- WAITING
- ACTIVE
- FINISHED
- ABORTED

---

### Transitions:

WAITING → ACTIVE
- When two players are matched

ACTIVE → FINISHED
- Checkmate
- Stalemate
- Resignation
- Draw agreement
- Timeout loss

WAITING → ABORTED
- One player disconnects before first move

---

## 9. Reconnection Rules

If a player reconnects:

- Server identifies user via JWT
- Finds active GameSession
- Restores game state
- Sends full board state (FEN + moves)

Game continues normally.

---

## 10. Move History Rules

Each move must store:

- From square
- To square
- SAN notation
- Move number
- FEN after move

Move history is immutable.

---

## 11. Time Control Rules (V1 Simplified)

Version 1 does NOT include:

- Chess clocks
- Timers per player

Only disconnect timer exists (60 seconds).

---

## 12. Draw Rules (Supported Types)

Supported draws:

- Stalemate
- Mutual agreement
- (Optional via chess.js detection)
  - Threefold repetition
  - Insufficient material
  - Fifty-move rule

These can be enabled via chess.js if needed.

---

## 13. Anti-Cheat Rules

Server enforces:

- No client-side validation
- No board manipulation from client
- No fake moves
- No replayed WebSocket messages

Every move must be validated server-side.

---

## 14. Game Completion Handling

When game ends:

1. Final state is saved
2. Winner/Result is recorded
3. Player stats are updated
4. GameSession is removed from memory
5. Game is marked FINISHED or ABORTED

---

## 15. Edge Cases

### 15.1 Double Move Spam

- Only first valid move is accepted
- Subsequent moves ignored until state updates

---

### 15.2 Simultaneous Disconnect

- If both players disconnect:
  - Game is paused
  - If no reconnection within timeout → abort

---

### 15.3 Server Restart

- Active games restored from database
- FEN used to reconstruct board
- Players reconnected manually

---

## 16. Source of Truth

- chess.js = rule engine
- Server = authority
- Database = persistence layer
- Client = display only

No exceptions.