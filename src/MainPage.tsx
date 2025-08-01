import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './MainPage.css';
import { shipNames } from './Texts';
import LanguageSwitcher from './components/LanguageSwitcher';

interface MainPageProps {
  onStartGame: (gameMode: 'default' | 'mini' | 'micro') => void;
}

const MainPage: React.FC<MainPageProps> = ({ onStartGame }) => {
  const { t } = useTranslation();

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
    onStartGame('default');
  };

  const handleStartMini = () => {
    onStartGame('mini');
  };

  const handleStartMicro = () => {
    onStartGame('micro');
  };

  const currentShip = shipTypes[currentShipIndex];
  const currentShipName = t(`ships.${currentShip}`);
  const currentShipDescription = `<p><b>${currentShipName}</b><br><br>${t(`shipDescriptions.${currentShip}`)}</p>`;

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
      <LanguageSwitcher />
      <div className="main-content">
        <div className="main-left">
          <h1>{t('game.title')}</h1>

          <div className="game-description">
            <p>{t('game.description')}</p>
          </div>

          <div className="game-modes">
            <button className="game-button regular-game" onClick={handleStartRegular}>
              <h3>{t('game.startRegular')}</h3>
              <p>{t('gameDescriptions.regular')}</p>
            </button>

            <button className="game-button mini-game" onClick={handleStartMini}>
              <h3>{t('game.startMini')}</h3>
              <p>{t('gameDescriptions.mini')}</p>
            </button>

            <button className="game-button micro-game" onClick={handleStartMicro}>
              <h3>{t('game.startMicro')}</h3>
              <p>{t('gameDescriptions.micro')}</p>
            </button>
          </div>

          <div className="rules-section">
            <a className="rules-button" href="rules.html">
              {t('game.rules')}
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
