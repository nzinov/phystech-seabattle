import deepcopy from 'deepcopy';
import type { GameState, GameConfig } from './game';

export interface TutorialMove {
  type: 'move' | 'ready' | 'skip' | 'block';
  from?: [number, number];
  to?: [number, number];
  mode?: string;
  coords?: [number, number][];
  expectedHighlight?: [Position, string][];
  expectedHighlightClasses?: [Position, string][];
}

type Position = [number, number];

export interface TutorialStep {
  description: string;
  state: GameState;
  moves: TutorialMove[];
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
    description:
      'Размещение кораблей происходит только в первых рядах перед вашим фортом. ' +
      'Перетащите крейсер на отмеченную клетку. В реальной игре после расстановки следует нажать «Готов».',
    state: deepcopy(stepPlacement),
    moves: [
      {
        type: 'move',
        from: [0, 1],
        to: [1, 1],
        mode: 'm',
        expectedHighlight: [
          [[0, 1], 'rgba(59, 130, 246, 0.4)'], // source cell - blue
          [[1, 1], 'rgba(34, 197, 94, 0.4)'], // target cell - green
        ],
        expectedHighlightClasses: [
          [[0, 1], 'tutorial-highlight-source'], // source cell - pulsing blue
          [[1, 1], 'tutorial-highlight-target'], // target cell - pulsing green
        ],
      },
    ],
  },
  {
    description:
      'Большинство кораблей ходит на одну клетку по горизонтали или вертикали. ' +
      'Передвиньте крейсер вперёд.',
    state: deepcopy(stepMove),
    moves: [
      {
        type: 'move',
        from: [1, 1],
        to: [2, 1],
        mode: 'm',
        expectedHighlight: [
          [[1, 1], 'rgba(59, 130, 246, 0.4)'], // source cell
          [[2, 1], 'rgba(34, 197, 94, 0.4)'], // target cell
        ],
        expectedHighlightClasses: [
          [[1, 1], 'tutorial-highlight-source'], // source cell - pulsing blue
          [[2, 1], 'tutorial-highlight-target'], // target cell - pulsing green
        ],
      },
    ],
  },
  {
    description:
      'Некоторые корабли зависят от покровителей. Торпеда может двигаться только оставаясь рядом с катером. ' +
      'Сделайте ход торпедой, сохраняя соседство.',
    state: deepcopy(stepDependent),
    moves: [
      {
        type: 'move',
        from: [1, 2],
        to: [2, 2],
        mode: 'm',
        expectedHighlight: [
          [[1, 2], 'rgba(59, 130, 246, 0.4)'], // source cell
          [[2, 2], 'rgba(34, 197, 94, 0.4)'], // target cell
        ],
        expectedHighlightClasses: [
          [[1, 2], 'tutorial-highlight-source'], // source cell - pulsing blue
          [[2, 2], 'tutorial-highlight-target'], // target cell - pulsing green
        ],
      },
    ],
  },
  {
    description:
      'Чтобы атаковать, перетащите корабль на вражескую клетку и выберите действие ⚔️. ' +
      'Попробуйте уничтожить сторожевой корабль.',
    state: deepcopy(stepAttack),
    moves: [
      {
        type: 'move',
        from: [2, 1],
        to: [3, 1],
        mode: 'a',
        expectedHighlight: [
          [[2, 1], 'rgba(59, 130, 246, 0.4)'], // source cell
          [[3, 1], 'rgba(239, 68, 68, 0.4)'], // attack target - red
        ],
        expectedHighlightClasses: [
          [[2, 1], 'tutorial-highlight-source'], // source cell - pulsing blue
          [[3, 1], 'tutorial-highlight-attack'], // attack target - pulsing red
        ],
      },
    ],
  },
  {
    description:
      'Несколько одинаковых кораблей могут объединиться в блок и атаковать одной силой. ' +
      'Сначала атакуйте линкор крейсером, затем выберите блок из двух крейсеров.',
    state: deepcopy(stepAttackBlock),
    moves: [
      {
        type: 'move',
        from: [2, 1],
        to: [3, 1],
        mode: 'a',
        expectedHighlight: [
          [[2, 1], 'rgba(59, 130, 246, 0.4)'], // source cell
          [[3, 1], 'rgba(239, 68, 68, 0.4)'], // attack target - red
        ],
        expectedHighlightClasses: [
          [[2, 1], 'tutorial-highlight-source'], // source cell - pulsing blue
          [[3, 1], 'tutorial-highlight-attack'], // attack target - pulsing red
        ],
      },
      {
        type: 'block',
        coords: [
          [2, 1],
          [2, 2],
        ],
        expectedHighlight: [
          [[2, 1], 'rgba(168, 85, 247, 0.4)'], // block cells - purple
          [[2, 2], 'rgba(168, 85, 247, 0.4)'],
        ],
        expectedHighlightClasses: [
          [[2, 1], 'tutorial-highlight-block'], // block cells - pulsing purple
          [[2, 2], 'tutorial-highlight-block'],
        ],
      },
    ],
  },
  {
    description:
      'Самолёт стреляет по прямой на любое расстояние, пока рядом находится авианосец. ' +
      'Перетащите самолёт на цель и выберите действие выстрела.',
    state: deepcopy(stepShoot),
    moves: [
      {
        type: 'move',
        from: [1, 3],
        to: [3, 3],
        mode: 's',
        expectedHighlight: [
          [[1, 3], 'rgba(59, 130, 246, 0.4)'], // source cell
          [[3, 3], 'rgba(239, 68, 68, 0.4)'], // shoot target - red
        ],
        expectedHighlightClasses: [
          [[1, 3], 'tutorial-highlight-source'], // source cell - pulsing blue
          [[3, 3], 'tutorial-highlight-attack'], // shoot target - pulsing red
        ],
      },
    ],
  },
  {
    description: 'Атомная бомба уничтожает всё вокруг себя. Активируйте её прямо в текущей клетке.',
    state: deepcopy(stepExplode),
    moves: [
      {
        type: 'move',
        from: [2, 2],
        to: [2, 2],
        mode: 'e',
        expectedHighlight: [
          [[2, 2], 'rgba(239, 68, 68, 0.6)'], // explode cell - bright red
        ],
        expectedHighlightClasses: [
          [[2, 2], 'tutorial-highlight-attack'], // explode cell - pulsing red
        ],
      },
    ],
  },
  {
    description:
      'Если в фазе атаки нет выгодных ходов, можно пропустить атаку. ' +
      'Кнопка «Пропустить ход» доступна только в фазе атаки, после совершения хода. ' +
      'Нажмите её, чтобы завершить урок.',
    state: deepcopy(stepSkip),
    moves: [
      {
        type: 'skip',
        expectedHighlight: [], // No specific cell highlighting for skip
        expectedHighlightClasses: [], // No CSS classes for skip
      },
    ],
  },
];
