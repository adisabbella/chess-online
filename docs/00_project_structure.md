# Project Structure

## 1. Overview

This document defines the overall repository structure for the Online Multiplayer Chess application.

The goal is to maintain a clean separation between frontend, backend, shared logic, and documentation.

This structure is designed for scalability, readability, and ease of development.

---

## 2. Root Directory

The project follows a monorepo structure.

```
chess-online/
│
├── client/
├── server/
├── shared/
├── docs/
├── package.json
├── README.md
├── .gitignore
├── .editorconfig
├── .prettierrc
```

---

## 3. Client (Frontend)

```
client/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── store/
│   ├── utils/
│   ├── types/
│   ├── assets/
│   └── App.tsx
│
├── public/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Responsibility

The client is responsible for:

- User interface
- Chess board rendering
- User interactions (click → move)
- WebSocket communication with server
- Displaying game state and move history

The client must NEVER validate chess rules.

---

## 4. Server (Backend)

```
server/
│
├── src/
│
├── config/
├── controllers/
├── routes/
├── middleware/
├── websocket/
├── managers/
├── sessions/
├── services/
├── repositories/
├── utils/
├── types/
│
├── app.ts
├── server.ts
├── package.json
└── tsconfig.json
```

### Responsibility

The server is responsible for:

- Authentication
- Matchmaking
- Game session management
- Move validation (via chess.js)
- Persistence
- Reconnection handling
- Broadcasting game state

The server is the single source of truth.

---

## 5. Shared (Common Code)

```
shared/
│
├── types/
├── constants/
├── events/
└── utils/
```

### Responsibility

Shared contains code used by both client and server:

- WebSocket event names
- TypeScript types
- Shared enums (GameStatus, MoveType, etc.)
- Utility functions that must remain consistent across frontend and backend

This prevents duplication and type mismatch.

---

## 6. Docs

```
docs/
│
├── 00_project_structure.md
├── 01_project_overview.md
├── 02_backend_architecture.md
├── 03_database_schema.md
├── 04_websocket_protocol.md
├── 05_frontend_architecture.md
├── 06_game_rules.md
├── 07_coding_standards.md
└── 08_milestones.md
```

### Responsibility

The docs folder contains the **single source of truth** for system design.

It defines:

- Architecture
- Data models
- Communication protocols
- Game rules
- Coding standards
- Implementation plan

No code should contradict these documents.

---

## 7. Design Principles

The project follows these principles:

### 1. Separation of Concerns
Frontend, backend, and shared logic are strictly separated.

### 2. Server Authority
The backend owns all game logic and validation.

### 3. Shared Types
All cross-system contracts are defined in `/shared`.

### 4. Stateless Frontend
Frontend only renders state and sends user actions.

### 5. Modular Backend
Backend is divided into:
- Managers (lifecycle control)
- Services (business logic)
- Repositories (database access)

---

## 8. Build Philosophy

This project is designed to:

- Be easy to understand for new developers
- Be robust enough for real-time gameplay
- Recover from crashes without data loss
- Avoid unnecessary complexity in Version 1
- Allow future scaling without rewrites