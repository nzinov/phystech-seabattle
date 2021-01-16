import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer'
import Board from './Board'
import GameRules from './Game'
import Cookies from 'universal-cookie';
import {v4 as uuid} from "uuid";

const cookies = new Cookies();
if (!cookies.get('token')) {
    cookies.set('token', uuid(), { path: '/' });
}

const search = window.location.search;
let params = new URLSearchParams(search);
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
    prompt("Link to join (copy to clipboard): ", other.toString());
}
console.log(matchID, playerID);

const SeabattleClient = Client({ game: GameRules, board:  Board, multiplayer: SocketIO(), debug: false});

const App = () => {

    return <div>
        <SeabattleClient matchID={matchID} playerID={playerID} credentials={cookies.get('token')}/>
        </div>
}

export default App;
