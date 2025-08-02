import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const InstallPrompt: React.FC = () => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('pwa-install-dismissed') === 'true';
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt only on mobile devices or for testing
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

      // Show on mobile or localhost for testing, but not if dismissed
      if (!isDismissed && (isMobile || window.location.hostname === 'localhost')) {
        setShowInstallPrompt(true);
      }
    };

    // Check if already installed
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      return;
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Fallback for testing - show prompt after 2 seconds if no event fires
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt && !isDismissed && window.location.hostname === 'localhost') {
        setShowInstallPrompt(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(fallbackTimer);
    };
  }, [deferredPrompt, isDismissed]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show manual installation instructions
      alert(t('pwa.installInstructions'));
      setShowInstallPrompt(false);
      return;
    }

    try {
      deferredPrompt.prompt();
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showInstallPrompt || isDismissed) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        backgroundColor: '#1e3c72',
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{t('pwa.installTitle')}</div>
      <div style={{ fontSize: '14px', opacity: 0.9 }}>{t('pwa.installDescription')}</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleInstallClick}
          style={{
            backgroundColor: '#2a5298',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          {t('pwa.install')}
        </button>
        <button
          onClick={handleDismiss}
          style={{
            backgroundColor: 'transparent',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 1001,
          }}
        >
          {t('pwa.later')}
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
