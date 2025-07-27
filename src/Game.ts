import { INVALID_MOVE, TurnOrder } from 'boardgame.io/core';
import deepcopy from 'deepcopy';
import type { Ctx } from 'boardgame.io';

const SIZE = 14;

type Position = [number, number];

interface Ship {
  type: string;
  player: number;
  state?: any;
  label?: any;
}

interface GameState {
  cells: (Ship | null)[][];
  log: any[];
  phase: string;
  ready: number;
  usedBrander: number[];
  attackFrom?: Position;
  attackTo?: Position;
  attackBlock?: any;
  responseBlock?: any;
}

interface ActionContext {
  G: GameState;
  ctx: Ctx;
  events?: any;
  playerID?: string;
}

interface ShipDefinition {
  actions: {
    place: any[];
    move: any[];
    attack: any[];
  };
  maxMove: number;
  strength?: number;
  patron?: string;
  canShoot?: (G: GameState, player: number, from: Position, to: Position) => boolean;
  onAttack?: (ctx: ActionContext, from: Position, to?: Position) => void;
  onShoot?: (ctx: ActionContext, from: Position, to?: Position) => void;
  shoot?: (ctx: ActionContext, from: Position, to: Position) => void;
  blastRadius?: number;
  blastSquare?: (G: GameState, pos: Position) => void;
  compare?: (target: Ship | null) => number;
}

function addLog(G: GameState, type: string, from?: Position, to?: Position, options?: any): void {
  options = options || {};
  G.log.push({ type, from, to, ...options });
}

function valid(pos: Position): boolean {
  return 0 <= pos[0] && pos[0] < SIZE && 0 <= pos[1] && pos[1] < SIZE;
}

function vector(from: Position, to: Position): Position {
  return [to[0] - from[0], to[1] - from[1]];
}

function isStraight(from: Position, to: Position): boolean {
  let v = vector(from, to);
  return v[0] == 0 || v[1] == 0;
}

export function dist(from: Position, to: Position): number {
  return Math.abs(from[0] - to[0]) + Math.abs(from[1] - to[1]);
}

function getPos(G: GameState, pos: Position): Ship | null {
  return G.cells[pos[0]][pos[1]];
}

function setPos(G: GameState, pos: Position, fig: Ship | null): void {
  G.cells[pos[0]][pos[1]] = fig;
}

function checkSide(G: GameState, player: number, pos: Position): boolean {
  //return true; // TODO: just for testing
  let low = player == 1 ? 9 : 0;
  let high = player == 1 ? 14 : 5;
  return low <= pos[0] && pos[0] < high;
}

function patronNear(G: GameState, type: string, player: number, pos: Position): boolean {
  for (let dx = -1; dx < 2; ++dx) {
    for (let dy = -1; dy < 2; ++dy) {
      let newPos: Position = [pos[0] + dx, pos[1] + dy];
      if (valid(newPos)) {
        let ship = getPos(G, newPos);
        if (ship && ship.player == player && (ship.type == type || ship.type == 'Tp')) {
          return true;
        }
      }
    }
  }
  return false;
}

function checkPatron(G: GameState, player: number, ship: any, from: Position): boolean {
  return !(ship?.patron && !patronNear(G, ship.patron, player, from));
}

function checkPath(
  G: GameState,
  forceEmpty: boolean,
  forcePatron: string | boolean,
  player: number,
  from: Position,
  to: Position
): boolean {
  let v = vector(from, to);
  let dx = Math.sign(v[0]);
  let dy = Math.sign(v[1]);
  if (dx == 0 && dy == 0) {
    return true;
  }
  if (forceEmpty && getPos(G, from)) {
    return false;
  }
  if (forcePatron && !patronNear(G, forcePatron as string, player, from)) {
    return false;
  }
  if (dx != 0 && checkPath(G, true, forcePatron, player, [from[0] + dx, from[1]], to)) {
    return true;
  }
  if (dy != 0 && checkPath(G, true, forcePatron, player, [from[0], from[1] + dy], to)) {
    return true;
  }
  return false;
}

export function checkBlock(
  G: GameState,
  player: number,
  type: string,
  size: number,
  coords: Position[]
): boolean {
  if (size < 1 || size > 3 || size != coords.length) {
    return false;
  }
  if (!Ships[type].strength) {
    return false;
  }
  for (let i = 1; i < coords.length; ++i) {
    if (dist(coords[i - 1], coords[i]) != 1) {
      return false;
    }
  }
  if (size == 3 && dist(coords[0], coords[1]) == 0) {
    return false;
  }
  let block = [];
  for (let coord of coords) {
    if (!valid(coord)) {
      return false;
    }
    let sq = getPos(G, coord);
    if (!sq || sq.player != player) {
      return false;
    }
    block.push(sq.type);
  }
  function matchBlock(block: any[], pattern: any[]) {
    return (
      block.length == pattern.length &&
      block
        .slice()
        .sort()
        .every((el, i) => el == pattern[i])
    );
  }

  console.log(type, block);
  console.log(
    block.every(el => el == type),
    block.every(el => [type, 'Rd'].includes(el)) &&
      Ships[type]?.strength! <= Ships['Rd']?.strength!,
    type == 'Es' && matchBlock(block, ['Rd', 'St']),
    type == 'Es' &&
      matchBlock(block, ['Es', 'Rd', 'St']) &&
      Math.abs(block.indexOf('Rd') - block.indexOf('St')) == 1
  );
  return (
    block.every(el => el == type) ||
    (block.every(el => [type, 'Rd'].includes(el)) &&
      Ships[type]?.strength! <= Ships['Rd']?.strength!) ||
    (type == 'Es' && matchBlock(block, ['Rd', 'St'])) ||
    (type == 'Es' &&
      matchBlock(block, ['Es', 'Rd', 'St']) &&
      Math.abs(block.indexOf('Rd') - block.indexOf('St')) == 1)
  );
}

export function getBlocks(G: GameState, player: number, coord: Position): any[] {
  let blocks: any[] = [];
  blocks.push([coord]);
  for (let dx = -1; dx < 2; ++dx) {
    for (let dy = -1; dy < 2; ++dy) {
      if (dx == 0 && dy == 0) {
        continue;
      }
      if (dx == 0 || dy == 0) {
        blocks.push([coord, [coord[0] + dx, coord[1] + dy]]);
        blocks.push([
          coord,
          [coord[0] + dx, coord[1] + dy],
          [coord[0] + 2 * dx, coord[1] + 2 * dy],
        ]);
        if (dx >= 0 && dy >= 0) {
          blocks.push([[coord[0] - dx, coord[1] - dy], coord, [coord[0] + dx, coord[1] + dy]]);
        }
      } else {
        blocks.push([coord, [coord[0] + dx, coord[1]], [coord[0] + dx, coord[1] + dy]]);
        blocks.push([coord, [coord[0], coord[1] + dy], [coord[0] + dx, coord[1] + dy]]);
        blocks.push([[coord[0] + dx, coord[1]], coord, [coord[0], coord[1] + dy]]);
      }
    }
  }
  let validBlocks = [];
  for (let block of blocks) {
    for (let type in Ships) {
      if (checkBlock(G, player, type, block.length, block)) {
        validBlocks.push({ type: type, size: block.length, coords: block });
      }
    }
  }
  return validBlocks;
}

function getBlockStrength(block: any): number {
  return block.size * Ships[block.type]?.strength!;
}

function battle(
  { G, ctx, events }: ActionContext,
  res: number,
  from: Position,
  to: Position,
  fromBlock: any,
  toBlock: any
): void {
  //addLog(ctx, 'battle', from, to, {fromShip: getPos(G, from).type, toShip: getPos(G, to).type, res});
  if (Math.abs(res) < 1e-7) {
    Effects.Draw({ G, _ctx: ctx, events }, fromBlock, toBlock);
  } else if (res > 0) {
    Effects.Win({ G, ctx, events }, from, to);
  } else {
    Effects.Loose({ G, _ctx: ctx, events }, from, to);
  }
}

const Actions = {
  Place: {
    canFrom(G, player, from) {
      return checkSide(G, player, from);
    },
    can(G, player, from, to) {
      return dist(from, to) > 0 && checkSide(G, player, to);
    },
    take({ G, _ctx }, from, to) {
      let tmp = getPos(G, from);
      setPos(G, from, getPos(G, to));
      setPos(G, to, tmp);
    },
  },
  Move: {
    canFrom(G, player, from) {
      let ship = getShip(G, from);
      return checkPatron(G, player, ship, from);
    },
    can(G, player, from, to) {
      let ship = getShip(G, from);
      return (
        !getPos(G, to) &&
        dist(from, to) <= ship.maxMove &&
        checkPatron(G, player, ship, to) &&
        checkPath(G, false, ship.patron, player, from, to)
      );
    },
    take({ G, _ctx, events }, from, to) {
      setPos(G, to, getPos(G, from));
      setPos(G, from, null);
      events.endStage();
      addLog(G, 'move', from, to);
    },
    key: 'm',
    name: 'Move',
  },
  Attack: {
    canFrom(G, player, from) {
      let ship = getShip(G, from);
      return checkPatron(G, player, ship, from);
    },
    can(G, player, from, to) {
      let opponent = getPos(G, to);
      return opponent && opponent.player != player && dist(from, to) == 1;
    },
    take({ G, ctx, events }, from, to) {
      addLog(G, 'attack', from, to);
      if (getPos(G, to).player == -1) {
        getPos(G, to).player = ctx.currentPlayer;
        events.endTurn();
        return;
      }
      let fig = getPos(G, from);
      let targetFig = getPos(G, to);
      let ship = getShip(G, from);
      let targetShip = getShip(G, to);
      if (targetShip.onAttack) {
        targetShip.onAttack({ G, ctx, events }, from, to);
        return;
      }
      if (targetShip.compare) {
        addLog(G, 'response', null, null, { size: 1, ship_type: targetFig.type });
        let res = targetShip.compare(fig);
        battle({ G, ctx, events }, -res, from, to, [from], [to]);
        return;
      }
      G.attackFrom = from;
      G.attackTo = to;
      let isBlockableFrom = !!ship.strength;
      if (!isBlockableFrom) {
        G.attackBlock = 'not_required';
      }
      events.setActivePlayers({
        currentPlayer: isBlockableFrom && 'attackBlock',
        others: 'responseBlock',
        revert: true,
        moveLimit: 1,
      });
    },
    key: 'a',
    name: 'Attack',
  },
  Explode: {
    canFrom(_G, _player, _from) {
      return true;
    },
    can(_G, _player, from, to) {
      return dist(from, to) == 0;
    },
    take({ G, ctx, events }, from, to) {
      Effects.Explode({ G }, from, to);
      repeatTurn({ ctx, events });
    },
    key: 'e',
    name: 'Explode',
  },
  Shoot: {
    canFrom(G, player, from) {
      let ship = getShip(G, from);
      return checkPatron(G, player, ship, from);
    },
    can(G, player, from, to) {
      let ship = getShip(G, from);
      return (
        checkPatron(G, player, ship, from) &&
        getPos(G, to) &&
        getPos(G, to).player != player &&
        ship.canShoot(G, player, from, to)
      );
    },
    take({ G, ctx, events, playerID }, from, to) {
      let ship = getShip(G, from);
      addLog(G, 'shoot', from, to, { ship: getPos(G, from) });
      ship.shoot({ G, ctx, events, playerID }, from, to);
    },
    key: 's',
    name: 'Shoot',
  },
  RocketShootArea: {
    canFrom(G, player, from) {
      let ship = getShip(G, from);
      return checkPatron(G, player, ship, from);
    },
    can(G, player, from, to) {
      let ship = getShip(G, from);
      return (
        checkPatron(G, player, ship, from) &&
        dist(from, to) > 0 &&
        Actions.RocketShootArea.canShoot(G, player, from, to)
      );
    },
    canShoot(G, player, from, to) {
      return isStraight(from, to) && dist(from, to) <= 2;
    },
    take({ G, ctx, events }, from, to) {
      addLog(G, 'shoot', from, to, { ship: getPos(G, from), area: true });
      Effects.Explode({ G }, from, to);
      repeatTurn({ ctx, events });
    },
    key: 'r',
    name: 'Shoot with area damage',
  },
};

function repeatTurn({ events }: { ctx: Ctx; events: any }) {
  events.endTurn();
}

const Effects = {
  Die({ G }, pos) {
    let sq = getPos(G, pos);
    if (!sq) {
      return;
    }
    addLog(G, 'die', pos, pos, { ship: sq });
    setPos(G, pos, null);
  },
  Win({ G, ctx, events }, _from, to) {
    Effects.Die({ G }, to);
    repeatTurn({ ctx, events });
  },
  Loose({ G, _ctx, events }, from, _to) {
    Effects.Die({ G }, from);
    events.endTurn();
  },
  Draw({ G, _ctx, events }, fromBlock, toBlock) {
    fromBlock.forEach(el => Effects.Die({ G }, el));
    toBlock.forEach(el => Effects.Die({ G }, el));
    events.endTurn();
  },
  Explode({ G }, from, to) {
    let ship = getShip(G, from);
    addLog(G, 'explode', from, to, { ship: getPos(G, from) });
    Effects.Die({ G }, from);
    for (let dx = -ship.blastRadius; dx <= ship.blastRadius; ++dx) {
      for (let dy = -ship.blastRadius; dy <= ship.blastRadius; ++dy) {
        let newPos: Position = [to[0] + dx, to[1] + dy];
        if (valid(newPos)) {
          ship.blastSquare(G, newPos);
        }
      }
    }
  },
  ExplodeMine({ G, ctx, events }, from, to) {
    if (getPos(G, from)?.type != 'Tr') {
      Effects.Die({ G }, from);
      Effects.Die({ G }, to);
      events.endTurn();
    } else {
      Effects.Die({ G }, to);
      repeatTurn({ ctx, events });
    }
  },
  ExplodeSm({ G, _ctx, events }, from, to) {
    Effects.Die({ G }, from);
    Effects.Die({ G }, to);
    events.endTurn();
  },
  ExplodeBomb({ G, ctx, events }, from, to) {
    if (getPos(G, from)?.type != 'Tr') {
      Effects.Die({ G }, from);
      Effects.Explode({ G }, to, to);
      events.endTurn();
    } else {
      Effects.Die({ G }, to);
      repeatTurn({ ctx, events });
    }
  },
};

const BaseShip = {
  actions: {
    place: [Actions.Place],
    move: [Actions.Move],
    attack: [],
  },
  maxMove: 1,
};

const AttackingShip = {
  actions: {
    place: [Actions.Place],
    move: [Actions.Move, Actions.Attack],
    attack: [Actions.Attack],
  },
  maxMove: 1,
};

const Missile = {
  actions: {
    place: [Actions.Place],
    move: [Actions.Move, Actions.Shoot],
    attack: [],
  },
  maxMove: 1,
  onAttack: Effects.ExplodeMine,
  shoot({ G, ctx, events }, from, to) {
    Effects.Die({ G }, from);
    if (getPos(G, to).type == 'F') {
      events.endTurn();
    } else {
      let targetShip = getShip(G, to);
      if (targetShip?.onShoot) {
        targetShip.onShoot({ G, ctx, events }, from, to);
      }
      Effects.Die({ G }, to);
      repeatTurn({ ctx, events });
    }
  },
};

const Bomb = {
  actions: {
    place: [Actions.Place],
    move: [Actions.Move, Actions.Explode],
    attack: [false, Actions.Explode],
  },
  maxMove: 1,
  onAttack: Effects.ExplodeBomb,
  onShoot: Effects.ExplodeBomb,
};

const Ships: Record<string, ShipDefinition> = {
  Av: { ...AttackingShip, strength: 11.390625 },
  Sm: {
    ...Missile,
    patron: 'Av',
    canShoot(G, player, from, to) {
      let v = vector(from, to);
      return isStraight(from, to) || Math.abs(v[0]) == Math.abs(v[1]);
    },
    onAttack: ({ G, ctx, events }: ActionContext, from: Position, to?: Position) =>
      Effects.ExplodeSm({ G, _ctx: ctx, events }, from, to),
  },
  Lk: { ...AttackingShip, strength: 7.59375 },
  Rk: {
    actions: {
      place: [Actions.Place],
      move: [Actions.Move, Actions.Shoot, Actions.RocketShootArea],
      attack: [],
    },
    maxMove: 1,
    onAttack: Effects.ExplodeMine,
    patron: 'KrPl',
    canShoot: (G, player, from, to) => isStraight(from, to) && dist(from, to) <= 3,
    blastRadius: 1,
    blastSquare(G, pos) {
      Effects.Die({ G }, pos);
    },
  },
  Kr: { ...AttackingShip, strength: 5.0625 },
  T: {
    ...Missile,
    maxMove: 2,
    patron: 'Tk',
    canShoot: (G, player, from, to) =>
      dist(from, to) <= 4 && isStraight(from, to) && checkPath(G, false, false, player, from, to),
  },
  Rd: { ...AttackingShip, strength: 5 },
  Mn: { ...BaseShip, patron: 'Es', onAttack: Effects.ExplodeMine },
  Es: { ...AttackingShip, strength: 3.375 },
  Br: {
    ...Missile,
    canShoot: (G, player, from, to) => !G.usedBrander[player] && dist(from, to) == 1,
    shoot({ G, playerID }: ActionContext, from: Position, to: Position) {
      G.usedBrander[parseInt(playerID!)] = 2;
      getPos(G, to)!.player = parseInt(playerID!);
    },
  },
  KrPl: {
    ...AttackingShip,
    compare(ship) {
      if (ship.type == 'KrPl') return 0;
      if (['Kr', 'Rd', 'Es'].includes(ship.type)) return -1;
      return 1;
    },
  },
  AB: {
    ...Bomb,
    blastRadius: 2,
    blastSquare(G, pos) {
      Effects.Die({ G }, pos);
    },
  },
  St: { ...AttackingShip, strength: 2.25 },
  NB: {
    ...Bomb,
    blastRadius: 2,
    blastSquare(G, pos) {
      let ship = getPos(G, pos);
      if (ship) ship.player = -1;
    },
  },
  Tk: { ...AttackingShip, maxMove: 2, strength: 1.5 },
  F: {
    actions: { place: [Actions.Place], move: [], attack: [] },
    maxMove: 0,
    onAttack({ G, ctx, events }, from, to) {
      Effects.Win({ G, ctx, events }, from, to);
    },
  },
  Tr: { ...AttackingShip, strength: 1 },
  Tp: {
    ...AttackingShip,
    compare(ship) {
      if (ship.type == 'Tp') return 0;
      return -1;
    },
  },
  Pl: {
    ...AttackingShip,
    compare(ship) {
      if (ship.type == 'Pl') return 0;
      if (['Lk', 'Tp'].includes(ship.type)) return 1;
      return -1;
    },
  },
};

export const InitialShips = [
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
];

function getShip(G: GameState, from: Position): ShipDefinition | undefined {
  return Ships[getPos(G, from)?.type];
}

export function getStageActions(G: GameState, ctx: any, stage: string, from: Position): any[] {
  let ship = getShip(G, from);
  if (!ship) {
    return [];
  }
  if (!ctx.activePlayers) {
    return [];
  }
  return ship.actions[stage] || [];
}

export function getActions(G: GameState, ctx: Ctx, player: string, from: Position) {
  if (getPos(G, from)?.player != parseInt(player) || !ctx.activePlayers) {
    return [];
  }
  let stage = ctx.activePlayers[player];
  if (!stage) {
    return [];
  }
  return getStageActions(G, ctx, stage, from);
}

export function getModeAction(
  G: GameState,
  ctx: Ctx,
  player: string,
  mode: string,
  from: Position
) {
  let actions = getActions(G, ctx, player, from);
  if (!actions) {
    return false;
  }
  let action = actions[0];
  if (mode) {
    action = false;
    for (let a of actions) {
      if (a.key == mode) {
        action = a;
        break;
      }
    }
  }
  return action;
}

function makeMove(
  { G, ctx, playerID, events }: any,
  stage: string,
  mode: string,
  from: Position,
  to: Position
): typeof INVALID_MOVE | void {
  if (!valid(from) || !valid(to)) {
    return INVALID_MOVE;
  }
  let actions = getStageActions(G, ctx, stage, from);
  if (!actions.length) {
    return INVALID_MOVE;
  }
  let action = actions[0];
  if (mode) {
    for (let a of actions) {
      if (a.key == mode) {
        action = a;
        break;
      }
    }
  }
  if (!action.can(G, playerID, from, to)) {
    return INVALID_MOVE;
  }
  action.take({ G, ctx, playerID, events }, from, to);
}

function Ready({ G, events }: any) {
  G.ready++;
  events.endStage();
}

const PlaceMove = (all_data: any, mode: string, from: Position, to: Position) => {
  makeMove(all_data, 'place', mode, from, to);
};
PlaceMove.redact = true;

function Move(all_data: any, mode: string, from: Position, to: Position) {
  makeMove(all_data, 'move', mode, from, to);
}

function Skip({ events }: any) {
  events.endTurn();
}

const AttackMove = (all_data: any, mode: string, from: Position, to: Position) => {
  makeMove(all_data, 'attack', mode, from, to);
};
AttackMove.client = false;

const AttackBlockMove = ({ G, playerID }: any, block: any): typeof INVALID_MOVE | void => {
  if (
    !block.coords.some((el: Position) => dist(el, G.attackFrom!) == 0) ||
    !checkBlock(G, parseInt(playerID!), block.type, block.size, block.coords)
  ) {
    return INVALID_MOVE;
  }
  G.attackBlock = block;
};
AttackBlockMove.redact = true;

const ResponseBlockMove = ({ G, playerID }: any, block: any): typeof INVALID_MOVE | void => {
  if (
    !block.coords.some((el: Position) => dist(el, G.attackTo!) == 0) ||
    !checkBlock(G, parseInt(playerID!), block.type, block.size, block.coords)
  ) {
    return INVALID_MOVE;
  }
  addLog(G, 'response', undefined, undefined, { size: block.size, ship_type: block.type });
  G.responseBlock = block;
};
ResponseBlockMove.redact = true;

const LabelMove = ({ G, playerID }: any, pos: Position, label: string): void => {
  getPos(G, pos)!.label![playerID!] = label;
};
LabelMove.redact = true;
LabelMove.client = false;

export function takeMove(
  G: GameState,
  _ctx: Ctx,
  moves: Record<string, (...args: any[]) => void>,
  mode: string,
  from: Position,
  to: Position
): void {
  if (_ctx.phase == 'place') {
    moves.Place(mode, from, to);
    return;
  }
  let player = getPos(G, from)?.player;
  let stage = _ctx.activePlayers?.[player!];
  if (stage == 'move') {
    moves.Move(mode, from, to);
  } else if (stage == 'attack') {
    moves.Attack(mode, from, to);
  }
}

export const GameRules: any = {
  name: 'PhystechSeaBattle',
  minPlayers: 2,
  maxPlayers: 2,
  setup({ ctx: _ctx }: { ctx: Ctx }): GameState {
    let cells = [];
    for (let x = 0; x < SIZE; ++x) {
      cells.push([]);
      for (let y = 0; y < SIZE; ++y) {
        cells[x].push(null);
      }
    }
    let i = 0;
    for (let el of InitialShips) {
      for (let num = 0; num < (el[1] as number); ++num) {
        cells[Math.floor(i / SIZE)][i % SIZE] = { type: el[0], player: 0, state: {}, label: {} };
        i += 1;
      }
    }
    i = SIZE * SIZE - 1;
    for (let el of InitialShips) {
      for (let num = 0; num < (el[1] as number); ++num) {
        cells[Math.floor(i / SIZE)][i % SIZE] = { type: el[0], player: 1, state: {}, label: {} };
        i -= 1;
      }
    }
    return { cells, ready: 0, usedBrander: [0, 0], log: [], phase: 'place' };
  },
  phases: {
    place: {
      start: true,
      turn: {
        stages: {
          place: { moves: { Ready, Place: PlaceMove } },
        },
      },
      activePlayers: { all: 'place' },
      endIf: ({ G }) => G.ready >= 2,
      next: 'play',
    },
    play: {
      turn: {
        order: TurnOrder.RESET,
        stages: {
          move: { next: 'attack', moves: { Move, Label: LabelMove } },
          attack: { moves: { Attack: AttackMove, Skip, Label: LabelMove } },
          attackBlock: { moves: { AttackBlock: AttackBlockMove, Label: LabelMove } },
          responseBlock: { moves: { ResponseBlock: ResponseBlockMove, Label: LabelMove } },
          wait: { moves: { Label: LabelMove } },
        },
        onBegin({ G }: any) {
          for (let i = 0; i < 2; ++i) {
            G.usedBrander[i] = Math.max(0, G.usedBrander[i] - 1);
          }
        },
        onMove({ G, ctx, events }: any) {
          if (G.attackBlock && G.responseBlock) {
            let ship = getShip(G, G.attackFrom);
            if (ship?.compare) {
              let res = ship.compare(getPos(G, G.attackTo));
              battle(
                { G, ctx, events },
                res,
                G.attackFrom!,
                G.attackTo!,
                [G.attackFrom!],
                [G.attackTo!]
              );
            } else {
              let res = getBlockStrength(G.attackBlock) - getBlockStrength(G.responseBlock);
              battle(
                { G, ctx, events },
                res,
                G.attackFrom!,
                G.attackTo!,
                G.attackBlock.coords,
                G.responseBlock.coords
              );
            }
            G.attackFrom = undefined;
            G.attackTo = undefined;
            G.attackBlock = undefined;
            G.responseBlock = undefined;
          }
        },
      },
      activePlayers: { currentPlayer: 'move', others: 'wait' },
    },
  },
  moves: {},

  endIf: ({ G }: any) => {
    let fortCount = [0, 0];
    for (let i = 0; i < 14; ++i) {
      for (let j = 0; j < 14; ++j) {
        let cell = G.cells[i][j];
        if (cell?.type == 'F' && cell.player != -1) {
          fortCount[cell.player]++;
        }
      }
    }
    if (fortCount[0] == 0 && fortCount[1] == 0) {
      return { winner: undefined };
    }
    for (let i = 0; i < 2; ++i) {
      if (fortCount[i] == 0) {
        return { winner: 1 - i };
      }
    }
  },

  playerView({ G, ctx, playerID }: any): GameState {
    G = deepcopy(G);
    for (let i = 0; i < SIZE; ++i) {
      for (let j = 0; j < SIZE; ++j) {
        if (ctx.phase == 'place' && !checkSide(G, parseInt(playerID), [i, j])) {
          G.cells[i][j] = null;
          continue;
        }
        let cell = G.cells[i][j];
        if (cell && cell.player != parseInt(playerID)) {
          cell.type = cell.player == -1 ? 'Sinking' : 'Unknown';
          cell.state = {};
        }
        if (cell) {
          cell.label = cell.label?.[playerID];
        }
        G.cells[i][j] = cell;
      }
    }
    return G;
  },
  events: {
    endGame: false,
    endPhase: false,
    setPhase: false,
    endTurn: false,
    pass: false,
    setActivePlayers: false,
    endStage: false,
    setStage: false,
  },
  disableUndo: true,
};

export default GameRules;
