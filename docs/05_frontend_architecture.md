# Frontend Architecture

## 1. Overview

The frontend is a React-based single-page application responsible for:

- User authentication UI
- Matchmaking interface
- Real-time chess gameplay rendering
- WebSocket communication with backend
- Displaying game state and move history

The frontend does NOT contain any chess logic or validation.

All game rules are enforced by the server.

---

## 2. Technology Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- WebSocket API

---

## 3. Application Flow

### User Journey

1. User lands on homepage
2. User signs up or logs in
3. User clicks "Play"
4. User enters matchmaking queue
5. Game is created
6. User is redirected to game screen
7. Real-time gameplay begins
8. Game ends or user disconnects

---

## 4. Folder Structure

```
client/
│
├── src/
│
├── components/
│   ├── chess/
│   ├── ui/
│
├── pages/
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── Game.tsx
│   ├── Queue.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useWebSocket.ts
│   ├── useGame.ts
│
├── services/
│   ├── api.ts
│   ├── socket.ts
│
├── store/
│   ├── auth.store.ts
│   ├── game.store.ts
│
├── utils/
│
├── types/
│
├── App.tsx
├── main.tsx
```

---

## 5. Pages

### 5.1 Home Page

- Website landing page
- Contains:
  - Login button
  - Signup button
  - Play button (if authenticated)

---

### 5.2 Login Page

- Email + password login
- On success:
  - Store session via cookies (handled by backend)
  - Redirect to Home

---

### 5.3 Signup Page

- Username, email, password
- Redirect to login after success

---

### 5.4 Queue Page

- Display “Searching for opponent...”
- Show waiting status
- Listen for:
  - GAME_FOUND event

---

### 5.5 Game Page

Main gameplay screen.

Layout:

```
---------------------------------
| Chess Board | Move History   |
|             |                |
|             |                |
---------------------------------
```

Features:

- Chess board interaction
- Move list
- Turn indicator
- Game status (check, checkmate, draw)
- Resign button
- Draw offer button

---

## 6. Chess Board Component

### Responsibilities

- Render 8x8 board
- Render pieces
- Handle click-based movement:
  - Click piece → select
  - Click square → attempt move
- Highlight selected piece
- Highlight valid moves (optional UI only)

### Important Rule

Frontend NEVER validates moves.

It only sends:

```json
MAKE_MOVE
```

---

## 7. State Management

We maintain two main stores:

---

### 7.1 Auth Store

Stores:

- userId
- username
- isAuthenticated

---

### 7.2 Game Store

Stores:

- gameId
- board fen
- move history
- current turn
- player colors
- game status
- opponent info

---

## 8. WebSocket Integration

### Connection Lifecycle

- Connect on app load (if authenticated)
- Reconnect automatically on disconnect
- Authenticate using cookies (handled by backend)

---

### Incoming Events

Frontend listens for:

- GAME_FOUND
- GAME_STATE_UPDATE
- MOVE_REJECTED
- GAME_OVER
- OPPONENT_DISCONNECTED
- OPPONENT_RECONNECTED
- QUEUE_STATUS

---

### Outgoing Events

Frontend sends:

- JOIN_QUEUE
- LEAVE_QUEUE
- MAKE_MOVE
- RESIGN
- OFFER_DRAW
- RESPOND_DRAW

---

## 9. Custom Hooks

### useWebSocket

Responsible for:

- Connecting socket
- Sending events
- Receiving events
- Handling reconnects

---

### useGame

Responsible for:

- Game state updates
- Move handling
- Syncing server state
- UI updates

---

### useAuth

Responsible for:

- Authentication state
- User session handling

---

## 10. UI Principles

- Minimal UI logic in components
- Business logic handled in hooks
- Components are mostly presentational
- State is centralized in stores

---

## 11. Move Handling Flow

1. User clicks piece
2. User clicks destination
3. Frontend sends MAKE_MOVE
4. Server validates move
5. Server responds:
   - MOVE_ACCEPTED → update board
   - MOVE_REJECTED → revert selection

---

## 12. Game State Source of Truth

- Server = authoritative state
- Frontend = visual representation only

Frontend must never:
- Validate chess rules
- Calculate legal moves
- Modify game state independently

---

## 13. Error Handling

Frontend handles:

- WebSocket disconnects
- Invalid moves
- Server errors
- Auth failures

All errors are displayed as UI messages.

---

## 14. Performance Considerations

- Avoid unnecessary re-renders of board
- Memoize chess board components
- Keep WebSocket updates lightweight
- Use efficient state updates for move list

---

## 15. Future Improvements (Not in V1)

- Move animations
- Sound effects
- Premoves
- Drag-and-drop moves
- Chess clocks
- Spectator mode
- Game analysis