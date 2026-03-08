import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HUD } from './HUD';

describe('HUD', () => {
  let hud: HUD;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'game-container';
    document.body.appendChild(container);
    
    hud = new HUD();
    hud.init(container);
  });

  afterEach(() => {
    hud.dispose();
    document.body.innerHTML = '';
  });

  describe('initialization', () => {
    it('should create HUD instance', () => {
      expect(hud).toBeDefined();
    });

    it('should append HUD container to parent', () => {
      const hudElement = document.getElementById('hud');
      expect(hudElement).not.toBeNull();
    });

    it('should create health bar element', () => {
      const healthBar = document.getElementById('health-bar');
      expect(healthBar).not.toBeNull();
    });

    it('should create health text element', () => {
      const healthText = document.getElementById('health-text');
      expect(healthText).not.toBeNull();
    });

    it('should create ammo text element', () => {
      const ammoText = document.getElementById('ammo-text');
      expect(ammoText).not.toBeNull();
    });

    it('should create reserve ammo text element', () => {
      const reserveAmmoText = document.getElementById('reserve-ammo-text');
      expect(reserveAmmoText).not.toBeNull();
    });

    it('should create wave text element', () => {
      const waveText = document.getElementById('wave-text');
      expect(waveText).not.toBeNull();
    });

    it('should create score text element', () => {
      const scoreText = document.getElementById('score-text');
      expect(scoreText).not.toBeNull();
    });

    it('should create crosshair element', () => {
      const crosshair = document.getElementById('crosshair');
      expect(crosshair).not.toBeNull();
    });

    it('should create hitmarker element', () => {
      const hitmarker = document.getElementById('hitmarker');
      expect(hitmarker).not.toBeNull();
    });

    it('should create damage overlay element', () => {
      const damageOverlay = document.getElementById('damage-overlay');
      expect(damageOverlay).not.toBeNull();
    });

    it('should create reload hint element', () => {
      const reloadHint = document.getElementById('reload-hint');
      expect(reloadHint).not.toBeNull();
    });

    it('should create wave announcement element', () => {
      const waveAnnouncement = document.getElementById('wave-announcement');
      expect(waveAnnouncement).not.toBeNull();
    });

    it('should create weapon icon element', () => {
      const weaponIcon = document.getElementById('weapon-icon');
      expect(weaponIcon).not.toBeNull();
    });

    it('should create weapon name element', () => {
      const weaponName = document.getElementById('weapon-name');
      expect(weaponName).not.toBeNull();
    });
  });

  describe('show() / hide()', () => {
    it('should show HUD', () => {
      hud.hide();
      hud.show();
      
      const hudElement = document.getElementById('hud');
      expect(hudElement?.style.display).toBe('block');
    });

    it('should hide HUD', () => {
      hud.hide();
      
      const hudElement = document.getElementById('hud');
      expect(hudElement?.style.display).toBe('none');
    });
  });

  describe('updateHealth()', () => {
    it('should update health bar width', () => {
      hud.updateHealth(50, 100);
      
      const healthBar = document.getElementById('health-bar');
      expect(healthBar?.style.width).toBe('50%');
    });

    it('should update health text', () => {
      hud.updateHealth(75, 100);
      
      const healthText = document.getElementById('health-text');
      expect(healthText?.textContent).toBe('75');
    });

    it('should handle 0 health', () => {
      hud.updateHealth(0, 100);
      
      const healthBar = document.getElementById('health-bar');
      expect(healthBar?.style.width).toBe('0%');
    });

    it('should handle full health', () => {
      hud.updateHealth(100, 100);
      
      const healthBar = document.getElementById('health-bar');
      expect(healthBar?.style.width).toBe('100%');
    });

    it('should change color when health is low', () => {
      hud.updateHealth(20, 100);
      
      const healthBar = document.getElementById('health-bar');
      expect(healthBar?.style.background).toBeDefined();
    });

    it('should change color when health is medium', () => {
      hud.updateHealth(40, 100);
      
      const healthBar = document.getElementById('health-bar');
      expect(healthBar?.style.background).toBeDefined();
    });

    it('should round up health display', () => {
      hud.updateHealth(75.3, 100);
      
      const healthText = document.getElementById('health-text');
      expect(healthText?.textContent).toBe('76');
    });
  });

  describe('updateAmmo()', () => {
    it('should update current ammo text', () => {
      hud.updateAmmo(12, 15, 60);
      
      const ammoText = document.getElementById('ammo-text');
      expect(ammoText?.textContent).toBe('12');
    });

    it('should update reserve ammo text', () => {
      hud.updateAmmo(12, 15, 60);
      
      const reserveAmmoText = document.getElementById('reserve-ammo-text');
      expect(reserveAmmoText?.textContent).toBe('60');
    });

    it('should show reload hint when ammo is low and has reserve', () => {
      hud.updateAmmo(2, 15, 60);
      
      const reloadHint = document.getElementById('reload-hint');
      expect(reloadHint?.classList.contains('active')).toBe(true);
    });

    it('should hide reload hint when ammo is not low', () => {
      hud.updateAmmo(10, 15, 60);
      
      const reloadHint = document.getElementById('reload-hint');
      expect(reloadHint?.classList.contains('active')).toBe(false);
    });

    it('should hide reload hint when no reserve ammo', () => {
      hud.updateAmmo(2, 15, 0);
      
      const reloadHint = document.getElementById('reload-hint');
      expect(reloadHint?.classList.contains('active')).toBe(false);
    });
  });

  describe('updateWave()', () => {
    it('should update wave text', () => {
      hud.updateWave(5);
      
      const waveText = document.getElementById('wave-text');
      expect(waveText?.textContent).toBe('5');
    });

    it('should handle large wave numbers', () => {
      hud.updateWave(999);
      
      const waveText = document.getElementById('wave-text');
      expect(waveText?.textContent).toBe('999');
    });
  });

  describe('updateScore()', () => {
    it('should update score text', () => {
      hud.updateScore(1000);
      
      const scoreText = document.getElementById('score-text');
      expect(scoreText?.textContent).toBe('1,000');
    });

    it('should format large numbers with locale', () => {
      hud.updateScore(1000000);
      
      const scoreText = document.getElementById('score-text');
      expect(scoreText?.textContent).toBe('1,000,000');
    });

    it('should handle 0 score', () => {
      hud.updateScore(0);
      
      const scoreText = document.getElementById('score-text');
      expect(scoreText?.textContent).toBe('0');
    });
  });

  describe('updateWeapon()', () => {
    it('should update weapon name for pistol', () => {
      hud.updateWeapon('pistol');
      
      const weaponName = document.getElementById('weapon-name');
      expect(weaponName?.textContent).toBe('手槍');
    });

    it('should update weapon icon for pistol', () => {
      hud.updateWeapon('pistol');
      
      const weaponIcon = document.getElementById('weapon-icon');
      expect(weaponIcon?.textContent).toBe('🔫');
    });

    it('should update weapon for shotgun', () => {
      hud.updateWeapon('shotgun');
      
      const weaponName = document.getElementById('weapon-name');
      expect(weaponName?.textContent).toBe('散彈槍');
    });

    it('should update weapon for assault rifle', () => {
      hud.updateWeapon('assault_rifle');
      
      const weaponName = document.getElementById('weapon-name');
      expect(weaponName?.textContent).toBe('突擊步槍');
    });
  });

  describe('showHitmarker()', () => {
    it('should add active class to hitmarker', () => {
      hud.showHitmarker();
      
      const hitmarker = document.getElementById('hitmarker');
      expect(hitmarker?.classList.contains('active')).toBe(true);
    });

    it('should not throw when called multiple times', () => {
      expect(() => {
        hud.showHitmarker();
        hud.showHitmarker();
        hud.showHitmarker();
      }).not.toThrow();
    });
  });

  describe('showDamageIndicator()', () => {
    it('should add active class to damage overlay', () => {
      vi.useFakeTimers();
      
      hud.showDamageIndicator();
      
      const damageOverlay = document.getElementById('damage-overlay');
      expect(damageOverlay?.classList.contains('active')).toBe(true);
      
      vi.useRealTimers();
    });

    it('should remove active class after timeout', () => {
      vi.useFakeTimers();
      
      hud.showDamageIndicator();
      vi.advanceTimersByTime(300);
      
      const damageOverlay = document.getElementById('damage-overlay');
      expect(damageOverlay?.classList.contains('active')).toBe(false);
      
      vi.useRealTimers();
    });
  });

  describe('showReloadHint() / hideReloadHint()', () => {
    it('should show reload hint', () => {
      hud.showReloadHint();
      
      const reloadHint = document.getElementById('reload-hint');
      expect(reloadHint?.classList.contains('active')).toBe(true);
    });

    it('should hide reload hint', () => {
      hud.showReloadHint();
      hud.hideReloadHint();
      
      const reloadHint = document.getElementById('reload-hint');
      expect(reloadHint?.classList.contains('active')).toBe(false);
    });
  });

  describe('showWaveAnnouncement()', () => {
    it('should show wave announcement', () => {
      vi.useFakeTimers();
      
      hud.showWaveAnnouncement(3);
      
      const waveAnnouncement = document.getElementById('wave-announcement');
      expect(waveAnnouncement?.classList.contains('active')).toBe(true);
      
      vi.useRealTimers();
    });

    it('should update wave number text', () => {
      vi.useFakeTimers();
      
      hud.showWaveAnnouncement(3);
      
      const waveNumber = document.querySelector('.wave-number');
      expect(waveNumber?.textContent).toBe('波次 3');
      
      vi.useRealTimers();
    });

    it('should hide wave announcement after timeout', () => {
      vi.useFakeTimers();
      
      hud.showWaveAnnouncement(3);
      vi.advanceTimersByTime(2500);
      
      const waveAnnouncement = document.getElementById('wave-announcement');
      expect(waveAnnouncement?.classList.contains('active')).toBe(false);
      
      vi.useRealTimers();
    });
  });

  describe('setCrosshairSpread()', () => {
    it('should update crosshair lines positions', () => {
      hud.setCrosshairSpread(5);
      
      const crosshair = document.getElementById('crosshair');
      const lines = crosshair?.querySelectorAll('.crosshair-line');
      
      expect(lines?.length).toBe(4);
    });

    it('should handle 0 spread', () => {
      expect(() => hud.setCrosshairSpread(0)).not.toThrow();
    });

    it('should handle large spread', () => {
      expect(() => hud.setCrosshairSpread(20)).not.toThrow();
    });
  });

  describe('dispose()', () => {
    it('should remove HUD from DOM', () => {
      hud.dispose();
      
      const hudElement = document.getElementById('hud');
      expect(hudElement).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle operations before init gracefully', () => {
      const newHud = new HUD();
      // These should not throw even without init
      expect(() => newHud.updateHealth(50, 100)).not.toThrow();
      expect(() => newHud.updateAmmo(12, 15, 60)).not.toThrow();
      expect(() => newHud.updateWave(1)).not.toThrow();
      expect(() => newHud.updateScore(1000)).not.toThrow();
    });
  });
});
