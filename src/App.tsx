import { SocketIO } from 'boardgame.io/multiplayer';
import { Client } from 'boardgame.io/react';
import React, { useState } from 'react';
import Cookies from 'universal-cookie';
import { v4 as uuid } from 'uuid';
import Board from './Board';
import { DefaultGame, MicroGame, MiniGame } from './game';
import InstallPrompt from './InstallPrompt';
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

  const startGame = (gameMode: 'default' | 'mini' | 'micro') => {
    setIsLoading(true);

    // Initialize game parameters
    const search = window.location.search;
    let params = new URLSearchParams(search);

    if (!cookies.get('token')) {
      cookies.set('token', uuid(), {
        path: '/',
        sameSite: 'lax',
        secure: !import.meta.env.DEV,
      });
    }

    let matchID = params.get('match');
    let playerID = params.get('player');

    if (!matchID) {
      matchID = uuid();
      playerID = '0';
      params.set('match', matchID);
      params.set('player', playerID);
    }

    // Set game mode parameter
    params.delete('mini');
    params.delete('micro');
    if (gameMode === 'mini') {
      params.set('mini', '1');
    } else if (gameMode === 'micro') {
      params.set('micro', '1');
    }

    // Generate invite link for player 0 (without token for security)
    if (playerID === '0') {
      let other = new URL(window.location.href);
      let otherParams = new URLSearchParams(other.search);
      otherParams.set('match', matchID);
      otherParams.set('player', '1');
      otherParams.delete('token'); // Remove token from invite link for security
      if (gameMode === 'mini') {
        otherParams.set('mini', '1');
      } else if (gameMode === 'micro') {
        otherParams.set('micro', '1');
      }
      other.search = otherParams.toString();
      globalInviteLink = other.toString();
    }

    if (cookies.get('token') && !params.get('token')) {
      params.set('token', cookies.get('token'));
    }

    // Update URL and start game
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);

    setGameStarted(true);
    setIsLoading(false);
  };

  // Check if game should start immediately (when URL has match parameter)
  React.useEffect(() => {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    if (params.get('match')) {
      const gameMode =
        params.get('micro') === '1' ? 'micro' : params.get('mini') === '1' ? 'mini' : 'default';
      startGame(gameMode);
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
    return (
      <div>
        <MainPage onStartGame={startGame} />
        <InstallPrompt />
      </div>
    );
  }

  try {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    const matchID = params.get('match');
    const playerID = params.get('player');
    const gameMode =
      params.get('micro') === '1' ? 'micro' : params.get('mini') === '1' ? 'mini' : 'default';

    const gameRules =
      gameMode === 'micro' ? MicroGame : gameMode === 'mini' ? MiniGame : DefaultGame;

    const SeabattleClient = Client({
      game: gameRules,
      board: BoardWrapper,
      multiplayer: SocketIO({ server: getServerUrl() }),
      debug: { collapseOnLoad: true },
    });

    return (
      <div>
        <SeabattleClient matchID={matchID} playerID={playerID} credentials={cookies.get('token')} />
        <InstallPrompt />
      </div>
    );
  } catch (error: unknown) {
    console.error('App render error:', error);
    return <div>Error loading game: {(error as Error).message}</div>;
  }
};

export default App;
