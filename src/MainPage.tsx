import React from 'react';
import './MainPage.css';

interface MainPageProps {
  onStartGame: (mini: boolean) => void;
}

const MainPage: React.FC<MainPageProps> = ({ onStartGame }) => {
  const gameDescription = `
    Морской бой по-физтеховски - стратегическая морская битва с уникальными правилами. Игра проходит на поле 14×14 клеток с 21 типом кораблей, 
    каждый из которых обладает особыми способностями, а противник не знает какой из ваших кораблей какого типа.
  `;

  const handleStartRegular = () => {
    onStartGame(false);
  };

  const handleStartMini = () => {
    onStartGame(true);
  };

  return (
    <div className="main-page">
      <div className="main-content">
        <h1>Морской бой по-физтеховски</h1>

        <div className="game-description">
          <p>{gameDescription}</p>
        </div>

        <div className="game-modes">
          <button className="game-button regular-game" onClick={handleStartRegular}>
            <h3>Обычная игра</h3>
            <p>Полная версия с 21 типом кораблей</p>
          </button>

          <button className="game-button mini-game" onClick={handleStartMini}>
            <h3>Мини-игра</h3>
            <p>Упрощенная версия для быстрой игры на поле 10х10</p>
          </button>
        </div>

        <div className="rules-section">
          <a className="rules-button" href="rules.html">
            Правила игры
          </a>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
