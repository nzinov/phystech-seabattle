import { Client } from 'boardgame.io/react';
import { Game } from 'boardgame.io/core';

const TicTacToe = Game({
    setup: () => ({ cells: Array(9).fill(null) }),

    moves: {
        clickCell(G, ctx, id) {
            let cells = [...G.cells]; // don't mutate original state.
            cells[id] = ctx.currentPlayer;
            return { ...G, cells }; // don't mutate original state.
        },
    },
});



const App = Client({ game: TicTacToe, board:  TicTacToeBoard });

export default App;
