import deepcopy from 'deepcopy';
import { INVALID_MOVE, TurnOrder } from 'boardgame.io/dist/cjs/core.js';

const SIZE = 14;

function addLog(G, type, from, to, options) {
    options = options || {};
    G.log.push({type, from, to, ...options});
}

function valid(pos) {
    return 0 <= pos[0] && pos[0] < SIZE && 0 <= pos[1] && pos[1] < SIZE;
}

function vector(from, to) {
    return [to[0] - from[0], to[1] - from[1]];
}

function isStraight(from, to) {
    let v = vector(from, to);
    return v[0] == 0 || v[1] == 0;
}

export function dist(from, to) {
    return Math.abs(from[0] - to[0]) + Math.abs(from[1] - to[1]);
}

function getPos(G, pos) {
    return G.cells[pos[0]][pos[1]];
}

function setPos(G, pos, fig) {
    G.cells[pos[0]][pos[1]] = fig;
}

function checkSide(G, player, pos) {
    //return true; // TODO: just for testing
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

function checkPath(G, forceEmpty, forcePatron, player, from, to) {
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

export function checkBlock(G, player, type, size, coords) {
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
        if (!valid(coord)) {
            return false;
        }
        let sq = getPos(G, coord);
        if (!sq || sq.player != player) {
            return false;
        }
        block.push(sq.type);
    }
    function matchBlock(block, pattern) {
        return block.length == pattern.length && block.slice().sort().every((el, i) => el == pattern[i]);
    }
    
    console.log(type, block);
    console.log((block.every((el) => el == type)),
           (block.every((el) => [type, 'Rd'].includes(el)) && Ships[type].strength <= Ships['Rd'].strength),
           (type == 'Es' && matchBlock(block, ['Rd', 'St'])),
           (type == 'Es' && matchBlock(block, ['Es', 'Rd', 'St']) && Math.abs(block.indexOf('Rd') - block.indexOf('St')) == 1));
    return (block.every(el => el == type)) ||
           (block.every(el => [type, 'Rd'].includes(el)) && Ships[type].strength <= Ships['Rd'].strength) ||
           (type == 'Es' && matchBlock(block, ['Rd', 'St'])) ||
           (type == 'Es' && matchBlock(block, ['Es', 'Rd', 'St']) && Math.abs(block.indexOf('Rd') - block.indexOf('St')) == 1);
};

export function getBlocks(G, player, coord) {
    let blocks = [];
    blocks.push([coord]);
    for (let dx = -1; dx < 2; ++dx) {
        for (let dy = -1; dy < 2; ++dy) {
            if (dx == 0 && dy == 0) {
                continue;
            }
            if (dx == 0 || dy == 0) {
                blocks.push([coord, [coord[0] + dx, coord[1] + dy]]);
                blocks.push([coord, [coord[0] + dx, coord[1] + dy], [coord[0] + 2 * dx, coord[1] + 2 * dy]]);
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
                validBlocks.push({type: type, size: block.length, coords: block});
            }
        }
    }
    return validBlocks;
};

function getBlockStrength(block) {
    return block.size * Ships[block.type].strength;
}

function battle(G, ctx, res, from, to, fromBlock, toBlock) {
    //addLog(ctx, 'battle', from, to, {fromShip: getPos(G, from).type, toShip: getPos(G, to).type, res});
    if (Math.abs(res) < 1e-7) {
        Effects.Draw(G, ctx, fromBlock, toBlock);
    } else if (res > 0) {
        Effects.Win(G, ctx, from, to);
    } else {
        Effects.Loose(G, ctx, from, to);
    }
}

const Actions = {
    Place: {
        canFrom(G, player, from) {
            return checkSide(G, player, from);    
        },
        can(G, player, from, to) {
            return dist(from, to) > 0 && checkSide(G, player, to);
        },
        take(G, ctx, from, to) {
            let tmp = getPos(G, from);
            setPos(G, from, getPos(G, to));
            setPos(G, to, tmp);
        }
    },
    Move: {
        canFrom(G, player, from) {
            let ship = getShip(G, from);
            return checkPatron(G, player, ship, from);
        },
        can(G, player, from, to) {
            let ship = getShip(G, from);
            return !getPos(G, to) &&
                (dist(from, to) <= ship.maxMove) &&
                checkPatron(G, player, ship, to) &&
                checkPath(G, false, ship.patron, player, from, to);
        },
        take(G, ctx, from, to) {
            setPos(G, to, getPos(G, from));
            setPos(G, from, null);
            ctx.events.endStage();
            addLog(G, 'move', from, to);
        },
        key: 'm',
        name: 'Move'
    },
    Attack: {
        canFrom(G, player, from) {
            let ship = getShip(G, from);
            return checkPatron(G, player, ship, from);
        },
        can(G, player, from, to) {
            let opponent = getPos(G, to);
            return opponent &&
                opponent.player != player &&
                dist(from, to) == 1;
        },
        take(G, ctx, from, to) {
            addLog(G, 'attack', from, to);
            if (getPos(G, to).player == -1) {
                getPos(G, to).player = ctx.currentPlayer;
                ctx.events.endTurn();
                return;
            }
            let fig = getPos(G, from);
            let targetFig = getPos(G, to);
            let ship = getShip(G, from);
            let targetShip = getShip(G, to);
            if (targetShip.onAttack) {
                targetShip.onAttack(G, ctx, from, to);
                return;
            }
            if (targetShip.compare) {
                addLog(G, 'response', null, null, {size: 1, ship_type: targetFig.type});
                let res = targetShip.compare(fig);
                battle(G, ctx, -res, from, to, [from], [to]);
                return;
            }
            G.attackFrom = from;
            G.attackTo = to;
            let isBlockableFrom = !!ship.strength;
            if (!isBlockableFrom) {
                G.attackBlock = 'not_required';
            }
            ctx.events.setActivePlayers({
                currentPlayer: isBlockableFrom && 'attackBlock',
                others: 'responseBlock',
                revert: true,
                moveLimit: 1,
            });
        },
        key: 'a',
        name: 'Attack'
    },
    Explode: {
        canFrom(G, player, from) {
            return true;
        },
        can(G, player, from, to) {
            return dist(from, to) == 0;
        },
        take(G, ctx, from, to) {
            Effects.Explode(G, from, to);
            repeatTurn(ctx);
        },
        key: 'e',
        name: 'Explode'
    },
    Shoot: {
        canFrom(G, player, from) {
            let ship = getShip(G, from);
            return checkPatron(G, player, ship, from);
        },
        can(G, player, from, to) {
            let ship = getShip(G, from);
            return checkPatron(G, player, ship, from) &&
                getPos(G, to) &&
                getPos(G, to).player != player &&
                ship.canShoot(G, player, from, to);
        },
        take(G, ctx, from, to) {
            let ship = getShip(G, from);
            addLog(G, 'shoot', from, to, {ship: getPos(G, from)});
            ship.shoot(G, ctx, from, to);
        },
        key: 's',
        name: 'Shoot'
    },
    RocketShootArea: {
        canFrom(G, player, from) {
            let ship = getShip(G, from);
            return checkPatron(G, player, ship, from);
        },
        can(G, player, from, to) {
            let ship = getShip(G, from);
            return checkPatron(G, player, ship, from) &&
                dist(from, to) > 0 && 
                Actions.RocketShootArea.canShoot(G, player, from, to);
        },
        canShoot(G, player, from, to) {
            return isStraight(from, to) && dist(from, to) <= 2;
        },
        take(G, ctx, from, to) {
            addLog(G, 'shoot', from, to, {ship: getPos(G, from), area: true});
            Effects.Explode(G, from, to);
            repeatTurn(ctx);
        },
        key: 'r',
        name: 'Shoot with area damage'
    }
};

function repeatTurn(ctx) {
    ctx.events.endTurn({next: ctx.currentPlayer});
}

const Effects = {
    Die(G, pos) {
        let sq = getPos(G, pos);
        if (!sq) {
            return;
        }
        addLog(G, 'die', pos, pos, {ship: sq});
        setPos(G, pos, null);
    },
    Win(G, ctx, from, to) {
        Effects.Die(G, to);
        repeatTurn(ctx);
    },
    Loose(G, ctx, from, to) {
        Effects.Die(G, from);
        ctx.events.endTurn();
    },
    Draw(G, ctx, fromBlock, toBlock) {
        fromBlock.forEach(el => Effects.Die(G, el));
        toBlock.forEach(el => Effects.Die(G, el));
        ctx.events.endTurn();
    },
    Explode(G, from, to) {
        let ship = getShip(G, from);
        addLog(G, 'explode', from, to, {ship: getPos(G, from)});
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
            Effects.Die(G, from);
            Effects.Die(G, to);
            ctx.events.endTurn();
        } else {
            Effects.Die(G, to);
            repeatTurn(ctx);
        } 
    },
    ExplodeBomb(G, ctx, from, to) {
        if (getPos(G, from)?.type != 'Tr') {
            Effects.Die(G, from)%
            Effects.Explode(G, to, to);
            ctx.events.endTurn();
        } else {
            Effects.Die(G, to);
            repeatTurn(ctx);
        } 
    },

};

const Ship = {
    actions: {
        place: [Actions.Place],
        move: [Actions.Move],
        attack: [],
    },
    maxMove:  1,
};

const AttackingShip = {
    actions: {
        place: [Actions.Place],
        move: [Actions.Move, Actions.Attack],
        attack: [Actions.Attack],
    },
    maxMove:  1,
};

const Missile = {
    actions: {
        place: [Actions.Place],
        move: [Actions.Move, Actions.Shoot],
        attack: [],
    },
    maxMove:  1,
    onAttack: Effects.ExplodeMine,
    shoot(G, ctx, from, to) {
        Effects.Die(G, from);
        if (getPos(G, to).type == 'F') {
            ctx.events.endTurn();
        } else {
            Effects.Die(G, to);
            repeatTurn(ctx);
        }
    }
};

const Bomb = {
    actions: {
        place: [Actions.Place],
        move: [Actions.Move, Actions.Explode],
        attack: [false, Actions.Explode],
    },
    maxMove:  1,
    onAttack: Effects.ExplodeBomb
};

const Ships = {
    Av: {...AttackingShip, strength: 11.390625},
    Sm: {...Missile, patron: "Av", canShoot(G, player, from, to) {
        let v = vector(from, to);
        return isStraight(from, to) || Math.abs(v[0]) == Math.abs(v[1]);
    }},
    Lk: {...AttackingShip, strength: 7.59375},
    Rk: {
        actions: {
            place: [Actions.Place],
            move: [Actions.Move, Actions.Shoot, Actions.RocketShootArea],
            attack: [],
        },
        maxMove:  1,
        onAttack: Effects.ExplodeMine,
        patron: "KrPl",
        canShoot: (G, player, from, to) => (isStraight(from, to) && dist(from, to) <= 3),
        blastRadius: 1,
        blastSquare(G, pos) {Effects.Die(G, pos);}
    },
    Kr: {...AttackingShip, strength: 5.0625},
    T: {...Missile, maxMove: 2, patron: "Tk", canShoot: (G, player, from, to) =>
        (dist(from, to) <= 4 && isStraight(from, to) && checkPath(G, false, false, false, from, to))
    },
    Rd: {...AttackingShip, strength: 5},
    Mn: {...Ship, patron: "Es", onAttack: Effects.ExplodeMine},
    Es: {...AttackingShip, strength: 3.375},
    Br: {...Missile,
        canShoot: (G, player, from, to) => (!G.usedBrander[player] && dist(from, to) == 1),
        shoot(G, ctx, from, to) {
            G.usedBrander[ctx.playerID] = 2;
            getPos(G, to).player = ctx.playerID;
    }},
    KrPl: {...AttackingShip, compare(ship) {
        if (ship.type == 'KrPl') return 0;
        if (['Kr', 'Rd', 'Es'].includes(ship.type)) return -1;
        return 1;
    }},
    AB: {...Bomb, blastRadius: 2, blastSquare(G, pos) {Effects.Die(G, pos);}},
    St: {...AttackingShip, strength: 2.25},
    NB: {...Bomb, blastRadius: 2, blastSquare(G, pos) {let ship = getPos(G, pos); if (ship) ship.player = -1;}},
    Tk: {...AttackingShip, maxMove: 2, strength: 1.5},
    F: {actions: {place: [Actions.Place], move: [], attack: []}, onAttack(G, ctx, from, to) {
        Effects.Win(G, ctx, from, to);
    }},
    Tr: {...AttackingShip, strength: 1},
    Tp: {...AttackingShip, compare(ship) {
        if (ship.type == 'Tp') return 0;
        return -1;
    }},
    Pl: {...AttackingShip, compare(ship) {
        if (ship.type == 'Pl') return 0;
        if (['Lk', 'Tp'].includes(ship.type)) return 1;
        return -1;
    }},
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
    if (getPos(G, from)?.player != player || !ctx.activePlayers) {
        return [];
    }
    let stage = ctx.activePlayers[player];
    if (!stage) {
        return [];
    }
    return getStageActions(G, ctx, stage, from);
};

export function getModeAction(G, ctx, player, mode, from) {
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
    return action
}

function makeMove(G, ctx, stage, mode, from, to) {
    if (!valid(from) || !valid(to)) {
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
    if (!action.can(G, ctx.playerID, from, to)) {
        return INVALID_MOVE;
    }
    action.take(G, ctx, from, to);
};

function Ready(G, ctx) {
    G.ready++;
    ctx.events.endStage();
}

const Place = {
    move(G, ctx, mode, from, to) {
        makeMove(G, ctx, 'place', mode, from, to);
    },
    redact: true
};

function Move(G, ctx, mode, from, to) {
    makeMove(G, ctx, 'move', mode, from, to);
};

function Skip(G, ctx) {
    ctx.events.endTurn();
};

const Attack = {
    move(G, ctx, mode, from, to) {
        makeMove(G, ctx, 'attack', mode, from, to);
    },
    client: false
};

const AttackBlock = {
    move(G, ctx, block) {
        if (!block.coords.some(el => dist(el, G.attackFrom) == 0) || !checkBlock(G, ctx.playerID, block.type, block.size, block.coords)) {
            return INVALID_MOVE;
        }
        G.attackBlock = block;
    },
    redact: true
};

const ResponseBlock = {
    move(G, ctx, block) {
        if (!block.coords.some(el => dist(el, G.attackTo) == 0) || !checkBlock(G, ctx.playerID, block.type, block.size, block.coords)) {
            return INVALID_MOVE;
        }
        addLog(G, 'response', null, null, {size: block.size, ship_type: block.type});
        G.responseBlock = block;
    },
    redact: true
};

const Label = {
    move(G, ctx, pos, label) {
        getPos(G, pos).label[ctx.playerID] = label;
    },
    redact: true,
    client: false,
}

export function takeMove(G, ctx, moves, mode, from, to) {
    if (ctx.phase == 'place') {
        moves.Place(mode, from, to);
    }
    let player = getPos(G, from)?.player;
    let stage = ctx.activePlayers[player];
    if (stage == 'move') {
        moves.Move(mode, from, to);
    } else if (stage == 'attack') {
        moves.Attack(mode, from, to);
    }
};

export const GameRules = {
    name: 'PhystechSeaBattle',
    minPlayers: 2,
    maxPlayers: 2,
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
                cells[Math.floor(i / SIZE)][i % SIZE] = {type: el[0], player: 0, state: {}, label: {}};
                i += 1;
            }
        }
        i = SIZE*SIZE - 1;
        for (let el of InitialShips) {
            for (let num = 0; num < el[1]; ++num) {
                cells[Math.floor(i / SIZE)][i % SIZE] = {type: el[0], player: 1, state: {}, label: {}};
                i -= 1;
            }
        }
        return {cells, ready: 0, usedBrander: {0: 0, 1: 0}, log: []};
    },
    phases: {place: {
        start: true,
        turn: {activePlayers: {all: 'place'}, stages: {
            place: {moves: { Ready, Place }},
        }},
        endIf: G => (G.ready >= 2),
        next: 'play'
    }, play: {
        turn: {order: TurnOrder.RESET, activePlayers: {currentPlayer: 'move', others: 'wait'}, stages: {
            move: {next: 'attack', moves: { Move, Label }},
            attack: {moves: { Attack, Skip, Label }},
            attackBlock: {moves: { AttackBlock, Label }},
            responseBlock: {moves: { ResponseBlock, Label }},
            wait: {moves: { Label }}
        }, onBegin(G) {
            for (let i = 0; i < 2; ++i) {
                G.usedBrander[i] = Math.max(0, G.usedBrander[i] - 1);
            }
        }, onMove(G, ctx) {
            if (G.attackBlock && G.responseBlock) {
                let ship = getShip(G, G.attackFrom);
                let targetShip = getShip(G, G.attackTo);
                if (ship.compare) {
                    let res = ship.compare(getPos(G, G.attackTo));
                    battle(G, ctx, res, G.attackFrom, G.attackTo, [G.attackFrom], [G.attackTo]);
                } else {
                    let res = getBlockStrength(G.attackBlock) - getBlockStrength(G.responseBlock);
                    battle(G, ctx, res, G.attackFrom, G.attackTo, G.attackBlock.coords, G.responseBlock.coords)
                }
                G.attackFrom = undefined;
                G.attackTo = undefined;
                G.attackBlock = undefined;
                G.responseBlock = undefined;
            }
        }},
    }},
    moves: {},
    
    endIf: (G, ctx) => {
        let fortCount = [0, 0];
        for (let i = 0; i < 14; ++i) {
            for (let j = 0; j < 14; ++j) {
                let cell = G.cells[i][j];
                if (cell?.type == 'F' && cell.player != -1) {
                    fortCount[cell.player]++;
                }
            }
        }
        if (fortCount[0] == 0 && fortCount[1] == 0) {
            return {winner: undefined};
        }
        for (let i = 0; i < 2; ++i) {
            if (fortCount[i] == 0) {
                return {winner: 1 - i};
            }
        } 
    },

    playerView(G, ctx, playerID) {
        G = deepcopy(G);
        for (let i = 0; i < SIZE; ++i) {
            for (let j = 0; j < SIZE; ++j) {
                if (ctx.phase == 'place' && !checkSide(G, playerID, [i, j])) {
                    G.cells[i][j] = null;
                    continue;
                }
                let cell = G.cells[i][j]
                if (cell && cell.player != playerID) {
                    cell.type = cell.player == -1 ? "Sinking" : "Unknown";
                    cell.state = {}
                }
                if (cell) {
                    cell.label = cell.label[playerID];
                }
                G.cells[i][j] = cell;
            }
        }
        return G
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
    disableUndo: true
};

export default GameRules;
