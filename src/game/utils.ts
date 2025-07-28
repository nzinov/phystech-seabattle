import type { Ctx } from 'boardgame.io';
import { DefaultGameConfig } from './config';
import type { Block, GameConfig, GameState, Position, Ship, ShipDefinition } from './types';

export function addLog(
  G: GameState,
  type: string,
  from?: Position,
  to?: Position,
  options?: any
): void {
  options = options || {};
  G.log.push({ type, from, to, ...options });
}

export function valid(G: GameState, pos: Position): boolean {
  const size = G.config?.fieldSize || DefaultGameConfig.fieldSize;
  return 0 <= pos[0] && pos[0] < size && 0 <= pos[1] && pos[1] < size;
}

export function vector(from: Position, to: Position): Position {
  return [to[0] - from[0], to[1] - from[1]];
}

export function isStraight(from: Position, to: Position): boolean {
  let v = vector(from, to);
  return v[0] == 0 || v[1] == 0;
}

export function dist(from: Position, to: Position): number {
  return Math.abs(from[0] - to[0]) + Math.abs(from[1] - to[1]);
}

export function getPos(G: GameState, pos: Position): Ship | null {
  return G.cells[pos[0]][pos[1]];
}

export function setPos(G: GameState, pos: Position, fig: Ship | null): void {
  G.cells[pos[0]][pos[1]] = fig;
}

export function getPlacementZone(config: GameConfig, player: number): [number, number] {
  if (player == 0) {
    return [0, config.placementZoneSize];
  } else {
    return [config.fieldSize - config.placementZoneSize, config.fieldSize];
  }
}

export function checkSide(G: GameState, player: number, pos: Position): boolean {
  const config = G.config || DefaultGameConfig;
  const [low, high] = getPlacementZone(config, player);
  return low <= pos[0] && pos[0] < high;
}

export function playerAdjacent(G: GameState, player: number, pos: Position): boolean {
  for (let dx = -1; dx < 2; ++dx) {
    for (let dy = -1; dy < 2; ++dy) {
      let newPos: Position = [pos[0] + dx, pos[1] + dy];
      if (dist(pos, newPos) == 1 && valid(G, newPos)) {
        let ship = getPos(G, newPos);
        if (ship && ship.player == player) {
          return true;
        }
      }
    }
  }
  return false;
}

export function patronNear(G: GameState, type: string, player: number, pos: Position): boolean {
  for (let dx = -1; dx < 2; ++dx) {
    for (let dy = -1; dy < 2; ++dy) {
      let newPos: Position = [pos[0] + dx, pos[1] + dy];
      if (valid(G, newPos)) {
        let ship = getPos(G, newPos);
        if (ship && ship.player == player && (ship.type == type || ship.type == 'Tp')) {
          return true;
        }
      }
    }
  }
  return false;
}

export function checkPath(
  G: GameState,
  forceEmpty: boolean,
  forcePatron: string | undefined,
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
  if (forcePatron && !patronNear(G, forcePatron, player, from)) {
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

export function checkPatron(
  G: GameState,
  player: number,
  ship: { patron?: string } | undefined,
  from: Position
): boolean {
  return !(ship?.patron && !patronNear(G, ship.patron, player, from));
}

// Ships object - moved from ships.ts to break circular dependencies
export const Ships: Record<string, ShipDefinition> = {};

// Helper functions moved from ships.ts
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
    if (!valid(G, coord)) {
      return false;
    }
    let sq = getPos(G, coord);
    if (!sq || sq.player != player) {
      return false;
    }
    block.push(sq.type);
  }
  function matchBlock(block: string[], pattern: string[]) {
    return (
      block.length == pattern.length &&
      block
        .slice()
        .sort()
        .every((el, i) => el == pattern[i])
    );
  }

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

export function getBlocks(G: GameState, player: number, coord: Position): Block[] {
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

export function getBlockStrength(block: Block): number {
  return block.size * Ships[block.type]?.strength!;
}

export function getShip(G: GameState, from: Position): ShipDefinition | undefined {
  const ship = getPos(G, from);
  return ship ? Ships[ship.type] : undefined;
}

export function getStageActions(G: GameState, ctx: Ctx, stage: string, from: Position): any[] {
  let ship = getShip(G, from);
  if (!ship) {
    return [];
  }
  if (!ctx.activePlayers) {
    return [];
  }
  return ship.actions[stage] || [];
}
