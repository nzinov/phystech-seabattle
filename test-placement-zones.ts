// Test placement zones with the refactored GameConfig

import { getPlacementZone, DefaultGameConfig, MiniGameConfig, GameConfig } from './src/Game';

console.log('=== Testing Placement Zones ===\n');

// Test default config (14x14, zone size 5)
console.log('Default Config (14x14, zone size 5):');
console.log('Player 0 zone:', getPlacementZone(DefaultGameConfig, 0)); // [0, 5]
console.log('Player 1 zone:', getPlacementZone(DefaultGameConfig, 1)); // [9, 14]

// Test mini config (10x10, zone size 3)
console.log('\nMini Config (10x10, zone size 3):');
console.log('Player 0 zone:', getPlacementZone(MiniGameConfig, 0)); // [0, 3]
console.log('Player 1 zone:', getPlacementZone(MiniGameConfig, 1)); // [7, 10]

// Test custom config (8x8, zone size 2)
const customConfig: GameConfig = {
  fieldSize: 8,
  placementZoneSize: 2,
  initialShips: [['F', 1]],
};
console.log('\nCustom Config (8x8, zone size 2):');
console.log('Player 0 zone:', getPlacementZone(customConfig, 0)); // [0, 2]
console.log('Player 1 zone:', getPlacementZone(customConfig, 1)); // [6, 8]

// Test edge case (6x6, zone size 1)
const tinyConfig: GameConfig = {
  fieldSize: 6,
  placementZoneSize: 1,
  initialShips: [['F', 1]],
};
console.log('\nTiny Config (6x6, zone size 1):');
console.log('Player 0 zone:', getPlacementZone(tinyConfig, 0)); // [0, 1]
console.log('Player 1 zone:', getPlacementZone(tinyConfig, 1)); // [5, 6]

console.log('\n=== All tests completed ===');