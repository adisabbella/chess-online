# WebSocket Protocol

## 1. Overview

This document defines the complete WebSocket communication protocol between the client and server.

All real-time gameplay communication happens through WebSockets.

The server is the single source of truth for game state.

Clients only send user actions and render server responses.

---

## 2. Connection Lifecycle

### 2.1 Connection Establishment

When a user connects:

1. Client opens WebSocket connection
2. Server authenticates user using JWT (from cookies)
3. If valid, connection is accepted
4. Connection is registered in ConnectionManager

If invalid:
- Connection is immediately closed

---

### 2.2 Reconnection

If a user disconnects:

- Server keeps session alive for 60 seconds
- User can reconnect using same credentials
- If reconnected:
  - Old socket is replaced
  - Game state is restored

If not reconnected within 60 seconds:
- User is removed from active game
- Game is marked as abandoned or continued based on rules

---

## 3. Message Format

All messages follow this structure:

```json
{
  "type": "event_name",
  "payload": {}
}
```

---

## 4. Client → Server Events

---

### 4.1 JOIN_QUEUE

User joins matchmaking queue.

```json
{
  "type": "JOIN_QUEUE",
  "payload": {}
}
```

### Server Response:
- `QUEUE_JOINED`
- OR `GAME_FOUND`

---

### 4.2 LEAVE_QUEUE

User leaves matchmaking queue.

```json
{
  "type": "LEAVE_QUEUE",
  "payload": {}
}
```

---

### 4.3 MAKE_MOVE

User attempts a chess move.

```json
{
  "type": "MAKE_MOVE",
  "payload": {
    "gameId": "string",
    "from": "e2",
    "to": "e4",
    "promotion": "q" // optional
  }
}
```

### Server Validation:
- Is it user's turn?
- Is move legal (via chess.js)?
- Is game active?

### Server Responses:

Success:
```json
{
  "type": "MOVE_ACCEPTED",
  "payload": {
    "fen": "updated_fen",
    "move": {}
  }
}
```

Failure:
```json
{
  "type": "INVALID_MOVE",
  "payload": {
    "reason": "Illegal move"
  }
}
```

---

### 4.4 RESIGN

User resigns the game.

```json
{
  "type": "RESIGN",
  "payload": {
    "gameId": "string"
  }
}
```

---

### 4.5 OFFER_DRAW

Player offers draw.

```json
{
  "type": "OFFER_DRAW",
  "payload": {
    "gameId": "string"
  }
}
```

---

### 4.6 RESPOND_DRAW

Opponent responds to draw offer.

```json
{
  "type": "RESPOND_DRAW",
  "payload": {
    "gameId": "string",
    "accept": true
  }
}
```

---

## 5. Server → Client Events

---

### 5.1 GAME_FOUND

Sent when matchmaking succeeds.

```json
{
  "type": "GAME_FOUND",
  "payload": {
    "gameId": "string",
    "whitePlayerId": "string",
    "blackPlayerId": "string",
    "color": "white | black",
    "initialFen": "string"
  }
}
```

---

### 5.2 GAME_STATE_UPDATE

Sent after every valid move.

```json
{
  "type": "GAME_STATE_UPDATE",
  "payload": {
    "fen": "string",
    "lastMove": {
      "from": "e2",
      "to": "e4",
      "san": "e4"
    },
    "turn": "white | black"
  }
}
```

---

### 5.3 MOVE_REJECTED

```json
{
  "type": "MOVE_REJECTED",
  "payload": {
    "reason": "string"
  }
}
```

---

### 5.4 GAME_OVER

```json
{
  "type": "GAME_OVER",
  "payload": {
    "result": "WHITE_WIN | BLACK_WIN | DRAW | ABORTED",
    "reason": "CHECKMATE | RESIGN | TIMEOUT | DRAW_AGREEMENT | STALEMATE"
  }
}
```

---

### 5.5 OPPONENT_DISCONNECTED

```json
{
  "type": "OPPONENT_DISCONNECTED",
  "payload": {
    "timeout": 60
  }
}
```

---

### 5.6 OPPONENT_RECONNECTED

```json
{
  "type": "OPPONENT_RECONNECTED",
  "payload": {}
}
```

---

### 5.7 QUEUE_STATUS

```json
{
  "type": "QUEUE_STATUS",
  "payload": {
    "position": 3
  }
}
```

---

## 6. Error Handling

If any invalid message is received:

```json
{
  "type": "ERROR",
  "payload": {
    "message": "Invalid event"
  }
}
```

---

## 7. Game Flow Summary

1. User joins queue
2. Matchmaking pairs players
3. GAME_FOUND sent
4. Players send MAKE_MOVE events
5. Server validates using chess.js
6. GAME_STATE_UPDATE broadcast
7. Repeat until game ends
8. GAME_OVER sent

---

## 8. Rules Enforcement

Server enforces:

- Turn order
- Legal moves only
- Game state consistency
- Promotion rules
- Check/checkmate rules
- Draw rules
- Resignation rules

Clients are never trusted.

---

## 9. Reconnection Flow

When user reconnects:

1. Server identifies user via JWT
2. Finds active game via GameSessionManager
3. Sends current game state
4. Resumes gameplay

No game data is lost.

---

## 10. Design Principle

WebSocket layer must remain:

- Thin
- Stateless
- Event dispatcher only

All logic belongs to:

- GameSession
- GameManager
- Services