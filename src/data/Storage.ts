import { GameSettings, HighScoreEntry } from '@/types/GameTypes';
import { DEFAULT_SETTINGS } from '@/data/Config';

const STORAGE_KEYS = {
  HIGH_SCORES: 'openclaw_high_scores',
  SETTINGS: 'openclaw_settings',
  PROGRESS: 'openclaw_progress',
};

const MAX_HIGH_SCORES = 10;

export class Storage {
  private isAvailable: boolean;

  constructor() {
    this.isAvailable = this.checkAvailability();
  }

  private checkAvailability(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      console.warn('LocalStorage is not available');
      return false;
    }
  }

  public saveHighScore(score: number, wave: number): void {
    if (!this.isAvailable) return;

    const scores = this.getHighScores();
    const entry: HighScoreEntry = {
      score,
      wave,
      date: new Date().toISOString(),
    };

    scores.push(entry);
    scores.sort((a, b) => b.score - a.score);
    
    // Keep only top scores
    const topScores = scores.slice(0, MAX_HIGH_SCORES);

    try {
      localStorage.setItem(STORAGE_KEYS.HIGH_SCORES, JSON.stringify(topScores));
    } catch (error) {
      console.error('Failed to save high score:', error);
    }
  }

  public getHighScores(): HighScoreEntry[] {
    if (!this.isAvailable) return [];

    try {
      const data = localStorage.getItem(STORAGE_KEYS.HIGH_SCORES);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to read high scores:', error);
    }

    return [];
  }

  public getTopScore(): number {
    const scores = this.getHighScores();
    return scores.length > 0 ? scores[0].score : 0;
  }

  public saveSettings(settings: GameSettings): void {
    if (!this.isAvailable) return;

    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  public getSettings(): GameSettings {
    if (!this.isAvailable) return { ...DEFAULT_SETTINGS };

    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        // Merge with defaults to ensure all fields exist
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error('Failed to read settings:', error);
    }

    return { ...DEFAULT_SETTINGS };
  }

  public saveProgress(data: unknown): void {
    if (!this.isAvailable) return;

    try {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  public getProgress(): unknown | null {
    if (!this.isAvailable) return null;

    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to read progress:', error);
    }

    return null;
  }

  public clearProgress(): void {
    if (!this.isAvailable) return;

    try {
      localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    } catch (error) {
      console.error('Failed to clear progress:', error);
    }
  }

  public clearAll(): void {
    if (!this.isAvailable) return;

    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
}
