import React, { useEffect, useState } from 'react';
import './MainPage.css';
import { shipInfo, shipNames } from './Texts';

interface MainPageProps {
  onStartGame: (mini: boolean) => void;
  onStartTutorial: () => void;
}

const MainPage: React.FC<MainPageProps> = ({ onStartGame, onStartTutorial }) => {
  const gameDescription = `
    Морской бой по-физтеховски - стратегическая морская битва с уникальными правилами. Игра проходит на поле 14×14 клеток с 19 типами кораблей, 
    каждый из которых обладает особыми способностями, а противник не знает какой из ваших кораблей какого типа.
  `;

  // Ship types for rotation (excluding Unknown and Sinking)
  const shipTypes = Object.keys(shipNames).filter(key => key !== 'Unknown' && key !== 'Sinking');
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false); // Start fade out

      setTimeout(() => {
        setCurrentShipIndex(prev => (prev + 1) % shipTypes.length);
        setIsVisible(true); // Start fade in
      }, 500); // Half second for fade out, then change content
    }, 4000); // Change ship every 4 seconds (slower)

    return () => clearInterval(interval);
  }, [shipTypes.length]);

  const handleStartRegular = () => {
    onStartGame(false);
  };

  const handleStartMini = () => {
    onStartGame(true);
  };

  const handleStartTutorial = () => {
    onStartTutorial();
  };

  const currentShip = shipTypes[currentShipIndex];
  const currentShipName = shipNames[currentShip as keyof typeof shipNames];
  const currentShipDescription = shipInfo[currentShip as keyof typeof shipInfo];

  // Extract clean text from HTML description and remove ship name
  const getCleanDescription = (htmlText: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlText;
    let text = tempDiv.textContent || tempDiv.innerText || '';

    // Remove the ship name from the beginning of the description
    // Pattern: "Ship Name" followed by line breaks
    const shipNamePattern = new RegExp(`^${currentShipName}\\s*`, 'i');
    text = text.replace(shipNamePattern, '').trim();

    return text;
  };

  return (
    <div className="main-page">
      <div className="main-content">
        <div className="main-left">
          <h1>Морской бой по&#8209;физтеховски</h1>

          <div className="game-description">
            <p>{gameDescription}</p>
          </div>

          <div className="game-modes">
            <button className="game-button regular-game" onClick={handleStartRegular}>
              <h3>Обычная игра</h3>
              <p>Полная версия с 19 типами кораблей</p>
            </button>

            <button className="game-button mini-game" onClick={handleStartMini}>
              <h3>Мини-игра</h3>
              <p>Упрощенная версия для быстрой игры на поле 10х10</p>
            </button>

            <button className="game-button tutorial-game" onClick={handleStartTutorial}>
              <h3>Обучение</h3>
              <p>Пошаговое руководство</p>
            </button>
          </div>

          <div className="rules-section">
            <a className="rules-button" href="rules.html">
              Правила игры
            </a>
          </div>
        </div>

        <div className="main-right">
          <div className="ship-preview">
            <div className={`ship-showcase ${isVisible ? 'visible' : 'hidden'}`}>
              <img
                src={`figures/${currentShip}.png`}
                alt={currentShipName}
                className="ship-image"
              />
              <div className="ship-info-display">
                <h3>{currentShipName}</h3>
                <div className="ship-description">
                  {getCleanDescription(currentShipDescription)}
                </div>
                <div className="ship-counter">
                  {currentShipIndex + 1} / {shipTypes.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
