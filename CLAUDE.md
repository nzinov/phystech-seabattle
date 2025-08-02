# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based multiplayer board game called "Phystech Sea Battle" (Морской бой по-физтеховски) - a strategic naval battle game with complex rules originally played by students at Moscow Institute of Physics and Technology. Built with React frontend and BoardGame.io framework for turn-based multiplayer gameplay.

## Development Commands

```bash
# Development (starts Vite dev server with proxy to backend)
npm start

# Production build
npm run build

# Run tests (using Vitest)
npm test

# Preview production build
npm run preview

# Build server for production
npm run build-server

# Start production server (serves built app + backend)
npm run serve

# Code quality
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run type-check
npm run pre-commit
```

## Architecture

### Tech Stack

- **Frontend**: React 19.1.0 with Vite build system
- **Game Engine**: BoardGame.io 0.50.2 for turn-based multiplayer logic
- **Backend**: Node.js with Koa 3.0.0 server
- **Database**: PostgreSQL (production) / in-memory (development)
- **Real-time**: WebSocket via BoardGame.io's SocketIO
- **UI**: React DnD 16.0.1 for drag-and-drop ship movement
- **Build Tool**: Vite 6.1.1 (replacing Create React App)
- **Testing**: Vitest 3.2.4
- **TypeScript**: Full TypeScript support with strict mode

### Key Files

- `src/Game.ts` - Core game logic, rules, and BoardGame.io game definition
- `src/Board.tsx` - Main game board UI component with drag-and-drop
- `src/server.ts` - Backend server with authentication and database setup
- `src/App.tsx` - Root React component and BoardGame.io client setup
- `src/Texts.ts` - Ship descriptions and game text constants
- `public/figures/` - Ship imagery for 21 different ship types

### Game Architecture

- **Grid-based**: 14x14 board with player sides (rows 0-4 vs 9-13)
- **Ship System**: 21 unique ship types with special abilities and movement patterns
- **Turn Phases**: Move → Attack → Special Actions
- **Block Formation**: Ships can form strategic groups for combat bonuses
- **Authentication**: Token-based player credentials stored in game metadata

### Development Setup

- **Vite Dev Server**: Runs on port 3000 with proxy to backend on port 8000
- **Environment-based database**: PostgreSQL (production) vs in-memory (development)
- **Node.js 18+ required**
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint + Prettier**: Code formatting and linting with pre-commit hooks
- **Husky**: Git hooks for code quality enforcement

### Package Versions (Current)

- **BoardGame.io**: 0.50.2
- **React**: 19.1.0
- **React DnD**: 16.0.1 (hooks API)
- **React Tooltip**: 5.29.1
- **Universal Cookie**: 8.0.1
- **Koa**: 3.0.0
- **Vite**: 6.1.1
- **TypeScript**: 5.8.3
- **Vitest**: 3.2.4

### Database

Uses PostgreSQL in production with `bgio-postgres` adapter. Game state and player authentication persisted automatically by BoardGame.io framework.

### Code Standards

- **TypeScript First**: All new code should be written in TypeScript
- **Strict TypeScript**: Project uses strict mode with noImplicitAny
- **ESLint + Prettier**: Enforced code formatting and linting
- **Modern React**: Hooks-based components, React 19 patterns
- **BoardGame.io 0.50+ API**: Destructured parameters for all game callbacks

### Import Patterns

- **BoardGame.io imports**: Use standard module paths (no /dist/cjs required)
- **Local imports**: Use relative paths with appropriate extensions
- **TypeScript**: Proper type imports where needed

#### Working Import Examples:

```typescript
// BoardGame.io imports
import { Server } from 'boardgame.io/server';
import { Client } from 'boardgame.io/react';
import { INVALID_MOVE, TurnOrder } from 'boardgame.io/core';

// Local imports
import GameRules from './Game';
import Board from './Board';
import type { Position } from './Game';
```

#### BoardGame.io API (v0.50+)

- **Function signatures**: Use destructured parameters `({ G, ctx }) => {}`
- **Type safety**: Full TypeScript support with proper interfaces
- **Applies to**: `setup`, `moves`, `endIf`, `playerView`, `onMove`, etc.
