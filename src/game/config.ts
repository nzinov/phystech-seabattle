import type { GameConfig } from './types';

export const DefaultGameConfig: GameConfig = {
  name: 'Default',
  fieldSize: 14,
  placementZoneSize: 5, // Player 0: rows 0-4, Player 1: rows 9-13
  initialShips: [
    ['Av', 1],
    ['Sm', 1],
    ['Lk', 2],
    ['Rk', 1],
    ['Kr', 6],
    ['T', 4],
    ['Rd', 2],
    ['Mn', 7],
    ['Es', 6],
    ['Br', 2],
    ['KrPl', 1],
    ['AB', 1],
    ['St', 7],
    ['NB', 1],
    ['Tk', 6],
    ['F', 2],
    ['Tr', 7],
    ['Tp', 1],
    ['Pl', 4],
  ],
};

export const MiniGameConfig: GameConfig = {
  name: 'Mini',
  fieldSize: 10,
  placementZoneSize: 3, // Player 0: rows 0-2, Player 1: rows 7-9
  initialShips: [
    ['Av', 1],
    ['Sm', 1],
    ['Lk', 1],
    ['Rk', 1],
    ['Kr', 2],
    ['T', 2],
    ['Rd', 1],
    ['Mn', 3],
    ['Es', 3],
    ['Br', 0],
    ['KrPl', 1],
    ['AB', 0],
    ['St', 3],
    ['NB', 0],
    ['Tk', 3],
    ['F', 2],
    ['Tr', 3],
    ['Tp', 1],
    ['Pl', 2],
  ],
};
