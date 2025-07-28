import { Ctx } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import type { ActionContext, Block, GameState, MoveContext, Position } from './types';
import { addLog, checkBlock, dist, getPos, getStageActions, valid } from './utils';

function makeMove(
  { G, ctx, playerID, events }: MoveContext,
  stage: string,
  mode: string,
  from: Position,
  to: Position
): typeof INVALID_MOVE | void {
  if (!valid(G, from) || !valid(G, to)) {
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

export function Ready({ G, events }: ActionContext) {
  G.ready++;
  events.endStage();
}

export const PlaceMove = (all_data: MoveContext, mode: string, from: Position, to: Position) => {
  makeMove(all_data, 'place', mode, from, to);
};
PlaceMove.redact = true;

export function Move(all_data: MoveContext, mode: string, from: Position, to: Position) {
  makeMove(all_data, 'move', mode, from, to);
}

export function Skip({ events }: MoveContext) {
  events.endTurn();
}

export const AttackMove = (all_data: MoveContext, mode: string, from: Position, to: Position) => {
  makeMove(all_data, 'attack', mode, from, to);
};
AttackMove.client = false;

export const AttackBlockMove = (
  { G, playerID }: MoveContext,
  block: Block
): typeof INVALID_MOVE | void => {
  if (
    !block.coords.some((el: Position) => dist(el, G.attackFrom!) == 0) ||
    !checkBlock(G, parseInt(playerID!), block.type, block.size, block.coords)
  ) {
    return INVALID_MOVE;
  }
  G.attackBlock = block;
};
AttackBlockMove.redact = true;

export const ResponseBlockMove = (
  { G, playerID }: MoveContext,
  block: Block
): typeof INVALID_MOVE | void => {
  if (
    !block.coords.some((el: Position) => dist(el, G.attackTo!) == 0) ||
    !checkBlock(G, parseInt(playerID!), block.type, block.size, block.coords)
  ) {
    return INVALID_MOVE;
  }
  addLog(G, 'response', undefined, undefined, {
    size: block.size,
    ship_type: block.type,
    player: parseInt(playerID!),
  });
  G.responseBlock = block;
};
ResponseBlockMove.redact = true;

export const LabelMove = ({ G, playerID }: MoveContext, pos: Position, label: string): void => {
  getPos(G, pos)!.label![playerID!] = label;
};
LabelMove.redact = true;
LabelMove.client = false;

export function takeMove(
  G: GameState,
  ctx: Ctx,
  moves: Record<string, (...args: any[]) => void>,
  mode: string,
  from: Position,
  to: Position
): void {
  if (ctx.phase == 'place') {
    moves.Place(mode, from, to);
    return;
  }
  let player = getPos(G, from)?.player;
  let stage = ctx.activePlayers?.[player!];
  if (stage == 'move') {
    moves.Move(mode, from, to);
  } else if (stage == 'attack') {
    moves.Attack(mode, from, to);
  }
}
