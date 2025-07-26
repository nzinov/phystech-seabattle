# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based multiplayer board game called "Phystech Sea Battle" (Морской бой по-физтеховски) - a strategic naval battle game with complex rules originally played by students at Moscow Institute of Physics and Technology. Built with React frontend and BoardGame.io framework for turn-based multiplayer gameplay.

## Development Commands

```bash
# Development (starts React dev server with proxy to backend)
npm start

# Production build
npm run build

# Run tests
npm test

# Start production server (serves built app + backend)
npm run serve
```

## Architecture

### Tech Stack
- **Frontend**: React with Create React App
- **Game Engine**: BoardGame.io for turn-based multiplayer logic
- **Backend**: Node.js with Koa server
- **Database**: PostgreSQL (production) / in-memory (development)
- **Real-time**: WebSocket via BoardGame.io's SocketIO
- **UI**: React DnD for drag-and-drop ship movement

### Key Files
- `src/Game.js` - Core game logic, rules, and BoardGame.io game definition
- `src/Board.js` - Main game board UI component with drag-and-drop
- `src/server.js` - Backend server with authentication and database setup
- `src/App.js` - Root React component and BoardGame.io client setup
- `src/Texts.js` - Ship descriptions and game text constants
- `public/figures/` - Ship imagery for 21 different ship types

### Game Architecture
- **Grid-based**: 14x14 board with player sides (rows 0-4 vs 9-13)
- **Ship System**: 21 unique ship types with special abilities and movement patterns
- **Turn Phases**: Move → Attack → Special Actions
- **Block Formation**: Ships can form strategic groups for combat bonuses
- **Authentication**: Token-based player credentials stored in game metadata

### Development Setup
- Development proxy configured to backend on port 8000
- Environment-based database: PostgreSQL (production) vs in-memory (development)
- Node.js 18+ required
- Uses latest package versions (migrated from legacy dependencies)
- **ES Modules**: Project uses `"type": "module"` - all imports must use .js extensions
- **TypeScript Preference**: Always prefer TypeScript over CommonJS when adding new code
- **Migration Complete**: Successfully updated from legacy packages to latest versions
- **API Migration**: Updated to BoardGame.io 0.50.2 API (destructured parameters)

### Package Versions (Updated)
- **BoardGame.io**: 0.50.2 (latest)
- **React**: 19.1.0 with new hooks-based React DnD
- **React DnD**: 16.0.1 (hooks API, not decorator-based)
- **React Tooltip**: 5.29.1 (new API)
- **Universal Cookie**: 8.0.1
- **Koa**: 3.0.0

### Database
Uses PostgreSQL in production (Heroku) with `bgio-postgres` adapter. Game state and player authentication persisted automatically by BoardGame.io framework.

### Code Standards
- **Always use TypeScript** when adding new files or major refactoring
- Use ES modules with explicit .js extensions for local imports
- Prefer modern React patterns (hooks over classes for new components)
- Use BoardGame.io's latest API patterns

### BoardGame.io Import Patterns (ES Modules)
- **All files**: Use `boardgame.io/dist/cjs/[module].js` pattern for BoardGame.io imports
- **Local imports**: Always use `.js` extensions (e.g., `./Component.js`)
- **Consistent module system**: ES modules everywhere with `"type": "module"` in package.json

#### Working Import Examples:
```javascript
// BoardGame.io imports
import { Server } from 'boardgame.io/dist/cjs/server.js';
import { Client } from 'boardgame.io/dist/cjs/react.js';
import { INVALID_MOVE } from 'boardgame.io/dist/cjs/core.js';

// Local imports
import GameRules from './Game.js';
import Board from './Board.js';
```

#### BoardGame.io API Changes (v0.50+)
- **Function signatures**: Changed from `(G, ctx) => {}` to `({ G, ctx }) => {}`
- **All game callbacks** now use destructured parameters
- **Applies to**: `setup`, `moves`, `endIf`, `playerView`, `onMove`, etc.