import type { i18n } from 'i18next';

export class NotificationService {
  private isWindowFocused = true;
  private notification: Notification | null = null;
  private i18nInstance: i18n | null = null;

  constructor() {
    this.setupFocusListeners();
    this.requestPermission();
  }

  public setI18n(i18nInstance: i18n): void {
    this.i18nInstance = i18nInstance;
  }

  private setupFocusListeners(): void {
    window.addEventListener('focus', () => {
      this.isWindowFocused = true;
    });

    window.addEventListener('blur', () => {
      this.isWindowFocused = false;
    });

    // Handle page visibility changes (for mobile/tab switching)
    document.addEventListener('visibilitychange', () => {
      this.isWindowFocused = !document.hidden;
    });
  }

  private async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  public async notifyPlayerTurn(): Promise<void> {
    // Only notify if it's the player's turn, window is not focused, and we haven't already notified for this turn
    if (this.isWindowFocused) {
      return;
    }

    if (this.notification) {
      this.notification.close();
      this.notification = null;
    }

    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      return;
    }

    // Get translated strings or fallback to Russian
    const title = this.i18nInstance?.t('game.notification.title') || 'Морской бой по‑физтеховски';
    const body = this.i18nInstance?.t('game.notification.yourTurn') || 'Ваш ход!';

    this.notification = new Notification(title, {
      body: body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'player-turn', // This ensures only one notification at a time
      requireInteraction: false,
      silent: false,
    });

    // Focus window when notification is clicked
    this.notification.onclick = () => {
      window.focus();
      this.notification!.close();
      this.notification = null;
    };
  }

  public cancel(): void {
    if (this.notification !== null) {
      this.notification.close();
      this.notification = null;
    }
  }

  public destroy(): void {
    // Clean up listeners if needed
  }
}

// Singleton instance
export const notificationService = new NotificationService();
