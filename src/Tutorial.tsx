import React, { useMemo, useCallback, useState } from 'react';
import { Client } from 'boardgame.io/react';
import { createGameRules } from './game';
import Board from './Board';
import type { TutorialStep, TutorialMove } from './tutorialData';
import { tutorialSteps } from './tutorialData';
import './Tutorial.css';

interface TutorialProps {
  onExit: () => void;
}

const BoardWrapper = (props: any & { tutorialMove: TutorialMove; onMoveDone: () => void }) => {
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
        ...base.phases.place,
        start: step.state.phase === 'place',
      },
      play: {
        ...base.phases.play,
        start: step.state.phase === 'play',
      },
    },
  };
}

const Tutorial: React.FC<TutorialProps> = ({ onExit }) => {
  const [index, setIndex] = useState(0);
  const [moveIndex, setMoveIndex] = useState(0);
  const [stepDone, setStepDone] = useState(false);
  const step = tutorialSteps[index];

  const handleMoveDone = useCallback(() => {
    if (moveIndex < step.moves.length - 1) {
      setMoveIndex(i => i + 1);
    } else {
      setStepDone(true);
    }
  }, [moveIndex, step]);

  const nextStep = useCallback(() => {
    if (index < tutorialSteps.length - 1) {
      setIndex(i => i + 1);
      setMoveIndex(0);
      setStepDone(false);
    } else {
      onExit();
    }
  }, [index, onExit]);

  const TutorialClient = useMemo(() => {
    const game = createTutorialGame(step);
    return Client({
      game,
      board: props => (
        <BoardWrapper {...props} tutorialMove={step.moves[moveIndex]} onMoveDone={handleMoveDone} />
      ),
      debug: false,
      numPlayers: 2,
    });
  }, [step, moveIndex, handleMoveDone]);

  return (
    <div className="tutorial-container">
      <div className="tutorial-board">
        <TutorialClient key={index} matchID="0" playerID="0" />
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
