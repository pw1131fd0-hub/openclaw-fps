import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Storage } from '@/data/Storage';
import { GameSettings } from '@/types/GameTypes';
import { DEFAULT_SETTINGS } from '@/data/Config';

describe('Storage', () => {
  let storage: Storage;

  beforeEach(() => {
    localStorage.clear();
    storage = new Storage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('High Scores', () => {
    it('should save a high score', () => {
      storage.saveHighScore(1000, 5);
      const scores = storage.getHighScores();
      expect(scores.length).toBe(1);
      expect(scores[0].score).toBe(1000);
      expect(scores[0].wave).toBe(5);
      expect(scores[0].date).toBeDefined();
    });

    it('should sort scores from highest to lowest', () => {
      storage.saveHighScore(500, 3);
      storage.saveHighScore(1000, 5);
      storage.saveHighScore(750, 4);
      const scores = storage.getHighScores();
      expect(scores[0].score).toBe(1000);
      expect(scores[1].score).toBe(750);
      expect(scores[2].score).toBe(500);
    });

    it('should limit to top 10 scores', () => {
      for (let i = 1; i <= 15; i++) {
        storage.saveHighScore(i * 100, i);
      }
      const scores = storage.getHighScores();
      expect(scores.length).toBe(10);
      expect(scores[0].score).toBe(1500);
      expect(scores[9].score).toBe(600);
    });

    it('should return empty array when no scores', () => {
      const scores = storage.getHighScores();
      expect(scores).toEqual([]);
    });

    it('should get top score', () => {
      storage.saveHighScore(500, 3);
      storage.saveHighScore(1000, 5);
      expect(storage.getTopScore()).toBe(1000);
    });

    it('should return 0 when no top score', () => {
      expect(storage.getTopScore()).toBe(0);
    });
  });

  describe('Settings', () => {
    it('should save and retrieve settings', () => {
      const settings: GameSettings = {
        ...DEFAULT_SETTINGS,
        musicVolume: 0.8,
        sfxVolume: 0.6,
        invertY: true,
      };
      storage.saveSettings(settings);
      const retrieved = storage.getSettings();
      expect(retrieved.musicVolume).toBe(0.8);
      expect(retrieved.sfxVolume).toBe(0.6);
      expect(retrieved.invertY).toBe(true);
    });

    it('should return default settings when none saved', () => {
      const settings = storage.getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should merge with defaults for partial settings', () => {
      localStorage.setItem(
        'openclaw_settings',
        JSON.stringify({ musicVolume: 0.3 })
      );
      const settings = storage.getSettings();
      expect(settings.musicVolume).toBe(0.3);
      expect(settings.sfxVolume).toBe(DEFAULT_SETTINGS.sfxVolume);
    });
  });

  describe('Progress', () => {
    it('should save and retrieve progress', () => {
      const progress = { level: 5, checkpoints: [1, 2, 3] };
      storage.saveProgress(progress);
      const retrieved = storage.getProgress() as { level: number; checkpoints: number[] };
      expect(retrieved.level).toBe(5);
      expect(retrieved.checkpoints).toEqual([1, 2, 3]);
    });

    it('should return null when no progress', () => {
      expect(storage.getProgress()).toBeNull();
    });

    it('should clear progress', () => {
      storage.saveProgress({ test: true });
      storage.clearProgress();
      expect(storage.getProgress()).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should clear all stored data', () => {
      storage.saveHighScore(1000, 5);
      storage.saveSettings({ ...DEFAULT_SETTINGS, musicVolume: 0.5 });
      storage.saveProgress({ test: true });

      storage.clearAll();

      expect(storage.getHighScores()).toEqual([]);
      expect(storage.getSettings()).toEqual(DEFAULT_SETTINGS);
      expect(storage.getProgress()).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle corrupted JSON gracefully', () => {
      localStorage.setItem('openclaw_high_scores', 'invalid json');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const scores = storage.getHighScores();
      expect(scores).toEqual([]);
      
      consoleSpy.mockRestore();
    });

    it('should handle storage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Override to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error('Storage full');
      };
      
      expect(() => storage.saveHighScore(1000, 5)).not.toThrow();
      
      localStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });
  });
});
