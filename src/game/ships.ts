import { Actions } from './actions';
import { Effects } from './effects';
import type { ActionContext, GameState, Position, Ship, ShipDefinition } from './types';
import { checkPath, dist, getPos, isStraight, Ships, vector } from './utils';

function repeatTurn({ ctx, events }: ActionContext) {
  events.endTurn({ next: ctx.currentPlayer });
}

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
  shoot(bgctx: ActionContext, from: Position, to: Position) {
    Effects.Die(bgctx, from);
    if (getPos(bgctx.G, to)?.type == 'F') {
      bgctx.events.endTurn();
    } else {
      let targetShip = Ships[getPos(bgctx.G, to)?.type || ''];
      if (targetShip?.onShoot) {
        targetShip.onShoot(bgctx, from, to);
      }
      Effects.Die(bgctx, to);
      repeatTurn(bgctx);
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

// Populate the Ships object
Object.assign(Ships, {
  Av: { ...AttackingShip, strength: 11.390625 },
  Sm: {
    ...Missile,
    patron: 'Av',
    canShoot(G: GameState, player: number, from: Position, to: Position) {
      let v = vector(from, to);
      return isStraight(from, to) || Math.abs(v[0]) == Math.abs(v[1]);
    },
    onAttack: (bgctx: ActionContext, from: Position, to: Position) =>
      Effects.ExplodeSm(bgctx, from, to),
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
    canShoot: (G: GameState, player: number, from: Position, to: Position) =>
      isStraight(from, to) && dist(from, to) <= 3,
    blastRadius: 1,
    blastSquare(bgctx: ActionContext, pos: Position) {
      Effects.Die(bgctx, pos);
    },
  },
  Kr: { ...AttackingShip, strength: 5.0625 },
  T: {
    ...Missile,
    maxMove: 2,
    patron: 'Tk',
    canShoot: (G: GameState, player: number, from: Position, to: Position) =>
      dist(from, to) <= 4 &&
      isStraight(from, to) &&
      checkPath(G, false, undefined, player, from, to),
  },
  Rd: { ...AttackingShip, strength: 5 },
  Mn: { ...BaseShip, patron: 'Es', onAttack: Effects.ExplodeMine },
  Es: { ...AttackingShip, strength: 3.375 },
  Br: {
    ...Missile,
    canShoot: (G: GameState, player: number, from: Position, to: Position) =>
      !G.usedBrander[player] && dist(from, to) == 1,
    shoot({ G }: ActionContext, from: Position, to: Position) {
      let fromPlayer = getPos(G, from)!.player;
      G.usedBrander[fromPlayer] = 2;
      getPos(G, to)!.player = fromPlayer;
    },
  },
  KrPl: {
    ...AttackingShip,
    compare(ship: ShipDefinition) {
      if (ship.type == 'KrPl') return 0;
      if (['Kr', 'Rd', 'Es'].includes(ship.type)) return -1;
      return 1;
    },
  },
  AB: {
    ...Bomb,
    blastRadius: 2,
    blastSquare(bgctx: ActionContext, pos: Position) {
      Effects.Die(bgctx, pos);
    },
  },
  St: { ...AttackingShip, strength: 2.25 },
  NB: {
    ...Bomb,
    blastRadius: 2,
    blastSquare({ G }: ActionContext, pos: Position) {
      let ship = getPos(G, pos);
      if (ship) ship.player = -1;
    },
  },
  Tk: { ...AttackingShip, maxMove: 2, strength: 1.5 },
  F: {
    actions: { place: [Actions.Place], move: [], attack: [] },
    maxMove: 0,
    onAttack({ G, ctx, events }: ActionContext, from: Position, to: Position) {
      Effects.Win({ G, ctx, events }, from, to);
    },
  },
  Tr: { ...AttackingShip, strength: 1 },
  Tp: {
    ...AttackingShip,
    compare(ship: Ship) {
      if (ship?.type == 'Tp') return 0;
      return -1;
    },
  },
  Pl: {
    ...AttackingShip,
    compare(ship: Ship) {
      if (ship?.type == 'Pl') return 0;
      if (['Lk', 'Tp'].includes(ship?.type ?? '')) return 1;
      return -1;
    },
  },
});
