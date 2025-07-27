import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import Board from './Board';
import GameRules from './Game';
import Cookies from 'universal-cookie';
import { v4 as uuid } from 'uuid';
import React from 'react';

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
  playerID = '0';
  params.set('match', matchID);
  params.set('player', playerID);
  window.location.search = params.toString();
  let other = new URL(window.location.href);
  params.set('player', '1');
  other.search = params.toString();
  params.set('player', '0');
  prompt('Link to join (copy to clipboard): ', other.toString());
}
if (!params.get('token')) {
  params.set('token', cookies.get('token'));
  window.location.search = params.toString();
}
console.log(matchID, playerID);

// Determine server URL based on environment
const getServerUrl = (): string => {
  // In development, use localhost:8000
  if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
    return 'http://localhost:8000';
  }
  // In production, use the same protocol and hostname as the current page
  return `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
};

const SeabattleClient = Client({
  game: GameRules,
  board: Board,
  multiplayer: SocketIO({ server: getServerUrl() }),
  debug: process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost',
});

const App: React.FC = () => {
  try {
    return (
      <div>
        <SeabattleClient matchID={matchID} playerID={playerID} credentials={cookies.get('token')} />
      </div>
    );
  } catch (error: unknown) {
    console.error('App render error:', error);
    return <div>Error loading game: {(error as Error).message}</div>;
  }
};

export default App;
