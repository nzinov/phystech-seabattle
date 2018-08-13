import { Game } from 'boardgame.io/core';
import deepcopy from 'deepcopy';

const SIZE = 14;

function valid(pos) {
    return 0 <= pos[0] && pos[0] < SIZE && 0 <= pos[1] && pos[1] < SIZE;
}
function  dist(from, to) {
    return Math.abs(from[0] - to[0]) + Math.abs(from[1] - to[1]);
}

function getPos(G, pos) {
    return G.cells[pos[0]][pos[1]];
}

function setPos(G, pos, fig) {
    G.cells[pos[0]][pos[1]] = fig;
}

function patronNear(G, type, player, pos) {
    for (let dx = -1; dx < 2; ++dx) {
        for (let dy = -1; dy < 2; ++dy) {
            let newPos = [pos[0] + dx, pos[1] + dy];
            if (valid(newPos)) {
                let ship = getPos(G, newPos);
                if (ship && ship.player == player && (ship.type == type || ship.type == "Tp")) {
                    return true;
                }
            }
        }
    }
    return false;
}

const Actions = {
    Move: {
        can(G, ctx, ship, from, to) {
            if (getPos(G, to)) {
                return false;
            }
            if (dist(from, to) > ship.maxMove) {
                return false;
            }
            if (ship.patron && !patronNear(G, ship.patron, ctx.currentPlayer, to)) {
                return false;
            }
            return true;
        },

        take(G, ctx, ship, from, to) {
            G = deepcopy(G)
            setPos(G, to, getPos(G, from));
            setPos(G, from, null);
            ctx.events.endPhase("attack");
            return G;
        }
    },
    Attack: {
        can(G, ctx, ship, from, to) {
            let opponent = getPos(G, to);
            if (!opponent || opponent.player == ctx.currentPlayer) {
                return false;
            }
            if (dist(from, to) > 1) {
                return false;
            }
            return true;
        },

        take(G, ctx, ship, from, to) {
        }
    }
};

const Ship = {
    actions: {
        move: [Actions.Move],
        attack: [],
    },
    maxMove:  1,
};

const AttackingShip = {
    actions: {
        move: [Actions.Move],
        attack: [Actions.Attack],
    },
    maxMove:  1,
};

const Ships = {
    Av: {...AttackingShip},
    Sm: {...Ship, patron: "Av"},
    Lk: {...AttackingShip},
    Rk: {...Ship, patron: "KrPl"},
    Kr: {...AttackingShip},
    T: {...Ship, maxMove: 2, patron: "Tk"},
    Rd: {...AttackingShip},
    Mn: {...Ship, patron: "Es"},
    Es: {...AttackingShip},
    Br: {...Ship},
    KrPl: {...AttackingShip},
    AB: {...Ship},
    St: {...AttackingShip},
    NB: {...Ship},
    Tk: {...AttackingShip, maxMove: 2},
    F: {...Ship, maxMove: 0},
    Tr: {...AttackingShip},
    Tp: {...AttackingShip},
    Pl: {...AttackingShip},
};

const InitialShips = [
    ["Av", 1],
    ["Sm", 1],
    ["Lk", 2],
    ["Rk", 1],
    ["Kr", 6],
    ["T", 4],
    ["Rd", 2],
    ["Mn", 7],
    ["Es", 6],
    ["Br", 2],
    ["KrPl", 1],
    ["AB", 1],
    ["St", 7],
    ["NB", 1],
    ["Tk", 6],
    ["F", 2],
    ["Tr", 7],
    ["Tp", 1],
    ["Pl", 4],
]

const GameRules = Game({
    setup() {
        let cells = [];
        for (let x = 0; x < SIZE; ++x) {
            cells.push([]);
            for (let y = 0; y < SIZE; ++y) {
                cells[x].push(null);
            }
        }
        let i = 0;
        for (let el of InitialShips) {
            for (let num = 0; num < el[1]; ++num) {
                cells[Math.floor(i / SIZE)][i % SIZE] = {type: el[0], player: 0, state: {}};
                i += 1;
            }
        }
        i = SIZE*SIZE - 1;
        for (let el of InitialShips) {
            for (let num = 0; num < el[1]; ++num) {
                cells[Math.floor(i / SIZE)][i % SIZE] = {type: el[0], player: 1, state: {}};
                i -= 1;
            }
        }
        return {cells}
    },
    flow: {phases: [{name: "move"}, {name: "attack"}]},
    moves: {
        move(G, ctx, from, to) {
            let ship = getPos(G, from);
            if (!ship || ship.player != ctx.currentPlayer) {
                return;
            }
            ship = Ships[ship.type];
            let actions = ship.actions[ctx.phase];
            if (!actions.length) {
                return
            }
            if (ship.patron && !patronNear(G, ship.patron, ctx.currentPlayer, from)) {
                return;
            }
            if (!actions[0].can(G, ctx, ship, from, to)) {
                return;
            }
            return actions[0].take(G, ctx, ship, from, to);
        },
    },

    playerView(G, ctx, playerID) {
        G = deepcopy(G);
        for (let i = 0; i < SIZE; ++i) {
            for (let j = 0; j < SIZE; ++j) {
                let cell = G.cells[i][j]
                if (cell && cell.player != playerID) {
                    cell.type = "Unknown";
                    cell.state = {}
                }
                G.cells[i][j] = cell;
            }
        }
        return G
    }
});

export default GameRules;

