import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer'
import Board from './Board'
import GameRules from './Game'
import Cookies from 'universal-cookie';
import {v4 as uuid} from "uuid";

const cookies = new Cookies();
const search = window.location.search;
let params = new URLSearchParams(search);

if (cookies.get('token') != params.get('token')) {
    let token = params.get('token');
    if (!token) {
        token = uuid();
    }
    cookies.set('token', token, { path: '/' });
}

let matchID = params.get('match');
let playerID = params.get('player');
if (!matchID) {
    matchID = uuid();
    playerID = 0;
    params.set('match', matchID);
    params.set('player', playerID);
    window.location.search = params.toString();
    let other = new URL(window.location);
    params.set('player', 1);
    other.search = params.toString();
    params.set('player', 0);
    prompt("Link to join (copy to clipboard): ", other.toString());
}
if (!params.get('token')) {
    params.set('token', cookies.get('token'));
    window.location.search = params.toString();
}
console.log(matchID, playerID);

const SeabattleClient = Client({ game: GameRules, board:  Board, multiplayer: SocketIO(), debug: false});

const App = () => {

    return <div>
        <SeabattleClient matchID={matchID} playerID={playerID} credentials={cookies.get('token')}/>
        </div>
}

export default App;
