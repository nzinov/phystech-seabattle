import type { Ctx } from 'boardgame.io';
import type { Position, GameState } from './types';
import { getPos } from './utils';
import { getStageActions } from './utils';

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
