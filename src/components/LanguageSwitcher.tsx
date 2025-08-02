import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('ru') ? 'en' : 'ru';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '8px 12px',
        backgroundColor: '#1e3c72',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}
      title={i18n.language.startsWith('ru') ? 'Switch to English' : 'Switch to Russian'}
    >
      {i18n.language.startsWith('ru') ? 'EN' : 'RU'}
    </button>
  );
};

export default LanguageSwitcher;
