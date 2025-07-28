import type { Ctx } from 'boardgame.io';
import { EventsAPI } from 'boardgame.io/dist/types/src/plugins/plugin-events';

export type Position = [number, number];

export interface GameConfig {
  name: string;
  fieldSize: number;
  placementZoneSize: number; // Number of rows for each player's placement zone
  initialShips: [string, number][];
}

export interface Ship {
  type: string;
  player: number;
  state?: any;
  label?: string;
}

export interface GameState {
  cells: (Ship | null)[][];
  log: any[];
  phase: string;
  ready: number;
  usedBrander: number[];
  attackFrom?: Position;
  attackTo?: Position;
  attackBlock?: Block;
  responseBlock?: Block;
  config?: GameConfig;
}

export interface ActionContext {
  G: GameState;
  ctx: Ctx;
  events: EventsAPI;
}

export interface MoveContext extends ActionContext {
  playerID: string;
}

export interface Block {
  type: string;
  size: number;
  coords: Position[];
}

export interface ShipDefinition {
  actions: {
    place: any[];
    move: any[];
    attack: any[];
    [key: string]: any[];
  };
  maxMove: number;
  strength?: number;
  patron?: string;
  canShoot?: (G: GameState, player: number, from: Position, to: Position) => boolean;
  onAttack?: (bgctx: ActionContext, from: Position, to: Position) => void;
  onShoot?: (bgctx: ActionContext, from: Position, to: Position) => void;
  shoot?: (bgctx: ActionContext, from: Position, to: Position) => void;
  blastRadius?: number;
  blastSquare?: (bgctx: ActionContext, pos: Position) => void;
  compare?: (target: Ship) => number;
}
