# Coding Standards

## 1. Overview

This document defines coding conventions and structural rules for both frontend and backend.

The goal is to ensure:

- Consistent code style
- Readable architecture
- Easy collaboration
- Maintainability
- Clean separation of concerns

These rules must be followed by everyone who contributes to this repository.

---

## 2. General Principles

All code must follow these principles:

- Keep it simple (KISS)
- Avoid unnecessary abstraction
- Prefer readability over cleverness
- One responsibility per function/module
- No duplication of logic
- Server is the source of truth
- Never trust client input
- Should be simple and look like human-written

---

## 3. Naming Conventions

### Variables

- Use `camelCase`
- Example: `currentGame`, `playerId`

---

### Functions

- Use `camelCase`
- Use verbs for actions
- Example:
  - `createGame()`
  - `makeMove()`
  - `validateMove()`

---

### Classes

- Use `PascalCase`
- Example:
  - `GameSession`
  - `GameManager`
  - `ConnectionManager`

---

### Files

- Use `camelCase` or `kebab-case`
- Prefer kebab-case for consistency in backend

Examples:

- `game-session.ts`
- `matchmaking.manager.ts`

---

## 4. Backend Architecture Rules

### 4.1 Layer Separation

Backend must follow strict layering:

- routes → controllers → managers/services → repositories

Rules:

- Routes: only define endpoints / events
- Controllers: parse input, call services
- Managers: handle business logic coordination
- Services: core logic (chess, persistence)
- Repositories: database access only

---

### 4.2 No Business Logic in:

- routes
- websocket server file
- controllers

---

## 5. Frontend Architecture Rules

### 5.1 Component Types

- UI Components → presentational only
- Hooks → business logic
- Pages → composition layer
- Store → global state

---

### 5.2 State Management

- Game state must be centralized in store
- WebSocket updates must flow through hooks/store
- Components must not directly handle socket events

---

## 6. WebSocket Rules

- All events must follow schema defined in `04_websocket_protocol.md`
- No ad-hoc event creation allowed
- All events must be typed in `/shared`

---

## 7. TypeScript Rules

- Strict mode enabled
- No `any` allowed (except rare utility cases)
- Prefer interfaces over types for objects
- Shared types must be used between frontend and backend

---

## 8. Error Handling

### Backend

- Always return structured errors
- Never crash server due to invalid input
- Use centralized error middleware

### Frontend

- Show user-friendly messages
- Never expose internal server errors

---

## 9. WebSocket Handling Rules

- Each user can have only ONE active connection
- Duplicate connections replace previous ones
- All socket events must be validated server-side
- No direct state mutation from client

---

## 10. Game Logic Rules

- All chess logic lives in `GameSession`
- chess.js is the only rule engine
- Game state must never be modified outside GameSession
- GameManager only coordinates sessions

---

## 11. Database Rules

- Prisma is the only database interface
- No raw SQL unless absolutely necessary
- Repositories must handle all DB operations
- Services must never call Prisma directly

---

## 12. File Organization Rules

### Backend

- One responsibility per file
- Avoid large files (>300 lines)
- Split logic into services if needed

### Frontend

- One component per file
- Keep components small and reusable

---

## 13. Shared Code Rules

- Only types, constants, and enums allowed
- No business logic in `/shared`
- Must be framework-agnostic

---

## 14. Logging Rules

Log only:

- User login/logout
- Matchmaking events
- Game start/end
- Errors

Never log:

- Passwords
- JWT tokens
- Sensitive user data

---

## 15. Performance Rules

- Avoid unnecessary re-renders in React
- Batch WebSocket updates when possible
- Do not persist unnecessary database writes
- Keep socket messages lightweight

---

## 16. Security Rules

- JWT must be verified on every connection
- No trust in client payloads
- Rate limit sensitive endpoints
- Validate all incoming WebSocket messages

---

## 17. Code Style

- Use Prettier for formatting
- Use ESLint for linting
- Consistent indentation (2 spaces)
- Prefer early returns
- Avoid deeply nested code
- Avoid comments in every file

---

## 18. Final Rule

If a rule is not explicitly defined here:

> Choose the simplest and most readable implementation.