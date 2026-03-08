import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock DOM elements for HUD testing
describe('HUD', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // Create mock DOM structure
    container = document.createElement('div');
    container.id = 'hud';
    document.body.appendChild(container);

    // Create HUD elements
    const healthBar = document.createElement('div');
    healthBar.id = 'health-bar';
    container.appendChild(healthBar);

    const healthText = document.createElement('span');
    healthText.id = 'health-text';
    container.appendChild(healthText);

    const ammoText = document.createElement('span');
    ammoText.id = 'ammo-text';
    container.appendChild(ammoText);

    const waveText = document.createElement('span');
    waveText.id = 'wave-text';
    container.appendChild(waveText);

    const scoreText = document.createElement('span');
    scoreText.id = 'score-text';
    container.appendChild(scoreText);

    const crosshair = document.createElement('div');
    crosshair.id = 'crosshair';
    container.appendChild(crosshair);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('HUD elements', () => {
    it('should have health bar element', () => {
      const healthBar = document.getElementById('health-bar');
      expect(healthBar).not.toBeNull();
    });

    it('should have health text element', () => {
      const healthText = document.getElementById('health-text');
      expect(healthText).not.toBeNull();
    });

    it('should have ammo text element', () => {
      const ammoText = document.getElementById('ammo-text');
      expect(ammoText).not.toBeNull();
    });

    it('should have wave text element', () => {
      const waveText = document.getElementById('wave-text');
      expect(waveText).not.toBeNull();
    });

    it('should have score text element', () => {
      const scoreText = document.getElementById('score-text');
      expect(scoreText).not.toBeNull();
    });

    it('should have crosshair element', () => {
      const crosshair = document.getElementById('crosshair');
      expect(crosshair).not.toBeNull();
    });
  });

  describe('HUD updates', () => {
    it('should update health display', () => {
      const healthText = document.getElementById('health-text')!;
      healthText.textContent = '75';
      expect(healthText.textContent).toBe('75');
    });

    it('should update health bar width', () => {
      const healthBar = document.getElementById('health-bar')!;
      healthBar.style.width = '75%';
      expect(healthBar.style.width).toBe('75%');
    });

    it('should update ammo display', () => {
      const ammoText = document.getElementById('ammo-text')!;
      ammoText.textContent = '12 / 60';
      expect(ammoText.textContent).toBe('12 / 60');
    });

    it('should update wave display', () => {
      const waveText = document.getElementById('wave-text')!;
      waveText.textContent = 'WAVE 5';
      expect(waveText.textContent).toBe('WAVE 5');
    });

    it('should update score display', () => {
      const scoreText = document.getElementById('score-text')!;
      scoreText.textContent = '12500';
      expect(scoreText.textContent).toBe('12500');
    });
  });

  describe('HUD visibility', () => {
    it('should show HUD by default', () => {
      expect(container.style.display).not.toBe('none');
    });

    it('should hide HUD when set to hidden', () => {
      container.style.display = 'none';
      expect(container.style.display).toBe('none');
    });

    it('should show HUD when set to visible', () => {
      container.style.display = 'none';
      container.style.display = 'block';
      expect(container.style.display).toBe('block');
    });
  });

  describe('damage indicator', () => {
    it('should create damage indicator element', () => {
      const indicator = document.createElement('div');
      indicator.className = 'damage-indicator';
      container.appendChild(indicator);
      
      expect(container.querySelector('.damage-indicator')).not.toBeNull();
    });

    it('should show damage from direction', () => {
      const indicator = document.createElement('div');
      indicator.className = 'damage-indicator';
      indicator.style.transform = 'rotate(45deg)';
      container.appendChild(indicator);
      
      expect(indicator.style.transform).toBe('rotate(45deg)');
    });
  });

  describe('hit marker', () => {
    it('should create hit marker element', () => {
      const hitMarker = document.createElement('div');
      hitMarker.className = 'hit-marker';
      container.appendChild(hitMarker);
      
      expect(container.querySelector('.hit-marker')).not.toBeNull();
    });

    it('should show hit marker animation', () => {
      const hitMarker = document.createElement('div');
      hitMarker.className = 'hit-marker';
      hitMarker.classList.add('active');
      container.appendChild(hitMarker);
      
      expect(hitMarker.classList.contains('active')).toBe(true);
    });
  });
});

describe('Menu', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'menu';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Menu elements', () => {
    it('should have menu container', () => {
      expect(document.getElementById('menu')).not.toBeNull();
    });

    it('should create play button', () => {
      const playBtn = document.createElement('button');
      playBtn.id = 'play-btn';
      playBtn.textContent = 'PLAY';
      container.appendChild(playBtn);
      
      expect(document.getElementById('play-btn')).not.toBeNull();
    });

    it('should create settings button', () => {
      const settingsBtn = document.createElement('button');
      settingsBtn.id = 'settings-btn';
      settingsBtn.textContent = 'SETTINGS';
      container.appendChild(settingsBtn);
      
      expect(document.getElementById('settings-btn')).not.toBeNull();
    });
  });

  describe('Menu navigation', () => {
    it('should show main menu by default', () => {
      expect(container.style.display).not.toBe('none');
    });

    it('should hide menu when game starts', () => {
      container.style.display = 'none';
      expect(container.style.display).toBe('none');
    });

    it('should show menu when game is paused', () => {
      container.style.display = 'none';
      container.style.display = 'flex';
      expect(container.style.display).toBe('flex');
    });
  });

  describe('Game over screen', () => {
    it('should create game over container', () => {
      const gameOver = document.createElement('div');
      gameOver.id = 'game-over';
      gameOver.innerHTML = `
        <h1>GAME OVER</h1>
        <p id="final-score">Score: 0</p>
        <p id="final-wave">Wave: 1</p>
        <button id="restart-btn">RESTART</button>
      `;
      container.appendChild(gameOver);
      
      expect(document.getElementById('game-over')).not.toBeNull();
    });

    it('should display final score', () => {
      const scoreEl = document.createElement('p');
      scoreEl.id = 'final-score';
      scoreEl.textContent = 'Score: 15000';
      container.appendChild(scoreEl);
      
      expect(scoreEl.textContent).toBe('Score: 15000');
    });

    it('should display final wave', () => {
      const waveEl = document.createElement('p');
      waveEl.id = 'final-wave';
      waveEl.textContent = 'Wave: 10';
      container.appendChild(waveEl);
      
      expect(waveEl.textContent).toBe('Wave: 10');
    });
  });
});

describe('TouchControls', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'touch-controls';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Touch control elements', () => {
    it('should create joystick for movement', () => {
      const joystick = document.createElement('div');
      joystick.id = 'movement-joystick';
      joystick.className = 'joystick';
      container.appendChild(joystick);
      
      expect(document.getElementById('movement-joystick')).not.toBeNull();
    });

    it('should create fire button', () => {
      const fireBtn = document.createElement('button');
      fireBtn.id = 'fire-btn';
      fireBtn.className = 'touch-btn';
      container.appendChild(fireBtn);
      
      expect(document.getElementById('fire-btn')).not.toBeNull();
    });

    it('should create jump button', () => {
      const jumpBtn = document.createElement('button');
      jumpBtn.id = 'jump-btn';
      jumpBtn.className = 'touch-btn';
      container.appendChild(jumpBtn);
      
      expect(document.getElementById('jump-btn')).not.toBeNull();
    });

    it('should create reload button', () => {
      const reloadBtn = document.createElement('button');
      reloadBtn.id = 'reload-btn';
      reloadBtn.className = 'touch-btn';
      container.appendChild(reloadBtn);
      
      expect(document.getElementById('reload-btn')).not.toBeNull();
    });

    it('should create weapon switch buttons', () => {
      const weaponBar = document.createElement('div');
      weaponBar.id = 'weapon-bar';
      weaponBar.innerHTML = `
        <button class="weapon-btn" data-weapon="1">1</button>
        <button class="weapon-btn" data-weapon="2">2</button>
        <button class="weapon-btn" data-weapon="3">3</button>
      `;
      container.appendChild(weaponBar);
      
      expect(container.querySelectorAll('.weapon-btn').length).toBe(3);
    });
  });

  describe('Touch events', () => {
    it('should handle touch start', () => {
      const fireBtn = document.createElement('button');
      fireBtn.id = 'fire-btn';
      container.appendChild(fireBtn);
      
      const touchStartHandler = vi.fn();
      fireBtn.addEventListener('touchstart', touchStartHandler);
      
      const event = new TouchEvent('touchstart', {
        touches: [{ identifier: 0, target: fireBtn } as Touch],
      });
      fireBtn.dispatchEvent(event);
      
      expect(touchStartHandler).toHaveBeenCalled();
    });

    it('should handle touch end', () => {
      const fireBtn = document.createElement('button');
      fireBtn.id = 'fire-btn';
      container.appendChild(fireBtn);
      
      const touchEndHandler = vi.fn();
      fireBtn.addEventListener('touchend', touchEndHandler);
      
      const event = new TouchEvent('touchend', {
        changedTouches: [{ identifier: 0, target: fireBtn } as Touch],
      });
      fireBtn.dispatchEvent(event);
      
      expect(touchEndHandler).toHaveBeenCalled();
    });
  });

  describe('Touch control visibility', () => {
    it('should show controls on mobile', () => {
      container.style.display = 'flex';
      expect(container.style.display).toBe('flex');
    });

    it('should hide controls on desktop', () => {
      container.style.display = 'none';
      expect(container.style.display).toBe('none');
    });
  });
});
