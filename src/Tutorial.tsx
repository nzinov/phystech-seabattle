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

const BoardWrapper = (props: any & { tutorialMove: TutorialMove; onDone: () => void }) => {
  return <Board {...props} tutorialMove={props.tutorialMove} onTutorialMoveDone={props.onDone} />;
};

function createTutorialGame(step: TutorialStep) {
  const base = createGameRules(step.state.config!);
  return {
    ...base,
    setup: () => step.state,
    phases: {
      play: { ...base.phases.play, start: true },
    },
  };
}

const Tutorial: React.FC<TutorialProps> = ({ onExit }) => {
  const [index, setIndex] = useState(0);
  const step = tutorialSteps[index];

  const handleDone = useCallback(() => {
    if (index < tutorialSteps.length - 1) {
      setIndex(i => i + 1);
    } else {
      onExit();
    }
  }, [index, onExit]);

  const TutorialClient = useMemo(() => {
    const game = createTutorialGame(step);
    return Client({
      game,
      board: props => <BoardWrapper {...props} tutorialMove={step.move} onDone={handleDone} />,
      debug: false,
      numPlayers: 2,
    });
  }, [step, handleDone]);

  return (
    <div className="tutorial-container">
      <div className="tutorial-board">
        <TutorialClient key={index} matchID="0" playerID="0" />
      </div>
      <div className="tutorial-panel">
        <div className="tutorial-description">{step.description}</div>
        <button onClick={onExit}>Выйти</button>
      </div>
    </div>
  );
};

export default Tutorial;
