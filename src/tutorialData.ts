import deepcopy from 'deepcopy';
import type { GameState, GameConfig } from './game';

export interface TutorialMove {
  type: 'move' | 'ready' | 'skip';
  from?: [number, number];
  to?: [number, number];
  mode?: string;
}

export interface TutorialStep {
  description: string;
  state: GameState;
  move: TutorialMove;
}

const tutorialConfig: GameConfig = {
  name: 'Tutorial',
  fieldSize: 5,
  placementZoneSize: 2,
  initialShips: [],
};

function emptyCells(size: number) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
}

function baseState(): GameState {
  const cells = emptyCells(tutorialConfig.fieldSize);
  // Place forts for both players so the game doesn't end immediately
  cells[0][0] = { type: 'F', player: 0, state: {}, label: {} } as any;
  cells[tutorialConfig.fieldSize - 1][tutorialConfig.fieldSize - 1] = {
    type: 'F',
    player: 1,
    state: {},
    label: {},
  } as any;

  return {
    cells,
    log: [],
    phase: 'play',
    ready: 2,
    usedBrander: [0, 0],
    config: tutorialConfig,
  };
}

// Step 1: place a cruiser
const stepPlacement = (() => {
  const s = baseState();
  s.phase = 'place';
  s.ready = 1; // opponent already ready
  s.cells[0][1] = { type: 'Kr', player: 0, state: {}, label: {} } as any;
  return s;
})();

// Step 2: move a cruiser
const stepMove = (() => {
  const s = baseState();
  s.cells[1][1] = { type: 'Kr', player: 0, state: {}, label: {} } as any;
  return s;
})();

// Step 3: move a dependent ship (torpedo with boat)
const stepDependent = (() => {
  const s = baseState();
  s.cells[1][1] = { type: 'Tk', player: 0, state: {}, label: {} } as any;
  s.cells[1][2] = { type: 'T', player: 0, state: {}, label: {} } as any;
  return s;
})();

// Step 4: basic attack
const stepAttack = (() => {
  const s = baseState();
  s.cells[2][1] = { type: 'Kr', player: 0, state: {}, label: {} } as any;
  s.cells[3][1] = { type: 'St', player: 1, state: {}, label: {} } as any;
  return s;
})();

// Step 5: attack using a block
const stepAttackBlock = (() => {
  const s = baseState();
  s.cells[2][1] = { type: 'Kr', player: 0, state: {}, label: {} } as any;
  s.cells[2][2] = { type: 'Kr', player: 0, state: {}, label: {} } as any;
  s.cells[3][1] = { type: 'Lk', player: 1, state: {}, label: {} } as any;
  return s;
})();

// Step 6: shooting from a plane
const stepShoot = (() => {
  const s = baseState();
  s.cells[1][2] = { type: 'Av', player: 0, state: {}, label: {} } as any;
  s.cells[1][3] = { type: 'Sm', player: 0, state: {}, label: {} } as any;
  s.cells[3][3] = { type: 'St', player: 1, state: {}, label: {} } as any;
  return s;
})();

// Step 7: explode a bomb
const stepExplode = (() => {
  const s = baseState();
  s.cells[2][2] = { type: 'AB', player: 0, state: {}, label: {} } as any;
  s.cells[3][2] = { type: 'St', player: 1, state: {}, label: {} } as any;
  return s;
})();

// Step 8: skip turn
const stepSkip = (() => {
  const s = baseState();
  s.cells[0][1] = { type: 'Kr', player: 0, state: {}, label: {} } as any;
  s.cells[4][3] = { type: 'St', player: 1, state: {}, label: {} } as any;
  return s;
})();

export const tutorialSteps: TutorialStep[] = [
  {
    description: 'Разместите крейсер, перетащив его в зону перед фортом.',
    state: deepcopy(stepPlacement),
    move: { type: 'move', from: [0, 1], to: [1, 1], mode: 'm' },
  },
  {
    description: 'Переместите крейсер на одну клетку вперёд.',
    state: deepcopy(stepMove),
    move: { type: 'move', from: [1, 1], to: [2, 1], mode: 'm' },
  },
  {
    description: 'Торпеда ходит только рядом с катером. Передвиньте её вперёд.',
    state: deepcopy(stepDependent),
    move: { type: 'move', from: [1, 2], to: [2, 2], mode: 'm' },
  },
  {
    description: 'Атакуйте сторожевой корабль.',
    state: deepcopy(stepAttack),
    move: { type: 'move', from: [2, 1], to: [3, 1], mode: 'a' },
  },
  {
    description: 'При атаке блоком сила складывается. Нападите двумя крейсерами на линкор.',
    state: deepcopy(stepAttackBlock),
    move: { type: 'move', from: [2, 1], to: [3, 1], mode: 'a' },
  },
  {
    description: 'Самолёт может стрелять по прямой, если рядом авианосец. Выстрелите по цели.',
    state: deepcopy(stepShoot),
    move: { type: 'move', from: [1, 3], to: [3, 3], mode: 's' },
  },
  {
    description: 'Взорвите атомную бомбу.',
    state: deepcopy(stepExplode),
    move: { type: 'move', from: [2, 2], to: [2, 2], mode: 'e' },
  },
  {
    description: 'Если ходить нечем, пропустите ход.',
    state: deepcopy(stepSkip),
    move: { type: 'skip' },
  },
];
