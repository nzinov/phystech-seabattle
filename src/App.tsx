import { SocketIO } from 'boardgame.io/multiplayer';
import { Client } from 'boardgame.io/react';
import React from 'react';
import Cookies from 'universal-cookie';
import { v4 as uuid } from 'uuid';
import Board from './Board';
import { DefaultGame, MiniGame } from './Game';

// Store invite link globally for BoardWrapper access
let globalInviteLink: string | null = null;

// Wrapper component to pass invite link to Board
const BoardWrapper = (props: any) => {
  return <Board {...props} inviteLink={globalInviteLink} />;
};

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
let inviteLink: string | null = null;

if (!matchID) {
  matchID = uuid();
  playerID = '0';
  params.set('match', matchID);
  params.set('player', playerID);
  window.location.search = params.toString();
}

// Generate invite link for player 0 (without token for security)
if (playerID === '0') {
  let other = new URL(window.location.href);
  let otherParams = new URLSearchParams(other.search);
  otherParams.set('player', '1');
  otherParams.delete('token'); // Remove token from invite link for security
  other.search = otherParams.toString();
  inviteLink = other.toString();
}
if (!params.get('token')) {
  params.set('token', cookies.get('token'));
  window.location.search = params.toString();
}
console.log(matchID, playerID);

// Determine server URL based on environment
const getServerUrl = (): string => {
  // In development, use localhost:8000
  if (import.meta.env.DEV || window.location.hostname === 'localhost') {
    return 'http://localhost:8000';
  }
  // In production, use the same protocol and hostname as the current page
  return `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
};

const SeabattleClient = Client({
  game: params.get('mini') == '1' ? MiniGame : DefaultGame,
  board: BoardWrapper,
  multiplayer: SocketIO({ server: getServerUrl() }),
  debug: import.meta.env.DEV || window.location.hostname === 'localhost',
});

const App: React.FC = () => {
  try {
    // Store invite link globally for BoardWrapper access
    if (inviteLink) {
      globalInviteLink = inviteLink;
    }

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
