import { Client } from 'boardgame.io/react';
import Board from './Board'
import GameRules from './Game'

const App = Client({ game: GameRules, board:  Board, multiplayer: false});

export default App;
