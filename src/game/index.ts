import type { Ctx, Game } from 'boardgame.io';
import { TurnOrder } from 'boardgame.io/core';
import deepcopy from 'deepcopy';
import { DefaultGameConfig, MiniGameConfig, MicroGameConfig } from './config';
import { Effects } from './effects';
import {
  AttackBlockMove,
  AttackMove,
  LabelMove,
  Move,
  PlaceMove,
  Ready,
  ResponseBlockMove,
  Skip,
} from './moves';
import type { ActionContext, GameConfig, GameState, Position, Ship } from './types';
import { checkSide, getBlockStrength, getPos, getShip } from './utils';

// Import ships.ts to populate the Ships object
import './ships';

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

export function createGameRules(config: GameConfig = DefaultGameConfig): Game<GameState> {
  return {
    name: 'PhystechSeaBattle' + config.name,
    minPlayers: 2,
    maxPlayers: 2,
    setup({ ctx: _ctx }: { ctx: Ctx }): GameState {
      let cells: (Ship | null)[][] = [];
      for (let x = 0; x < config.fieldSize; ++x) {
        cells.push([]);
        for (let y = 0; y < config.fieldSize; ++y) {
          cells[x].push(null);
        }
      }
      let i = 0;
      for (let el of config.initialShips) {
        for (let num = 0; num < (el[1] as number); ++num) {
          cells[Math.floor(i / config.fieldSize)][i % config.fieldSize] = {
            type: el[0] as string,
            player: 0,
            state: {},
            label: {},
          };
          i += 1;
        }
      }
      i = config.fieldSize * config.fieldSize - 1;
      for (let el of config.initialShips) {
        for (let num = 0; num < (el[1] as number); ++num) {
          cells[Math.floor(i / config.fieldSize)][i % config.fieldSize] = {
            type: el[0] as string,
            player: 1,
            state: {},
            label: {},
          };
          i -= 1;
        }
      }
      return { cells, ready: 0, usedBrander: [0, 0], log: [], phase: 'place', config };
    },
    phases: {
      place: {
        start: true,
        turn: {
          stages: {
            place: {
              moves: {
                Ready,
                Place: PlaceMove,
              },
            },
          },
          activePlayers: { all: 'place' },
        },
        endIf: ({ G }) => G.ready >= 2,
        next: 'play',
      },
      play: {
        turn: {
          order: TurnOrder.RESET,
          stages: {
            move: {
              next: 'attack',
              moves: {
                Move,
                Label: LabelMove,
              },
            },
            attack: {
              moves: {
                Attack: AttackMove,
                Skip,
                Label: LabelMove,
              },
            },
            attackBlock: {
              moves: {
                AttackBlock: AttackBlockMove,
                Label: LabelMove,
              },
            },
            responseBlock: {
              moves: {
                ResponseBlock: ResponseBlockMove,
                Label: LabelMove,
              },
            },
            wait: { moves: { Label: LabelMove } },
          },
          onBegin({ G }: ActionContext) {
            for (let i = 0; i < 2; ++i) {
              G.usedBrander[i] = Math.max(0, G.usedBrander[i] - 1);
            }
          },
          onMove({ G, ctx, events }: ActionContext) {
            if (G.attackBlock && G.responseBlock) {
              let ship = getShip(G, G.attackFrom!);
              if (ship?.compare) {
                let res = ship.compare(getPos(G, G.attackTo!)!);
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
          onEnd({ G }: ActionContext) {
            // Clear attack state when turn ends to prevent blue border highlight
            G.attackFrom = undefined;
            G.attackTo = undefined;
            G.attackBlock = undefined;
            G.responseBlock = undefined;
          },
          activePlayers: { currentPlayer: 'move', others: 'wait' },
        },
      },
    },
    moves: {},

    endIf: ({ G }: ActionContext) => {
      let fortCount = [0, 0];
      const fieldSize = G.config?.fieldSize || DefaultGameConfig.fieldSize;
      for (let i = 0; i < fieldSize; ++i) {
        for (let j = 0; j < fieldSize; ++j) {
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

    playerView({
      G,
      ctx,
      playerID,
    }: {
      G: GameState;
      ctx: Ctx;
      playerID: string | null;
    }): GameState {
      G = deepcopy(G);
      const fieldSize = G.config?.fieldSize || DefaultGameConfig.fieldSize;
      for (let i = 0; i < fieldSize; ++i) {
        for (let j = 0; j < fieldSize; ++j) {
          if (ctx.phase == 'place' && !checkSide(G, parseInt(playerID!), [i, j])) {
            G.cells[i][j] = null;
            continue;
          }
          let cell = G.cells[i][j];
          if (cell && cell.player != parseInt(playerID!)) {
            cell.type = cell.player == -1 ? 'Sinking' : 'Unknown';
            cell.state = {};
          }
          if (cell) {
            cell.label = cell.label?.[playerID!];
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
}

export * from './config';
export * from './game-logic';
export * from './moves';
export * from './types';
export * from './utils';

export const DefaultGame = createGameRules(DefaultGameConfig);
export const MiniGame = createGameRules(MiniGameConfig);
export const MicroGame = createGameRules(MicroGameConfig);
