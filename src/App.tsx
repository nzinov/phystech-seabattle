import { SocketIO } from 'boardgame.io/multiplayer';
import { Client } from 'boardgame.io/react';
import React, { useState } from 'react';
import Cookies from 'universal-cookie';
import { v4 as uuid } from 'uuid';
import Board from './Board';
import { DefaultGame, MiniGame } from './game';
import MainPage from './MainPage';

// Store invite link globally for BoardWrapper access
let globalInviteLink: string | null = null;

// Wrapper component to pass invite link to Board
const BoardWrapper = (props: any) => {
  return <Board {...props} inviteLink={globalInviteLink} />;
};

const cookies = new Cookies();

// Determine server URL based on environment
const getServerUrl = (): string => {
  // In development, use localhost:8000
  if (import.meta.env.DEV || window.location.hostname === 'localhost') {
    return 'http://localhost:8000';
  }
  // In production, use the same protocol and hostname as the current page
  return `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
};

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const startGame = (mini: boolean) => {
    setIsLoading(true);

    // Initialize game parameters
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
    }

    // Set mini game parameter
    if (mini) {
      params.set('mini', '1');
    } else {
      params.delete('mini');
    }

    // Generate invite link for player 0 (without token for security)
    if (playerID === '0') {
      let other = new URL(window.location.href);
      let otherParams = new URLSearchParams(other.search);
      otherParams.set('player', '1');
      otherParams.delete('token'); // Remove token from invite link for security
      if (mini) {
        otherParams.set('mini', '1');
      }
      other.search = otherParams.toString();
      globalInviteLink = other.toString();
    }

    if (!params.get('token')) {
      params.set('token', cookies.get('token'));
    }

    // Update URL and start game
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    console.log(matchID, playerID);

    setGameStarted(true);
    setIsLoading(false);
  };

  // Check if game should start immediately (when URL has match parameter)
  React.useEffect(() => {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    if (params.get('match')) {
      startGame(params.get('mini') === '1');
    }
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          color: 'white',
          fontSize: '1.5rem',
        }}
      >
        Загрузка игры...
      </div>
    );
  }

  if (!gameStarted) {
    return <MainPage onStartGame={startGame} />;
  }

  try {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    const matchID = params.get('match');
    const playerID = params.get('player');
    const mini = params.get('mini') === '1';

    const SeabattleClient = Client({
      game: mini ? MiniGame : DefaultGame,
      board: BoardWrapper,
      multiplayer: SocketIO({ server: getServerUrl() }),
      debug: { collapseOnLoad: true },
    });

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
