// Example of using configurable GameRules

import { createGameRules, DefaultGameConfig, MiniGameConfig, GameConfig } from './src/Game';

// Default configuration (14x14 board)
const defaultGame = createGameRules();
console.log('Default config:', DefaultGameConfig);

// Mini configuration (10x10 board) - this is now the default
const miniGame = createGameRules(MiniGameConfig);
console.log('Mini config:', MiniGameConfig);

// Custom configuration (8x8 board)
const customConfig: GameConfig = {
  fieldSize: 8,
  placementZoneSize: 2, // Player 0: rows 0-1, Player 1: rows 6-7
  initialShips: [
    ['Av', 1],
    ['Kr', 2],
    ['Es', 1],
    ['F', 1],
    ['Tr', 2],
  ],
};

const customGame = createGameRules(customConfig);
console.log('Custom config:', customConfig);

// Test setup with custom config
const gameState = customGame.setup({ ctx: {} as any });
console.log('Game state with custom config:', {
  boardSize: gameState.cells.length,
  config: gameState.config,
  placementZoneSize: gameState.config.placementZoneSize,
});