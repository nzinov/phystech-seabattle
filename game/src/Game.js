import deepcopy from 'deepcopy';
import { INVALID_MOVE } from 'boardgame.io/core';

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

function checkSide(G, player, pos) {
    return true; // TODO: just for testing
    let low = player == 1 ? 9 : 0;
    let high = player == 1 ? 14 : 5;
    return low <= pos[0] && pos[0] < high;
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

function checkPatron(G, player, ship, from) {
    return !(ship.patron && !patronNear(G, ship.patron, player, from));
};

const Actions = {
    Place: {
        can(G, player, from, to) {
            return dist(from, to) > 0 && checkSide(G, player, from) && checkSide(G, player, to);
        },
        take(G, ctx, from, to) {
            let tmp = getPos(G, from);
            setPos(G, from, getPos(G, to));
            setPos(G, to, tmp);
        }
    },
    Move: {
        can(G, player, from, to) {
            let ship = getShip(G, from);
            return checkPatron(G, player, ship, from) &&
                !getPos(G, to) &&
                (dist(from, to) <= ship.maxMove) &&
                checkPatron(G, player, ship, to);
        },
        take(G, ctx, from, to) {
            setPos(G, to, getPos(G, from));
            setPos(G, from, null);
            ctx.events.endStage();
        }
    },
    Attack: {
        can(G, player, from, to) {
            let ship = getShip(G, from);
            if (!checkPatron(G, player, ship, from)) {
                return false;
            }
            let opponent = getPos(G, to);
            if (!opponent || opponent.player == player) {
                return false;
            }
            if (dist(from, to) > 1) {
                return false;
            }
            return true;
        },

        take(G, ctx, from, to) {
            if (getPos(G, to).player == -1) {
                getPos(G, to).player = ctx.currentPlayer;
                ctx.events.endTurn();
                return;
            }
            let ship = getShip(G, from);
            let targetShip = getShip(G, to);
            console.log("pos", getPos(G, to).type);
            if (targetShip.onAttack) {
                targetShip.onAttack(G, ctx, from, to);
                return;
            }
        }
    },
    Explode: {
        can(G, player, from, to) {
            return dist(from, to) == 0;
        },

        take(G, ctx, from, to) {
            Effects.Explode(G, from, to);
            ctx.events.endStage();
        },
    }
};

const Effects = {
    Explode(G, from, to) {
        let ship = getShip(G, from);
        setPos(G, from, null);
        for (let dx = -ship.blastRadius; dx <= ship.blastRadius; ++dx) {
            for (let dy = -ship.blastRadius; dy <= ship.blastRadius; ++dy) {
                let newPos = [to[0] + dx, to[1] + dy];
                if (valid(newPos)) {
                    ship.blastSquare(G, newPos);
                }
            }
        }
    },
    ExplodeMine(G, ctx, from, to) {
        if (getPos(G, from)?.type != 'Tr') {
            setPos(G, from, null); 
            setPos(G, to, null); 
            ctx.events.endTurn();
        } else {
            setPos(G, to, null); 
            ctx.events.endStage();
        } 
    },
    ExplodeBomb(G, ctx, from, to) {
        if (getPos(G, from)?.type != 'Tr') {
            setPos(G, from, null); 
            Effects.Explode(G, to, to);
            ctx.events.endTurn();
        } else {
            setPos(G, to, null); 
            ctx.events.endStage();
        } 
    },
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

const Bomb = {
    actions: {
        move: [Actions.Move],
        attack: [Actions.Explode],
    },
    maxMove:  1,
    onAttack: Effects.ExplodeBomb
};

const Ships = {
    Av: {...AttackingShip},
    Sm: {...Ship, patron: "Av", onAttack: Effects.ExplodeMine},
    Lk: {...AttackingShip},
    Rk: {...Ship, patron: "KrPl"},
    Kr: {...AttackingShip},
    T: {...Ship, maxMove: 2, patron: "Tk", onAttack: Effects.ExplodeMine},
    Rd: {...AttackingShip},
    Mn: {...Ship, patron: "Es", onAttack: Effects.ExplodeMine},
    Es: {...AttackingShip},
    Br: {...Ship, onAttack: Effects.ExplodeMine},
    KrPl: {...AttackingShip},
    AB: {...Bomb, blastRadius: 2, blastSquare(G, pos) {setPos(G, pos, null);}},
    St: {...AttackingShip},
    NB: {...Bomb, blastRadius: 2, blastSquare(G, pos) {let ship = getPos(G, pos); if (ship) ship.player = -1;}},
    Tk: {...AttackingShip, maxMove: 2},
    F: {actions: {move: [], attack: []}},
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

function getShip(G, from) {
    return Ships[getPos(G, from)?.type];
}

export function getStageActions(G, ctx, stage, from) {
    let ship = getShip(G, from);
    if (!ship) {
        return [];
    }
    let player = getPos(G, from).player;
    if (!ctx.activePlayers) {
        return [];
    }
    return ship.actions[stage] || [];
};

export function getActions(G, ctx, player, from) {
    if (ctx.phase == 'place') {
        return checkSide(G, player, from) ? [Actions.Place] : [];
    }
    if (getPos(G, from)?.player != player || !ctx.activePlayers) {
        return [];
    }
    let stage = ctx.activePlayers[player];
    if (!stage) {
        return [];
    }
    return getStageActions(G, ctx, stage, from);
};

function makeMove(G, ctx, stage, from, to) {
    let actions = getStageActions(G, ctx, stage, from);
    if (!actions.length) {
        return INVALID_MOVE;
    }
    if (!actions[0].can(G, ctx.playerID, from, to)) {
        return INVALID_MOVE;
    }
    actions[0].take(G, ctx, from, to);
};

function Ready(G, ctx) {
    G.ready++;
    ctx.events.endStage();
}

function Place(G, ctx, from, to) {
    if (!Actions.Place.can(G, ctx.playerID, from, to)) {
        return INVALID_MOVE;
    }
    Actions.Place.take(G, ctx, from, to);
};

function Move(G, ctx, from, to) {
    makeMove(G, ctx, 'move', from, to);
};

const Attack = {
    move(G, ctx, from, to) {
        makeMove(G, ctx, 'attack', from, to);
    },
    client: false
};

export function takeMove(G, ctx, moves, from, to) {
    if (ctx.phase == 'place') {
        moves.Place(from, to);
    }
    let player = getPos(G, from)?.player;
    let stage = ctx.activePlayers[player];
    if (stage == 'move') {
        moves.Move(from, to);
    } else if (stage == 'attack') {
        moves.Attack(from, to);
    }
};

export const GameRules = {
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
        return {cells, ready: 0}
    },
    phases: {place: {
        start: true,
        turn: {activePlayers: {all: 'place'}, stages: {
            place: {moves: { Ready, Place }},
        }},
        endIf: G => (G.ready >= 2),
        next: 'play'
    }, play: {
        turn: {activePlayers: {currentPlayer: 'move'}, stages: {
            move: {next: 'attack', moves: { Move }},
            attack: {next: 'move', moves: { Attack }}
        }},
    }},
    moves: {},

    playerView(G, ctx, playerID) {
        G = deepcopy(G);
        for (let i = 0; i < SIZE; ++i) {
            for (let j = 0; j < SIZE; ++j) {
                let cell = G.cells[i][j]
                if (cell && cell.player != playerID) {
                    cell.type = cell.player == -1 ? "Sinking" : "Unknown";
                    cell.state = {}
                }
                G.cells[i][j] = cell;
            }
        }
        return G
    }
};

export default GameRules;
