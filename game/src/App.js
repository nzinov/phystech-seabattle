import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import Board from './Board'
import GameRules from './Game'

const SeabattleClient = Client({ game: GameRules, board:  Board, multiplayer: Local()});

const App = () => (
    <div>
        <SeabattleClient playerID="0" />
        <SeabattleClient playerID="1" />
    </div>
)

export default App;
