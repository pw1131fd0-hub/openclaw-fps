import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Menu } from './Menu';
import { GameStats, GameSettings } from '@/types/GameTypes';

describe('Menu', () => {
  let menu: Menu;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'game-container';
    document.body.appendChild(container);
    
    menu = new Menu();
    menu.init(container);
  });

  afterEach(() => {
    menu.dispose();
    document.body.innerHTML = '';
  });

  describe('initialization', () => {
    it('should create Menu instance', () => {
      expect(menu).toBeDefined();
    });

    it('should append menu container to parent', () => {
      const menuElement = document.getElementById('menu-container');
      expect(menuElement).not.toBeNull();
    });
  });

  describe('showMainMenu()', () => {
    it('should show main menu', () => {
      menu.showMainMenu();
      
      const menuContainer = document.getElementById('menu-container');
      expect(menuContainer?.classList.contains('hidden')).toBe(false);
    });

    it('should display game title', () => {
      menu.showMainMenu();
      
      const title = document.querySelector('.menu-title');
      expect(title?.textContent).toBe('OPENCLAW');
    });

    it('should have start button', () => {
      menu.showMainMenu();
      
      const startBtn = document.getElementById('btn-start');
      expect(startBtn).not.toBeNull();
    });

    it('should have settings button', () => {
      menu.showMainMenu();
      
      const settingsBtn = document.getElementById('btn-settings');
      expect(settingsBtn).not.toBeNull();
    });

    it('should trigger onStartGame callback when start button clicked', () => {
      const callback = vi.fn();
      menu.onStartGame(callback);
      menu.showMainMenu();
      
      const startBtn = document.getElementById('btn-start');
      startBtn?.click();
      
      expect(callback).toHaveBeenCalled();
    });

    it('should navigate to settings when settings button clicked', () => {
      menu.showMainMenu();
      
      const settingsBtn = document.getElementById('btn-settings');
      settingsBtn?.click();
      
      // Settings menu should be visible
      const volumeSlider = document.getElementById('sfx-volume');
      expect(volumeSlider).not.toBeNull();
    });
  });

  describe('showPauseMenu()', () => {
    it('should show pause menu', () => {
      menu.showPauseMenu();
      
      const menuContainer = document.getElementById('menu-container');
      expect(menuContainer?.classList.contains('hidden')).toBe(false);
    });

    it('should display pause title', () => {
      menu.showPauseMenu();
      
      const title = document.querySelector('.menu-title');
      expect(title?.textContent).toBe('暫停');
    });

    it('should have resume button', () => {
      menu.showPauseMenu();
      
      const resumeBtn = document.getElementById('btn-resume');
      expect(resumeBtn).not.toBeNull();
    });

    it('should have restart button', () => {
      menu.showPauseMenu();
      
      const restartBtn = document.getElementById('btn-restart');
      expect(restartBtn).not.toBeNull();
    });

    it('should trigger onResumeGame callback when resume button clicked', () => {
      const callback = vi.fn();
      menu.onResumeGame(callback);
      menu.showPauseMenu();
      
      const resumeBtn = document.getElementById('btn-resume');
      resumeBtn?.click();
      
      expect(callback).toHaveBeenCalled();
    });

    it('should trigger onRestartGame callback when restart button clicked', () => {
      const callback = vi.fn();
      menu.onRestartGame(callback);
      menu.showPauseMenu();
      
      const restartBtn = document.getElementById('btn-restart');
      restartBtn?.click();
      
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('showSettingsMenu()', () => {
    it('should show settings menu', () => {
      menu.showSettingsMenu();
      
      const title = document.querySelector('.menu-title');
      expect(title?.textContent).toBe('設定');
    });

    it('should have SFX volume slider', () => {
      menu.showSettingsMenu();
      
      const sfxVolume = document.getElementById('sfx-volume');
      expect(sfxVolume).not.toBeNull();
    });

    it('should have music volume slider', () => {
      menu.showSettingsMenu();
      
      const musicVolume = document.getElementById('music-volume');
      expect(musicVolume).not.toBeNull();
    });

    it('should have mouse sensitivity slider', () => {
      menu.showSettingsMenu();
      
      const sensitivity = document.getElementById('mouse-sensitivity');
      expect(sensitivity).not.toBeNull();
    });

    it('should have invert Y toggle', () => {
      menu.showSettingsMenu();
      
      const invertY = document.getElementById('invert-y');
      expect(invertY).not.toBeNull();
    });

    it('should have show FPS toggle', () => {
      menu.showSettingsMenu();
      
      const showFPS = document.getElementById('show-fps');
      expect(showFPS).not.toBeNull();
    });

    it('should have back button', () => {
      menu.showSettingsMenu();
      
      const backBtn = document.getElementById('btn-back');
      expect(backBtn).not.toBeNull();
    });

    it('should trigger onSettingsChange callback when slider changed', () => {
      const callback = vi.fn();
      menu.onSettingsChange(callback);
      menu.showSettingsMenu();
      
      const sfxVolume = document.getElementById('sfx-volume') as HTMLInputElement;
      sfxVolume.value = '50';
      sfxVolume.dispatchEvent(new Event('input'));
      
      expect(callback).toHaveBeenCalled();
    });

    it('should toggle invert Y when clicked', () => {
      menu.showSettingsMenu();
      
      const invertY = document.getElementById('invert-y');
      invertY?.click();
      
      expect(invertY?.classList.contains('active')).toBe(true);
    });

    it('should go back to main menu from settings', () => {
      menu.showMainMenu();
      
      const settingsBtn = document.getElementById('btn-settings');
      settingsBtn?.click();
      
      const backBtn = document.getElementById('btn-back');
      backBtn?.click();
      
      const startBtn = document.getElementById('btn-start');
      expect(startBtn).not.toBeNull();
    });

    it('should go back to pause menu from settings', () => {
      menu.showPauseMenu();
      
      const settingsBtn = document.getElementById('btn-settings');
      settingsBtn?.click();
      
      const backBtn = document.getElementById('btn-back');
      backBtn?.click();
      
      const resumeBtn = document.getElementById('btn-resume');
      expect(resumeBtn).not.toBeNull();
    });
  });

  describe('showGameOverScreen()', () => {
    const stats: GameStats = {
      score: 15000,
      wave: 10,
      enemiesKilled: 50,
      damageDealt: 5000,
      shotsFired: 200,
      shotsHit: 150,
    };

    it('should show game over screen', () => {
      menu.showGameOverScreen(stats, 10000);
      
      const title = document.querySelector('.menu-title');
      expect(title?.textContent).toBe('遊戲結束');
    });

    it('should display score', () => {
      menu.showGameOverScreen(stats, 10000);
      
      const scoreDisplay = document.querySelector('.score-display');
      expect(scoreDisplay?.textContent).toBe('15,000');
    });

    it('should show new high score badge when beating high score', () => {
      menu.showGameOverScreen(stats, 10000);
      
      const badge = document.querySelector('.high-score-badge');
      expect(badge).not.toBeNull();
    });

    it('should not show high score badge when not beating high score', () => {
      menu.showGameOverScreen(stats, 20000);
      
      const badge = document.querySelector('.high-score-badge');
      expect(badge).toBeNull();
    });

    it('should display wave reached', () => {
      menu.showGameOverScreen(stats, 10000);
      
      const statRows = document.querySelectorAll('.stat-row');
      const waveRow = Array.from(statRows).find(row => 
        row.querySelector('.stat-label')?.textContent === '波次'
      );
      expect(waveRow?.querySelector('.stat-value')?.textContent).toBe('10');
    });

    it('should display enemies killed', () => {
      menu.showGameOverScreen(stats, 10000);
      
      const statRows = document.querySelectorAll('.stat-row');
      const killRow = Array.from(statRows).find(row => 
        row.querySelector('.stat-label')?.textContent === '擊殺敵人'
      );
      expect(killRow?.querySelector('.stat-value')?.textContent).toBe('50');
    });

    it('should display accuracy percentage', () => {
      menu.showGameOverScreen(stats, 10000);
      
      const statRows = document.querySelectorAll('.stat-row');
      const accuracyRow = Array.from(statRows).find(row => 
        row.querySelector('.stat-label')?.textContent === '命中率'
      );
      // 150/200 = 75%
      expect(accuracyRow?.querySelector('.stat-value')?.textContent).toBe('75%');
    });

    it('should handle 0 shots fired', () => {
      const zeroShotsStats = { ...stats, shotsFired: 0, shotsHit: 0 };
      menu.showGameOverScreen(zeroShotsStats, 10000);
      
      const statRows = document.querySelectorAll('.stat-row');
      const accuracyRow = Array.from(statRows).find(row => 
        row.querySelector('.stat-label')?.textContent === '命中率'
      );
      expect(accuracyRow?.querySelector('.stat-value')?.textContent).toBe('0%');
    });

    it('should have restart button', () => {
      menu.showGameOverScreen(stats, 10000);
      
      const restartBtn = document.getElementById('btn-restart');
      expect(restartBtn).not.toBeNull();
    });

    it('should have return to menu button', () => {
      menu.showGameOverScreen(stats, 10000);
      
      const menuBtn = document.getElementById('btn-menu');
      expect(menuBtn).not.toBeNull();
    });

    it('should trigger onRestartGame when restart clicked', () => {
      const callback = vi.fn();
      menu.onRestartGame(callback);
      menu.showGameOverScreen(stats, 10000);
      
      const restartBtn = document.getElementById('btn-restart');
      restartBtn?.click();
      
      expect(callback).toHaveBeenCalled();
    });

    it('should go to main menu when menu button clicked', () => {
      menu.showGameOverScreen(stats, 10000);
      
      const menuBtn = document.getElementById('btn-menu');
      menuBtn?.click();
      
      const startBtn = document.getElementById('btn-start');
      expect(startBtn).not.toBeNull();
    });
  });

  describe('hide()', () => {
    it('should hide menu', () => {
      menu.showMainMenu();
      menu.hide();
      
      const menuContainer = document.getElementById('menu-container');
      expect(menuContainer?.classList.contains('hidden')).toBe(true);
    });
  });

  describe('getSettings() / setSettings()', () => {
    it('should return default settings', () => {
      const settings = menu.getSettings();
      
      expect(settings).toHaveProperty('sfxVolume');
      expect(settings).toHaveProperty('musicVolume');
      expect(settings).toHaveProperty('mouseSensitivity');
      expect(settings).toHaveProperty('invertY');
      expect(settings).toHaveProperty('showFPS');
    });

    it('should set settings', () => {
      const newSettings: GameSettings = {
        sfxVolume: 0.5,
        musicVolume: 0.3,
        mouseSensitivity: 0.1,
        invertY: true,
        showFPS: true,
      };
      
      menu.setSettings(newSettings);
      const retrieved = menu.getSettings();
      
      expect(retrieved.sfxVolume).toBe(0.5);
      expect(retrieved.invertY).toBe(true);
    });

    it('should return copy of settings', () => {
      const settings1 = menu.getSettings();
      const settings2 = menu.getSettings();
      
      settings1.sfxVolume = 0.1;
      
      expect(settings2.sfxVolume).not.toBe(0.1);
    });
  });

  describe('callbacks', () => {
    it('should register onStartGame callback', () => {
      const callback = vi.fn();
      menu.onStartGame(callback);
      
      expect(() => menu.showMainMenu()).not.toThrow();
    });

    it('should register onResumeGame callback', () => {
      const callback = vi.fn();
      menu.onResumeGame(callback);
      
      expect(() => menu.showPauseMenu()).not.toThrow();
    });

    it('should register onRestartGame callback', () => {
      const callback = vi.fn();
      menu.onRestartGame(callback);
      
      expect(() => menu.showPauseMenu()).not.toThrow();
    });

    it('should register onSettingsChange callback', () => {
      const callback = vi.fn();
      menu.onSettingsChange(callback);
      
      expect(() => menu.showSettingsMenu()).not.toThrow();
    });
  });

  describe('dispose()', () => {
    it('should remove menu from DOM', () => {
      menu.dispose();
      
      const menuElement = document.getElementById('menu-container');
      expect(menuElement).toBeNull();
    });
  });
});
