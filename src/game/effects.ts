import type { ActionContext, Position } from './types';
import { addLog, getPos, setPos, valid } from './utils';
import { getShip } from './utils';

function repeatTurn({ ctx, events }: ActionContext) {
  events.endTurn({ next: ctx.currentPlayer });
}

export const Effects = {
  Die({ G }: ActionContext, pos: Position) {
    let sq = getPos(G, pos);
    if (!sq) {
      return;
    }
    addLog(G, 'die', pos, pos, { ship: sq, player: sq.player });
    setPos(G, pos, null);
  },
  Win(bgctx: ActionContext, _from: Position, to: Position) {
    Effects.Die(bgctx, to);
    repeatTurn(bgctx);
  },
  Loose(bgctx: ActionContext, from: Position, _to: Position) {
    Effects.Die(bgctx, from);
    bgctx.events.endTurn();
  },
  Draw(bgctx: ActionContext, fromBlock: Position[], toBlock: Position[]) {
    fromBlock.forEach(el => Effects.Die(bgctx, el));
    toBlock.forEach(el => Effects.Die(bgctx, el));
    bgctx.events.endTurn();
  },
  Explode(bgctx: ActionContext, from: Position, to: Position) {
    let ship = getShip(bgctx.G, from);
    if (!ship || !ship.blastRadius || !ship.blastSquare) {
      throw new Error('Ship has no blast radius');
    }
    addLog(bgctx.G, 'explode', from, to, {
      ship: getPos(bgctx.G, from),
      player: getPos(bgctx.G, from)!.player,
    });
    Effects.Die(bgctx, from);
    for (let dx = -ship.blastRadius; dx <= ship.blastRadius; ++dx) {
      for (let dy = -ship.blastRadius; dy <= ship.blastRadius; ++dy) {
        let newPos: Position = [to[0] + dx, to[1] + dy];
        if (valid(bgctx.G, newPos)) {
          ship.blastSquare(bgctx, newPos);
        }
      }
    }
  },
  ExplodeMine(bgctx: ActionContext, from: Position, to: Position) {
    if (getPos(bgctx.G, from)?.type != 'Tr') {
      Effects.Die(bgctx, from);
      Effects.Die(bgctx, to);
      bgctx.events.endTurn();
    } else {
      Effects.Die(bgctx, to);
      repeatTurn(bgctx);
    }
  },
  ExplodeSm(bgctx: ActionContext, from: Position, to: Position) {
    Effects.Die(bgctx, from);
    Effects.Die(bgctx, to);
    bgctx.events.endTurn();
  },
  ExplodeBomb(bgctx: ActionContext, from: Position, to: Position) {
    if (getPos(bgctx.G, from)?.type != 'Tr') {
      Effects.Die(bgctx, from);
      Effects.Explode(bgctx, to, to);
      bgctx.events.endTurn();
    } else {
      Effects.Die(bgctx, to);
      repeatTurn(bgctx);
    }
  },
};
