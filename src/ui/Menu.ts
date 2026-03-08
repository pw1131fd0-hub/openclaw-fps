import { GameStats, GameSettings } from '@/types/GameTypes';
import { DEFAULT_SETTINGS, colorToCSS, COLORS } from '@/data/Config';

export class Menu {
  private container: HTMLElement;
  private currentScreen: 'main' | 'pause' | 'settings' | 'gameOver' | 'hidden' = 'hidden';
  private settings: GameSettings = { ...DEFAULT_SETTINGS };

  private onStartGameCallback?: () => void;
  private onResumeGameCallback?: () => void;
  private onRestartGameCallback?: () => void;
  private onSettingsChangeCallback?: (settings: GameSettings) => void;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'menu-container';
    this.applyStyles();
  }

  private applyStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      #menu-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 200;
        font-family: 'Orbitron', 'Inter', sans-serif;
      }
      
      #menu-container.hidden {
        display: none;
      }
      
      .menu-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(10, 14, 23, 0.9);
      }
      
      .menu-content {
        position: relative;
        background: ${colorToCSS(COLORS.surface)};
        border: 2px solid ${colorToCSS(COLORS.primary)};
        border-radius: 12px;
        padding: 40px 60px;
        text-align: center;
        max-width: 500px;
        width: 90%;
      }
      
      .menu-title {
        font-size: 48px;
        font-weight: 700;
        color: ${colorToCSS(COLORS.primary)};
        text-shadow: 0 0 20px ${colorToCSS(COLORS.primary)};
        margin-bottom: 10px;
      }
      
      .menu-subtitle {
        font-size: 16px;
        color: ${colorToCSS(COLORS.textSecondary)};
        margin-bottom: 40px;
      }
      
      .menu-button {
        display: block;
        width: 100%;
        padding: 15px 30px;
        margin: 10px 0;
        font-family: 'Orbitron', sans-serif;
        font-size: 18px;
        font-weight: 600;
        color: ${colorToCSS(COLORS.textPrimary)};
        background: transparent;
        border: 2px solid ${colorToCSS(COLORS.primary)};
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .menu-button:hover {
        background: ${colorToCSS(COLORS.primary)};
        color: ${colorToCSS(COLORS.background)};
        box-shadow: 0 0 20px ${colorToCSS(COLORS.primary)};
      }
      
      .menu-button.primary {
        background: ${colorToCSS(COLORS.primary)};
        color: ${colorToCSS(COLORS.background)};
      }
      
      .menu-button.primary:hover {
        background: transparent;
        color: ${colorToCSS(COLORS.primary)};
      }
      
      .game-over-stats {
        margin: 30px 0;
        text-align: left;
      }
      
      .stat-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .stat-label {
        color: ${colorToCSS(COLORS.textSecondary)};
      }
      
      .stat-value {
        color: ${colorToCSS(COLORS.textPrimary)};
        font-weight: 600;
      }
      
      .stat-value.highlight {
        color: ${colorToCSS(COLORS.accent)};
        text-shadow: 0 0 10px ${colorToCSS(COLORS.accent)};
      }
      
      .score-display {
        font-size: 64px;
        font-weight: 700;
        color: ${colorToCSS(COLORS.primary)};
        text-shadow: 0 0 30px ${colorToCSS(COLORS.primary)};
        margin: 20px 0;
      }
      
      .high-score-badge {
        display: inline-block;
        padding: 5px 15px;
        background: ${colorToCSS(COLORS.accent)};
        color: ${colorToCSS(COLORS.background)};
        border-radius: 4px;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 20px;
      }
      
      .settings-group {
        margin: 20px 0;
        text-align: left;
      }
      
      .settings-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 15px 0;
      }
      
      .settings-label span {
        color: ${colorToCSS(COLORS.textPrimary)};
      }
      
      .settings-slider {
        width: 150px;
        height: 6px;
        -webkit-appearance: none;
        appearance: none;
        background: ${colorToCSS(COLORS.surface)};
        border-radius: 3px;
        outline: none;
      }
      
      .settings-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        background: ${colorToCSS(COLORS.primary)};
        border-radius: 50%;
        cursor: pointer;
      }
      
      .settings-toggle {
        width: 50px;
        height: 26px;
        background: ${colorToCSS(COLORS.surface)};
        border: 2px solid ${colorToCSS(COLORS.primary)};
        border-radius: 13px;
        cursor: pointer;
        position: relative;
        transition: background 0.2s;
      }
      
      .settings-toggle::after {
        content: '';
        position: absolute;
        width: 18px;
        height: 18px;
        background: ${colorToCSS(COLORS.textPrimary)};
        border-radius: 50%;
        top: 2px;
        left: 2px;
        transition: left 0.2s;
      }
      
      .settings-toggle.active {
        background: ${colorToCSS(COLORS.primary)};
      }
      
      .settings-toggle.active::after {
        left: 26px;
      }
      
      .click-prompt {
        position: absolute;
        bottom: -60px;
        left: 50%;
        transform: translateX(-50%);
        color: ${colorToCSS(COLORS.textSecondary)};
        font-size: 14px;
        animation: pulse 2s ease-in-out infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
      
      @media (max-width: 768px) {
        .menu-content {
          padding: 30px 20px;
        }
        
        .menu-title {
          font-size: 32px;
        }
        
        .score-display {
          font-size: 48px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  public init(container: HTMLElement): void {
    container.appendChild(this.container);
  }

  public showMainMenu(): void {
    this.currentScreen = 'main';
    this.container.classList.remove('hidden');
    this.container.innerHTML = `
      <div class="menu-overlay"></div>
      <div class="menu-content">
        <h1 class="menu-title">OPENCLAW</h1>
        <p class="menu-subtitle">網頁第一人稱射擊遊戲</p>
        
        <button class="menu-button primary" id="btn-start">開始遊戲</button>
        <button class="menu-button" id="btn-settings">設定</button>
        
        <p class="click-prompt">點擊畫面以鎖定滑鼠</p>
      </div>
    `;

    this.bindButton('btn-start', () => {
      if (this.onStartGameCallback) {
        this.onStartGameCallback();
      }
    });

    this.bindButton('btn-settings', () => {
      this.showSettingsMenu();
    });
  }

  public showPauseMenu(): void {
    this.currentScreen = 'pause';
    this.container.classList.remove('hidden');
    this.container.innerHTML = `
      <div class="menu-overlay"></div>
      <div class="menu-content">
        <h1 class="menu-title">暫停</h1>
        
        <button class="menu-button primary" id="btn-resume">繼續遊戲</button>
        <button class="menu-button" id="btn-settings">設定</button>
        <button class="menu-button" id="btn-restart">重新開始</button>
      </div>
    `;

    this.bindButton('btn-resume', () => {
      if (this.onResumeGameCallback) {
        this.onResumeGameCallback();
      }
    });

    this.bindButton('btn-settings', () => {
      this.showSettingsMenu();
    });

    this.bindButton('btn-restart', () => {
      if (this.onRestartGameCallback) {
        this.onRestartGameCallback();
      }
    });
  }

  public showSettingsMenu(): void {
    const previousScreen = this.currentScreen;
    this.currentScreen = 'settings';
    this.container.innerHTML = `
      <div class="menu-overlay"></div>
      <div class="menu-content">
        <h1 class="menu-title">設定</h1>
        
        <div class="settings-group">
          <div class="settings-label">
            <span>音效音量</span>
            <input type="range" class="settings-slider" id="sfx-volume" 
                   min="0" max="100" value="${this.settings.sfxVolume * 100}">
          </div>
          
          <div class="settings-label">
            <span>音樂音量</span>
            <input type="range" class="settings-slider" id="music-volume" 
                   min="0" max="100" value="${this.settings.musicVolume * 100}">
          </div>
          
          <div class="settings-label">
            <span>滑鼠靈敏度</span>
            <input type="range" class="settings-slider" id="mouse-sensitivity" 
                   min="1" max="100" value="${this.settings.mouseSensitivity * 500}">
          </div>
          
          <div class="settings-label">
            <span>反轉 Y 軸</span>
            <div class="settings-toggle ${this.settings.invertY ? 'active' : ''}" 
                 id="invert-y"></div>
          </div>
          
          <div class="settings-label">
            <span>顯示 FPS</span>
            <div class="settings-toggle ${this.settings.showFPS ? 'active' : ''}" 
                 id="show-fps"></div>
          </div>
        </div>
        
        <button class="menu-button primary" id="btn-back">返回</button>
      </div>
    `;

    // Bind settings controls
    this.bindSlider('sfx-volume', (value) => {
      this.settings.sfxVolume = value / 100;
      this.notifySettingsChange();
    });

    this.bindSlider('music-volume', (value) => {
      this.settings.musicVolume = value / 100;
      this.notifySettingsChange();
    });

    this.bindSlider('mouse-sensitivity', (value) => {
      this.settings.mouseSensitivity = value / 500;
      this.notifySettingsChange();
    });

    this.bindToggle('invert-y', (active) => {
      this.settings.invertY = active;
      this.notifySettingsChange();
    });

    this.bindToggle('show-fps', (active) => {
      this.settings.showFPS = active;
      this.notifySettingsChange();
    });

    this.bindButton('btn-back', () => {
      if (previousScreen === 'main') {
        this.showMainMenu();
      } else if (previousScreen === 'pause') {
        this.showPauseMenu();
      }
    });
  }

  public showGameOverScreen(stats: GameStats, highScore: number): void {
    this.currentScreen = 'gameOver';
    this.container.classList.remove('hidden');

    const isNewHighScore = stats.score > highScore;
    const accuracy = stats.shotsFired > 0 
      ? Math.round((stats.shotsHit / stats.shotsFired) * 100) 
      : 0;

    this.container.innerHTML = `
      <div class="menu-overlay"></div>
      <div class="menu-content">
        <h1 class="menu-title">遊戲結束</h1>
        
        ${isNewHighScore ? '<div class="high-score-badge">🏆 新紀錄!</div>' : ''}
        
        <div class="score-display">${stats.score.toLocaleString()}</div>
        
        <div class="game-over-stats">
          <div class="stat-row">
            <span class="stat-label">波次</span>
            <span class="stat-value">${stats.wave}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">擊殺敵人</span>
            <span class="stat-value">${stats.enemiesKilled}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">造成傷害</span>
            <span class="stat-value">${stats.damageDealt.toLocaleString()}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">命中率</span>
            <span class="stat-value">${accuracy}%</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">最高分</span>
            <span class="stat-value ${isNewHighScore ? 'highlight' : ''}">${Math.max(stats.score, highScore).toLocaleString()}</span>
          </div>
        </div>
        
        <button class="menu-button primary" id="btn-restart">再玩一次</button>
        <button class="menu-button" id="btn-menu">返回主選單</button>
      </div>
    `;

    this.bindButton('btn-restart', () => {
      if (this.onRestartGameCallback) {
        this.onRestartGameCallback();
      }
    });

    this.bindButton('btn-menu', () => {
      this.showMainMenu();
    });
  }

  public hide(): void {
    this.currentScreen = 'hidden';
    this.container.classList.add('hidden');
  }

  private bindButton(id: string, callback: () => void): void {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', callback);
    }
  }

  private bindSlider(id: string, callback: (value: number) => void): void {
    const slider = document.getElementById(id) as HTMLInputElement;
    if (slider) {
      slider.addEventListener('input', () => {
        callback(parseFloat(slider.value));
      });
    }
  }

  private bindToggle(id: string, callback: (active: boolean) => void): void {
    const toggle = document.getElementById(id);
    if (toggle) {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        callback(toggle.classList.contains('active'));
      });
    }
  }

  private notifySettingsChange(): void {
    if (this.onSettingsChangeCallback) {
      this.onSettingsChangeCallback({ ...this.settings });
    }
  }

  public onStartGame(callback: () => void): void {
    this.onStartGameCallback = callback;
  }

  public onResumeGame(callback: () => void): void {
    this.onResumeGameCallback = callback;
  }

  public onRestartGame(callback: () => void): void {
    this.onRestartGameCallback = callback;
  }

  public onSettingsChange(callback: (settings: GameSettings) => void): void {
    this.onSettingsChangeCallback = callback;
  }

  public getSettings(): GameSettings {
    return { ...this.settings };
  }

  public setSettings(settings: GameSettings): void {
    this.settings = { ...settings };
  }

  public dispose(): void {
    this.container.remove();
  }
}
