import { WeaponType } from '@/types/GameTypes';
import { WEAPON_CONFIGS, colorToCSS, COLORS } from '@/data/Config';

export class HUD {
  private container: HTMLElement;
  private elements: {
    healthBar: HTMLElement;
    healthText: HTMLElement;
    ammoText: HTMLElement;
    reserveAmmoText: HTMLElement;
    waveText: HTMLElement;
    scoreText: HTMLElement;
    weaponIcon: HTMLElement;
    weaponName: HTMLElement;
    crosshair: HTMLElement;
    hitmarker: HTMLElement;
    damageOverlay: HTMLElement;
    reloadHint: HTMLElement;
    waveAnnouncement: HTMLElement;
  } | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'hud';
    this.container.innerHTML = this.getTemplate();
    this.applyStyles();
  }

  private getTemplate(): string {
    return `
      <div class="hud-bottom-left">
        <div class="health-container">
          <div class="health-bar-bg">
            <div class="health-bar" id="health-bar"></div>
          </div>
          <span class="health-text" id="health-text">100</span>
        </div>
      </div>
      
      <div class="hud-bottom-right">
        <div class="weapon-container">
          <div class="weapon-icon" id="weapon-icon">🔫</div>
          <div class="weapon-info">
            <span class="weapon-name" id="weapon-name">手槍</span>
            <div class="ammo-display">
              <span class="ammo-current" id="ammo-text">12</span>
              <span class="ammo-separator">/</span>
              <span class="ammo-reserve" id="reserve-ammo-text">60</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="hud-top">
        <div class="wave-score-container">
          <span class="wave-text">波次 <span id="wave-text">1</span></span>
          <span class="score-text">分數 <span id="score-text">0</span></span>
        </div>
      </div>
      
      <div class="crosshair" id="crosshair">
        <div class="crosshair-line crosshair-top"></div>
        <div class="crosshair-line crosshair-bottom"></div>
        <div class="crosshair-line crosshair-left"></div>
        <div class="crosshair-line crosshair-right"></div>
        <div class="crosshair-dot"></div>
      </div>
      
      <div class="hitmarker" id="hitmarker">
        <div class="hitmarker-line"></div>
        <div class="hitmarker-line"></div>
        <div class="hitmarker-line"></div>
        <div class="hitmarker-line"></div>
      </div>
      
      <div class="damage-overlay" id="damage-overlay"></div>
      
      <div class="reload-hint" id="reload-hint">按 R 換彈</div>
      
      <div class="wave-announcement" id="wave-announcement">
        <span class="wave-number">波次 1</span>
        <span class="wave-subtitle">準備戰鬥!</span>
      </div>
    `;
  }

  private applyStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      #hud {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        font-family: 'Orbitron', 'Inter', sans-serif;
        z-index: 100;
      }
      
      .hud-bottom-left {
        position: absolute;
        bottom: 30px;
        left: 30px;
      }
      
      .health-container {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .health-bar-bg {
        width: 200px;
        height: 20px;
        background: rgba(26, 31, 46, 0.8);
        border: 2px solid ${colorToCSS(COLORS.primary)};
        border-radius: 4px;
        overflow: hidden;
      }
      
      .health-bar {
        height: 100%;
        width: 100%;
        background: linear-gradient(90deg, ${colorToCSS(COLORS.health)}, ${colorToCSS(COLORS.accent)});
        transition: width 0.3s ease;
      }
      
      .health-text {
        font-size: 24px;
        font-weight: 700;
        color: ${colorToCSS(COLORS.health)};
        text-shadow: 0 0 10px ${colorToCSS(COLORS.health)};
        min-width: 50px;
      }
      
      .hud-bottom-right {
        position: absolute;
        bottom: 30px;
        right: 30px;
      }
      
      .weapon-container {
        display: flex;
        align-items: center;
        gap: 15px;
        background: rgba(26, 31, 46, 0.8);
        padding: 15px 20px;
        border-radius: 8px;
        border: 2px solid ${colorToCSS(COLORS.primary)};
      }
      
      .weapon-icon {
        font-size: 32px;
      }
      
      .weapon-info {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      
      .weapon-name {
        font-size: 14px;
        color: ${colorToCSS(COLORS.textSecondary)};
      }
      
      .ammo-display {
        display: flex;
        align-items: baseline;
        gap: 4px;
      }
      
      .ammo-current {
        font-size: 28px;
        font-weight: 700;
        color: ${colorToCSS(COLORS.ammo)};
        text-shadow: 0 0 10px ${colorToCSS(COLORS.ammo)};
      }
      
      .ammo-separator {
        font-size: 18px;
        color: ${colorToCSS(COLORS.textSecondary)};
      }
      
      .ammo-reserve {
        font-size: 18px;
        color: ${colorToCSS(COLORS.textSecondary)};
      }
      
      .hud-top {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
      }
      
      .wave-score-container {
        display: flex;
        gap: 40px;
        background: rgba(26, 31, 46, 0.8);
        padding: 10px 30px;
        border-radius: 8px;
        border: 2px solid ${colorToCSS(COLORS.primary)};
      }
      
      .wave-text, .score-text {
        font-size: 18px;
        color: ${colorToCSS(COLORS.textPrimary)};
      }
      
      .wave-text span, .score-text span {
        font-weight: 700;
        color: ${colorToCSS(COLORS.primary)};
      }
      
      .crosshair {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
      
      .crosshair-line {
        position: absolute;
        background: rgba(255, 255, 255, 0.9);
      }
      
      .crosshair-top {
        width: 2px;
        height: 12px;
        left: -1px;
        top: -20px;
      }
      
      .crosshair-bottom {
        width: 2px;
        height: 12px;
        left: -1px;
        top: 8px;
      }
      
      .crosshair-left {
        width: 12px;
        height: 2px;
        left: -20px;
        top: -1px;
      }
      
      .crosshair-right {
        width: 12px;
        height: 2px;
        left: 8px;
        top: -1px;
      }
      
      .crosshair-dot {
        position: absolute;
        width: 4px;
        height: 4px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        left: -2px;
        top: -2px;
      }
      
      .hitmarker {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        opacity: 0;
        pointer-events: none;
      }
      
      .hitmarker.active {
        animation: hitmarker-flash 0.15s ease-out;
      }
      
      .hitmarker-line {
        position: absolute;
        width: 2px;
        height: 10px;
        background: ${colorToCSS(COLORS.accent)};
      }
      
      .hitmarker-line:nth-child(1) {
        transform: rotate(45deg);
        top: -15px;
        left: 10px;
      }
      
      .hitmarker-line:nth-child(2) {
        transform: rotate(-45deg);
        top: -15px;
        left: -10px;
      }
      
      .hitmarker-line:nth-child(3) {
        transform: rotate(45deg);
        top: 5px;
        left: -10px;
      }
      
      .hitmarker-line:nth-child(4) {
        transform: rotate(-45deg);
        top: 5px;
        left: 10px;
      }
      
      @keyframes hitmarker-flash {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(0.8); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2); }
      }
      
      .damage-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        opacity: 0;
        background: radial-gradient(ellipse at center, transparent 40%, ${colorToCSS(COLORS.danger)} 100%);
        transition: opacity 0.1s ease;
      }
      
      .damage-overlay.active {
        opacity: 0.4;
      }
      
      .reload-hint {
        position: absolute;
        bottom: 120px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 16px;
        color: ${colorToCSS(COLORS.secondary)};
        background: rgba(26, 31, 46, 0.8);
        padding: 8px 20px;
        border-radius: 4px;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .reload-hint.active {
        opacity: 1;
      }
      
      .wave-announcement {
        position: absolute;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        opacity: 0;
        pointer-events: none;
      }
      
      .wave-announcement.active {
        animation: wave-announce 2s ease-out forwards;
      }
      
      .wave-announcement .wave-number {
        display: block;
        font-size: 48px;
        font-weight: 700;
        color: ${colorToCSS(COLORS.primary)};
        text-shadow: 0 0 20px ${colorToCSS(COLORS.primary)};
      }
      
      .wave-announcement .wave-subtitle {
        display: block;
        font-size: 24px;
        color: ${colorToCSS(COLORS.textPrimary)};
        margin-top: 10px;
      }
      
      @keyframes wave-announce {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        30% { transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
      }
      
      @media (max-width: 768px) {
        .hud-bottom-left, .hud-bottom-right {
          bottom: 20px;
        }
        
        .hud-bottom-left { left: 15px; }
        .hud-bottom-right { right: 15px; }
        
        .health-bar-bg { width: 120px; height: 15px; }
        .health-text { font-size: 18px; }
        .ammo-current { font-size: 22px; }
        .weapon-icon { font-size: 24px; }
      }
    `;
    document.head.appendChild(style);
  }

  public init(container: HTMLElement): void {
    container.appendChild(this.container);

    this.elements = {
      healthBar: document.getElementById('health-bar')!,
      healthText: document.getElementById('health-text')!,
      ammoText: document.getElementById('ammo-text')!,
      reserveAmmoText: document.getElementById('reserve-ammo-text')!,
      waveText: document.getElementById('wave-text')!,
      scoreText: document.getElementById('score-text')!,
      weaponIcon: document.getElementById('weapon-icon')!,
      weaponName: document.getElementById('weapon-name')!,
      crosshair: document.getElementById('crosshair')!,
      hitmarker: document.getElementById('hitmarker')!,
      damageOverlay: document.getElementById('damage-overlay')!,
      reloadHint: document.getElementById('reload-hint')!,
      waveAnnouncement: document.getElementById('wave-announcement')!,
    };
  }

  public show(): void {
    this.container.style.display = 'block';
  }

  public hide(): void {
    this.container.style.display = 'none';
  }

  public updateHealth(current: number, max: number): void {
    if (!this.elements) return;

    const percent = (current / max) * 100;
    this.elements.healthBar.style.width = `${percent}%`;
    this.elements.healthText.textContent = Math.ceil(current).toString();

    // Change color based on health
    if (percent < 25) {
      this.elements.healthBar.style.background = colorToCSS(COLORS.danger);
    } else if (percent < 50) {
      this.elements.healthBar.style.background = colorToCSS(COLORS.secondary);
    } else {
      this.elements.healthBar.style.background = `linear-gradient(90deg, ${colorToCSS(COLORS.health)}, ${colorToCSS(COLORS.accent)})`;
    }
  }

  public updateAmmo(current: number, max: number, reserve: number): void {
    if (!this.elements) return;

    this.elements.ammoText.textContent = current.toString();
    this.elements.reserveAmmoText.textContent = reserve.toString();

    // Show reload hint when low on ammo
    if (current <= Math.floor(max * 0.2) && reserve > 0) {
      this.showReloadHint();
    } else {
      this.hideReloadHint();
    }
  }

  public updateWave(wave: number): void {
    if (!this.elements) return;
    this.elements.waveText.textContent = wave.toString();
  }

  public updateScore(score: number): void {
    if (!this.elements) return;
    this.elements.scoreText.textContent = score.toLocaleString();
  }

  public updateWeapon(weapon: WeaponType): void {
    if (!this.elements) return;

    const config = WEAPON_CONFIGS[weapon];
    this.elements.weaponName.textContent = config.name;

    // Update icon
    const icons: Record<WeaponType, string> = {
      pistol: '🔫',
      shotgun: '💥',
      assault_rifle: '🔥',
    };
    this.elements.weaponIcon.textContent = icons[weapon];
  }

  public showHitmarker(): void {
    if (!this.elements) return;

    this.elements.hitmarker.classList.remove('active');
    void this.elements.hitmarker.offsetWidth; // Force reflow
    this.elements.hitmarker.classList.add('active');
  }

  public showDamageIndicator(): void {
    if (!this.elements) return;

    this.elements.damageOverlay.classList.add('active');
    setTimeout(() => {
      this.elements?.damageOverlay.classList.remove('active');
    }, 200);
  }

  public showReloadHint(): void {
    if (!this.elements) return;
    this.elements.reloadHint.classList.add('active');
  }

  public hideReloadHint(): void {
    if (!this.elements) return;
    this.elements.reloadHint.classList.remove('active');
  }

  public showWaveAnnouncement(wave: number): void {
    if (!this.elements) return;

    const numberEl = this.elements.waveAnnouncement.querySelector('.wave-number');
    if (numberEl) {
      numberEl.textContent = `波次 ${wave}`;
    }

    this.elements.waveAnnouncement.classList.remove('active');
    void this.elements.waveAnnouncement.offsetWidth;
    this.elements.waveAnnouncement.classList.add('active');

    setTimeout(() => {
      this.elements?.waveAnnouncement.classList.remove('active');
    }, 2000);
  }

  public setCrosshairSpread(spread: number): void {
    if (!this.elements) return;

    const lines = this.elements.crosshair.querySelectorAll('.crosshair-line');
    const offset = 8 + spread * 2;

    (lines[0] as HTMLElement).style.top = `-${offset + 12}px`;
    (lines[1] as HTMLElement).style.top = `${offset}px`;
    (lines[2] as HTMLElement).style.left = `-${offset + 12}px`;
    (lines[3] as HTMLElement).style.left = `${offset}px`;
  }

  public dispose(): void {
    this.container.remove();
  }
}
