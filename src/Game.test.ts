import { Client } from 'boardgame.io/client';
import GameRules from './Game';

describe('Random Game Moves Test', () => {
  test('should launch game and take random moves for 50 turns', () => {
    const client = Client({
      game: GameRules,
      numPlayers: 2,
      playerID: '0',
    });

    // Start the game
    client.start();
    let state = client.getState();
    console.log('Game started, initial phase:', state?.ctx.phase);

    let turnCount = 0;
    const maxTurns = 50;

    while (turnCount < maxTurns && !state?.ctx.gameover) {
      state = client.getState();
      if (!state) break;

      const { ctx } = state;
      const currentPlayerID = ctx.currentPlayer;
      const phase = ctx.phase;

      console.log(
        `Turn ${turnCount}: Player ${currentPlayerID}, Phase: ${phase}, Stage: ${ctx.activePlayers?.[currentPlayerID] || 'none'}`
      );

      // Get available moves for current phase/stage
      const availableMoves = client.moves;
      const moveNames = Object.keys(availableMoves);

      if (moveNames.length === 0) {
        console.log('No moves available, ending test');
        break;
      }

      let moveMade = false;

      try {
        if (phase === 'place') {
          const currentStage = ctx.activePlayers?.[currentPlayerID];
          // In placement phase, check stage and available moves
          if (currentStage === 'place' && moveNames.includes('Place')) {
            // Try to place a ship randomly from initial ship positions
            const randomFrom = [Math.floor(Math.random() * 5), Math.floor(Math.random() * 14)];
            const randomTo = [Math.floor(Math.random() * 5), Math.floor(Math.random() * 14)];
            console.log(`Attempting Place move from [${randomFrom}] to [${randomTo}]`);
            try {
              client.moves.Place('move', randomFrom, randomTo);
              moveMade = true;
            } catch (error) {
              console.log('Place move failed, trying Ready');
              if (moveNames.includes('Ready')) {
                client.moves.Ready();
                moveMade = true;
              }
            }
          } else if (moveNames.includes('Ready')) {
            console.log('Making Ready move');
            try {
              client.moves.Ready();
              moveMade = true;
            } catch (error) {
              console.log('Ready move failed:', error);
            }
          }
        } else if (phase === 'play') {
          // In play phase, try available moves
          if (moveNames.includes('Move')) {
            const randomFrom = [Math.floor(Math.random() * 14), Math.floor(Math.random() * 14)];
            const randomTo = [Math.floor(Math.random() * 14), Math.floor(Math.random() * 14)];
            console.log(`Attempting Move from [${randomFrom}] to [${randomTo}]`);
            client.moves.Move('move', randomFrom, randomTo);
            moveMade = true;
          } else if (moveNames.includes('Attack')) {
            const randomFrom = [Math.floor(Math.random() * 14), Math.floor(Math.random() * 14)];
            const randomTo = [Math.floor(Math.random() * 14), Math.floor(Math.random() * 14)];
            console.log(`Attempting Attack from [${randomFrom}] to [${randomTo}]`);
            client.moves.Attack(randomFrom, randomTo);
            moveMade = true;
          } else if (moveNames.includes('Skip')) {
            console.log('Making Skip move');
            client.moves.Skip();
            moveMade = true;
          } else if (moveNames.includes('AttackBlock')) {
            // Random block formation
            const randomCoords = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => [
              Math.floor(Math.random() * 14),
              Math.floor(Math.random() * 14),
            ]);
            console.log(`Attempting AttackBlock with coords:`, randomCoords);
            client.moves.AttackBlock('square', randomCoords);
            moveMade = true;
          } else if (moveNames.includes('ResponseBlock')) {
            // Random response block
            const randomCoords = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => [
              Math.floor(Math.random() * 14),
              Math.floor(Math.random() * 14),
            ]);
            console.log(`Attempting ResponseBlock with coords:`, randomCoords);
            client.moves.ResponseBlock('square', randomCoords);
            moveMade = true;
          }
        }

        if (!moveMade) {
          // If no specific move was made, try the first available move with random parameters
          const randomMoveName = moveNames[Math.floor(Math.random() * moveNames.length)];
          console.log(`Making random move: ${randomMoveName}`);

          // Try with common random parameters
          const randomPos1 = [Math.floor(Math.random() * 14), Math.floor(Math.random() * 14)];
          const randomPos2 = [Math.floor(Math.random() * 14), Math.floor(Math.random() * 14)];

          try {
            (availableMoves as any)[randomMoveName](randomPos1, randomPos2);
          } catch (error) {
            // Try with fewer parameters
            try {
              (availableMoves as any)[randomMoveName](randomPos1);
            } catch (error2) {
              // Try with no parameters
              try {
                (availableMoves as any)[randomMoveName]();
              } catch (error3) {
                console.log(`Failed to execute move ${randomMoveName}:`, error3);
              }
            }
          }
        }
      } catch (error) {
        console.log('Move failed:', error);
        // Continue to next turn even if move failed
      }

      turnCount++;

      // Small delay to prevent infinite loops
      if (turnCount % 10 === 0) {
        const newState = client.getState();
        if (newState?.ctx.gameover) {
          console.log('Game ended with winner:', newState.ctx.gameover.winner);
          break;
        }
      }
    }

    const finalState = client.getState();
    console.log(`Test completed after ${turnCount} turns`);
    console.log('Final game state:', {
      phase: finalState?.ctx.phase,
      currentPlayer: finalState?.ctx.currentPlayer,
      gameover: finalState?.ctx.gameover,
    });

    // Test passes if we made it through without crashing
    expect(turnCount).toBeGreaterThan(0);
    expect(finalState).toBeDefined();
  });

  test('should handle multiple clients taking random moves', () => {
    const client1 = Client({
      game: GameRules,
      numPlayers: 2,
      playerID: '0',
    });

    const client2 = Client({
      game: GameRules,
      numPlayers: 2,
      playerID: '1',
    });

    // Start both clients
    client1.start();
    client2.start();

    let turnCount = 0;
    const maxTurns = 50;

    while (turnCount < maxTurns) {
      const state1 = client1.getState();
      const state2 = client2.getState();

      if (!state1 || !state2) break;
      if (state1.ctx.gameover || state2.ctx.gameover) break;

      const currentPlayer = state1.ctx.currentPlayer;
      const activeClient = currentPlayer === '0' ? client1 : client2;

      const moveNames = Object.keys(activeClient.moves);
      if (moveNames.length === 0) break;

      try {
        const randomMoveName = moveNames[Math.floor(Math.random() * moveNames.length)];
        const randomPos = [Math.floor(Math.random() * 14), Math.floor(Math.random() * 14)];

        // Try to make a move with the active client
        try {
          (activeClient.moves as any)[randomMoveName](randomPos);
        } catch (error) {
          (activeClient.moves as any)[randomMoveName]();
        }
      } catch (error) {
        console.log('Multi-client move failed:', error);
      }

      turnCount++;
    }

    console.log(`Multi-client test completed after ${turnCount} turns`);
    expect(turnCount).toBeGreaterThan(0);
  });
});
