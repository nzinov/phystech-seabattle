import React, { useMemo, useCallback, useState, useRef } from 'react';
import { Client } from 'boardgame.io/react';
import { createGameRules } from './game';
import Board from './Board';
import type { TutorialStep, TutorialMove } from './tutorialData';
import { tutorialSteps } from './tutorialData';
import './Tutorial.css';

interface TutorialProps {
  onExit: () => void;
}

const BoardWrapper = (
  props: any & {
    tutorialMove: TutorialMove;
    onMoveDone: () => void;
    onClientReady?: (client: any) => void;
  }
): React.ReactElement => {
  // Capture client instance for auto-declarations with stable reference
  const { onClientReady, moves, G, ctx } = props;
  const lastNotificationRef = React.useRef<string>('');

  React.useEffect(() => {
    if (onClientReady && moves && G && ctx) {
      // Create a stable key to prevent excessive notifications
      const currentKey = `${ctx.turn}-${ctx.currentPlayer}-${ctx.phase}`;
      if (currentKey !== lastNotificationRef.current) {
        lastNotificationRef.current = currentKey;
        onClientReady({ moves, G, ctx });
      }
    }
  }, [moves, G, ctx, onClientReady]);

  return (
    <Board {...props} tutorialMove={props.tutorialMove} onTutorialMoveDone={props.onMoveDone} />
  );
};

function createTutorialGame(step: TutorialStep) {
  const base = createGameRules(step.state.config!);
  return {
    ...base,
    setup: () => step.state,
    phases: {
      place: {
        ...(base.phases as any).place,
        start: step.state.phase === 'place',
      },
      play: {
        ...(base.phases as any).play,
        start: step.state.phase === 'play',
      },
    },
  };
}

const Tutorial: React.FC<TutorialProps> = ({ onExit }) => {
  const [index, setIndex] = useState(0);
  const [moveIndex, setMoveIndex] = useState(0);
  const [stepDone, setStepDone] = useState(false);
  const [clientInstance, setClientInstance] = useState<any>(null);
  const clientRef = useRef<any>(null);
  const autoDeclarationProcessed = useRef<Set<string>>(new Set());
  const step = tutorialSteps[index];

  const handleMoveDone = useCallback(() => {
    if (moveIndex < step.moves.length - 1) {
      setMoveIndex(i => i + 1);
    } else {
      setStepDone(true);
    }
  }, [moveIndex, step]);

  const handleClientReady = useCallback((client: any) => {
    setClientInstance(client);
  }, []);

  // Auto-handle opponent declarations
  React.useEffect(() => {
    if (!clientInstance || !clientInstance.G || !clientInstance.ctx) {
      return;
    }

    const { G, ctx } = clientInstance;
    const opponentID = '1';
    const opponentStage = ctx.activePlayers?.[opponentID];

    // Create unique key for this attack to prevent duplicate processing
    const attackKey = G.attackTo ? `${G.attackTo[0]}-${G.attackTo[1]}-${ctx.turn}` : null;

    // Only process if we haven't already handled this attack
    if (!attackKey || autoDeclarationProcessed.current.has(attackKey)) {
      return;
    }

    // If opponent needs to declare a response block
    if (opponentStage === 'responseBlock' && G.attackTo && ctx.currentPlayer === '0') {
      const targetShip = G.cells[G.attackTo[0]][G.attackTo[1]];
      if (targetShip && (targetShip.type === 'St' || targetShip.type === 'Lk')) {
        // Mark this attack as processed
        autoDeclarationProcessed.current.add(attackKey);

        console.log('Auto-declaring opponent ship:', targetShip.type, 'for attack:', attackKey);

        // Auto-declare the target ship for the opponent after a delay
        const timer = setTimeout(() => {
          // Double-check the game state hasn't changed
          if (G.attackTo && !G.responseBlock) {
            const responseBlock = {
              type: targetShip.type,
              size: 1,
              coords: [G.attackTo],
            };

            console.log('Setting responseBlock directly:', responseBlock);
            G.responseBlock = responseBlock;
          }
        }, 1000);

        return () => {
          clearTimeout(timer);
          // Don't remove from processed set in cleanup to prevent re-processing
        };
      }
    }
  }, [clientInstance]);

  const nextStep = useCallback(() => {
    // Clear processed attacks when moving to next step
    autoDeclarationProcessed.current.clear();

    if (index < tutorialSteps.length - 1) {
      setIndex(i => i + 1);
      setMoveIndex(0);
      setStepDone(false);
      setClientInstance(null); // Reset client instance for new step
    } else {
      onExit();
    }
  }, [index, onExit]);

  const TutorialClient = useMemo(() => {
    const game = createTutorialGame(step);
    const ClientClass = Client({
      game,
      board: (props: any) => (
        <BoardWrapper
          {...props}
          tutorialMove={step.moves[moveIndex]}
          onMoveDone={handleMoveDone}
          onClientReady={handleClientReady}
        />
      ),
      debug: false,
      numPlayers: 2,
      multiplayer: false, // Use local mode for full control
    });
    return ClientClass;
  }, [step, moveIndex, handleMoveDone, handleClientReady]);

  return (
    <div className="tutorial-container">
      <div className="tutorial-board">
        <TutorialClient key={index} matchID="0" playerID="0" ref={clientRef} />
      </div>
      <div className="tutorial-panel">
        <div className="tutorial-description">{step.description}</div>
        {stepDone && (
          <button className="tutorial-next" onClick={nextStep}>
            Далее
          </button>
        )}
        <button onClick={onExit}>Выйти</button>
      </div>
    </div>
  );
};

export default Tutorial;
