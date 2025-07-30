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
  placementZoneSize: 0,
  initialShips: [],
};

function emptyCells(size: number) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
}

function baseState(): GameState {
  return {
    cells: emptyCells(tutorialConfig.fieldSize),
    log: [],
    phase: 'play',
    ready: 2,
    usedBrander: [0, 0],
    config: tutorialConfig,
  };
}

const step1State = baseState();
step1State.cells[1][1] = { type: 'Kr', player: 0, state: {}, label: {} } as any;

const step2State = baseState();
step2State.cells[2][1] = { type: 'Kr', player: 0, state: {}, label: {} } as any;
step2State.cells[3][1] = { type: 'St', player: 1, state: {}, label: {} } as any;

export const tutorialSteps: TutorialStep[] = [
  {
    description: 'Переместите крейсер на одну клетку вперёд.',
    state: deepcopy(step1State),
    move: { type: 'move', from: [1, 1], to: [2, 1], mode: 'm' },
  },
  {
    description: 'Атакуйте вражеский корабль.',
    state: deepcopy(step2State),
    move: { type: 'move', from: [2, 1], to: [3, 1], mode: 'a' },
  },
];
