import type { ActionContext, MoveContext, Position, GameState } from './types';
import {
  addLog,
  checkSide,
  dist,
  getPos,
  setPos,
  checkPath,
  isStraight,
  checkPatron,
} from './utils';
import { getShip } from './utils';
import { Effects } from './effects';

function repeatTurn({ ctx, events }: ActionContext) {
  events.endTurn({ next: ctx.currentPlayer });
}

function battle(
  bgctx: ActionContext,
  res: number,
  from: Position,
  to: Position,
  fromBlock: Position[],
  toBlock: Position[]
): void {
  if (Math.abs(res) < 1e-7) {
    Effects.Draw(bgctx, fromBlock, toBlock);
  } else if (res > 0) {
    Effects.Win(bgctx, from, to);
  } else {
    Effects.Loose(bgctx, from, to);
  }
}

export const Actions = {
  Place: {
    canFrom(G: GameState, player: number, from: Position) {
      return checkSide(G, player, from);
    },
    can(G: GameState, player: number, from: Position, to: Position) {
      return dist(from, to) > 0 && checkSide(G, player, to);
    },
    take({ G }: ActionContext, from: Position, to: Position) {
      let tmp = getPos(G, from);
      setPos(G, from, getPos(G, to));
      setPos(G, to, tmp);
    },
  },
  Move: {
    canFrom(G: GameState, player: number, from: Position) {
      let ship = getShip(G, from);
      return checkPatron(G, player, ship, from);
    },
    can(G: GameState, player: number, from: Position, to: Position) {
      let ship = getShip(G, from);
      if (!ship) {
        return false;
      }
      return (
        !getPos(G, to) &&
        dist(from, to) <= ship.maxMove &&
        checkPatron(G, player, ship, to) &&
        checkPath(G, false, ship.patron, player, from, to)
      );
    },
    take({ G, events }: ActionContext, from: Position, to: Position) {
      addLog(G, 'move', from, to, { player: getPos(G, from)!.player });
      setPos(G, to, getPos(G, from));
      setPos(G, from, null);
      events.endStage();
    },
    key: 'm',
    name: 'Move',
  },
  Attack: {
    canFrom(G: GameState, player: number, from: Position) {
      let ship = getShip(G, from);
      return checkPatron(G, player, ship, from);
    },
    can(G: GameState, player: number, from: Position, to: Position) {
      let opponent = getPos(G, to);
      return opponent && opponent.player != player && dist(from, to) == 1;
    },
    take({ G, ctx, events }: ActionContext, from: Position, to: Position) {
      let fig = getPos(G, from);
      addLog(G, 'attack', from, to, { player: fig!.player });
      let targetFig = getPos(G, to);
      let ship = getShip(G, from);
      let targetShip = getShip(G, to);
      if (targetFig?.player == -1) {
        targetFig.player = parseInt(ctx.currentPlayer);
        events.endTurn();
        return;
      }
      if (targetShip?.onAttack) {
        targetShip.onAttack({ G, ctx, events }, from, to);
        return;
      }
      if (targetShip?.compare) {
        addLog(G, 'response', undefined, undefined, {
          size: 1,
          ship_type: targetFig?.type,
          player: targetFig!.player,
        });
        let res = targetShip.compare(fig!);
        battle({ G, ctx, events }, -res, from, to, [from], [to]);
        return;
      }
      G.attackFrom = from;
      G.attackTo = to;
      let isBlockableFrom = !!ship?.strength;
      if (!isBlockableFrom) {
        G.attackBlock = 'not_required';
      }
      events.setActivePlayers({
        currentPlayer: isBlockableFrom ? 'attackBlock' : undefined,
        others: 'responseBlock',
        revert: true,
        moveLimit: 1,
      });
    },
    key: 'a',
    name: 'Attack',
  },
  Explode: {
    canFrom(_G: GameState, _player: number, _from: Position) {
      return true;
    },
    can(G: GameState, player: number, from: Position, to: Position) {
      return dist(from, to) == 0;
    },
    take(bgctx: ActionContext, from: Position, to: Position) {
      Effects.Explode(bgctx, from, to);
      repeatTurn(bgctx);
    },
    key: 'e',
    name: 'Explode',
  },
  Shoot: {
    canFrom(G: GameState, player: number, from: Position) {
      let ship = getShip(G, from);
      return checkPatron(G, player, ship, from);
    },
    can(G: GameState, player: number, from: Position, to: Position) {
      let ship = getShip(G, from);
      let targetFig = getPos(G, to);
      return (
        checkPatron(G, player, ship, from) &&
        targetFig &&
        targetFig.player != player &&
        ship &&
        ship.canShoot &&
        ship.canShoot(G, player, from, to)
      );
    },
    take({ G, ctx, events }: MoveContext, from: Position, to: Position) {
      let ship = getShip(G, from);
      if (!ship || !ship.shoot) {
        throw new Error('Ship not found');
      }
      addLog(G, 'shoot', from, to, { ship: getPos(G, from), player: getPos(G, from)!.player });
      ship.shoot({ G, ctx, events }, from, to);
    },
    key: 's',
    name: 'Shoot',
  },
  RocketShootArea: {
    canFrom(G: GameState, player: number, from: Position) {
      let ship = getShip(G, from);
      return checkPatron(G, player, ship, from);
    },
    can(G: GameState, player: number, from: Position, to: Position) {
      let ship = getShip(G, from);
      return (
        checkPatron(G, player, ship, from) &&
        dist(from, to) > 0 &&
        Actions.RocketShootArea.canShoot(G, player, from, to)
      );
    },
    canShoot(G: GameState, player: number, from: Position, to: Position) {
      return isStraight(from, to) && dist(from, to) <= 2;
    },
    take(bgctx: ActionContext, from: Position, to: Position) {
      addLog(bgctx.G, 'shoot', from, to, {
        ship: getPos(bgctx.G, from),
        area: true,
        player: getPos(bgctx.G, from)!.player,
      });
      Effects.Explode(bgctx, from, to);
      repeatTurn(bgctx);
    },
    key: 'r',
    name: 'Shoot with area damage',
  },
};
