import { GameState, GameStats, GameSettings, WeaponType, PickupType } from '@/types/GameTypes';
import { Renderer } from '@/engine/Renderer';
import { Physics } from '@/engine/Physics';
import { InputManager } from '@/engine/InputManager';
import { AudioManager } from '@/engine/AudioManager';
import { Arena } from '@/world/Arena';
import { Player } from './Player';
import { WaveManager } from './WaveManager';
import { PickupManager } from './PickupManager';
import { HUD } from '@/ui/HUD';
import { Menu } from '@/ui/Menu';
import { TouchControls } from '@/ui/TouchControls';
import { Storage } from '@/data/Storage';
import { GAME_CONFIG, ARENA_MAP } from '@/data/Config';

export class Game {
  private uiContainer: HTMLElement;

  // Engine
  private renderer: Renderer;
  private physics: Physics;
  private input: InputManager;
  private audio: AudioManager;

  // World
  private arena: Arena;

  // Game systems
  private player: Player;
  private waveManager: WaveManager;
  private pickupManager: PickupManager;

  // UI
  private hud: HUD;
  private menu: Menu;
  private touchControls: TouchControls;

  // Storage
  private storage: Storage;

  // State
  private _state: GameState = 'loading';
  private _stats: GameStats = this.createEmptyStats();
  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  // Callbacks
  private onGameOverCallback?: (stats: GameStats) => void;
  private onWaveCompleteCallback?: (wave: number) => void;

  constructor(canvas: HTMLCanvasElement, uiContainer: HTMLElement) {
    this.uiContainer = uiContainer;

    // Initialize engine
    this.renderer = new Renderer(canvas);
    this.physics = new Physics();
    this.input = new InputManager();
    this.audio = new AudioManager();

    // Initialize world
    this.arena = new Arena(this.renderer.scene, this.physics);

    // Initialize player
    this.player = new Player(
      this.physics,
      this.input,
      this.audio,
      this.renderer.camera,
      ARENA_MAP.playerSpawn.position
    );

    // Initialize wave manager
    this.waveManager = new WaveManager(
      this.physics,
      this.audio,
      this.renderer.scene
    );

    // Initialize pickup manager
    this.pickupManager = new PickupManager(this.renderer.scene, this.audio);

    // Initialize UI
    this.hud = new HUD();
    this.menu = new Menu();
    this.touchControls = new TouchControls();

    // Initialize storage
    this.storage = new Storage();
  }

  public async init(): Promise<void> {
    this._state = 'loading';
    this.updateLoadingProgress(10, '初始化音效系統...');

    // Initialize audio
    await this.audio.init();
    this.updateLoadingProgress(30, '建構競技場...');

    // Build arena
    this.arena.build();
    this.updateLoadingProgress(60, '設定遊戲系統...');

    // Setup systems
    this.setupWaveManager();
    this.setupPickupManager();
    this.setupPlayer();
    this.updateLoadingProgress(80, '初始化介面...');

    // Initialize UI
    this.hud.init(this.uiContainer);
    this.menu.init(this.uiContainer);
    this.touchControls.init(this.uiContainer);

    // Load settings
    const savedSettings = this.storage.getSettings();
    this.applySettings(savedSettings);
    this.menu.setSettings(savedSettings);

    // Setup menu callbacks
    this.setupMenuCallbacks();

    // Setup input callbacks
    this.setupInputCallbacks();

    this.updateLoadingProgress(100, '完成!');

    // Show main menu
    setTimeout(() => {
      this.hideLoadingScreen();
      this._state = 'menu';
      this.menu.showMainMenu();
    }, 500);

    // Start render loop
    this.startGameLoop();
  }

  private updateLoadingProgress(percent: number, text: string): void {
    const bar = document.getElementById('loading-bar');
    const textEl = document.getElementById('loading-text');
    if (bar) bar.style.width = `${percent}%`;
    if (textEl) textEl.textContent = text;
  }

  private hideLoadingScreen(): void {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      loadingScreen.style.transition = 'opacity 0.5s';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
  }

  private setupWaveManager(): void {
    this.waveManager.setSpawnPoints(this.arena.getEnemySpawnPoints());

    this.waveManager.onWaveStart((wave) => {
      this._stats.wave = wave;
      this.hud.updateWave(wave);
      this.hud.showWaveAnnouncement(wave);
    });

    this.waveManager.onWaveComplete((wave, score) => {
      this._stats.score = score;
      this.hud.updateScore(score);

      if (this.onWaveCompleteCallback) {
        this.onWaveCompleteCallback(wave);
      }

      // Start next wave after intermission
      setTimeout(() => {
        if (this._state === 'playing') {
          this.waveManager.startWave(wave + 1);
        }
      }, GAME_CONFIG.waveIntermissionTime);
    });

    this.waveManager.onEnemyDeath((_enemy, pos, _score) => {
      this._stats.enemiesKilled++;
      this._stats.score = this.waveManager.score;
      this.hud.updateScore(this._stats.score);

      // Spawn pickup
      this.pickupManager.trySpawnOnEnemyDeath(pos);
    });

    this.waveManager.onEnemyAttack((damage, direction) => {
      this.player.takeDamage(damage, direction);
    });
  }

  private setupPickupManager(): void {
    this.pickupManager.setSpawnPoints(this.arena.getPickupSpawnPoints());

    this.pickupManager.onCollect((type, value) => {
      if (type === 'health') {
        this.player.heal(value);
        this.hud.updateHealth(this.player.health, this.player.maxHealth);
      } else {
        // Ammo pickup
        const weaponType = this.getWeaponTypeFromPickup(type);
        if (weaponType) {
          this.player.addAmmo(weaponType, value);
          this.updateAmmoDisplay();
        }
      }
    });
  }

  private getWeaponTypeFromPickup(type: PickupType): WeaponType | null {
    switch (type) {
      case 'ammo_pistol':
        return 'pistol';
      case 'ammo_shotgun':
        return 'shotgun';
      case 'ammo_rifle':
        return 'assault_rifle';
      default:
        return null;
    }
  }

  private setupPlayer(): void {
    this.player.setOnHitEnemy((entityId, damage, isHeadshot, _position) => {
      this.waveManager.damageEnemy(entityId, damage, isHeadshot);
      this._stats.damageDealt += damage;
      this._stats.shotsHit++;
      this.hud.showHitmarker();
      this.audio.play('hit_marker');
    });

    this.player.onDamage((amount, _fromDirection) => {
      this._stats.damageTaken += amount;
      this.hud.updateHealth(this.player.health, this.player.maxHealth);
      this.hud.showDamageIndicator();
    });

    this.player.onDeath(() => {
      this.gameOver();
    });

    this.player.onWeaponFire((_results) => {
      this._stats.shotsFired++;
      this.updateAmmoDisplay();
    });

    this.player.onWeaponSwitch((_from, to) => {
      this.hud.updateWeapon(to);
      this.updateAmmoDisplay();
    });
  }

  private setupMenuCallbacks(): void {
    this.menu.onStartGame(() => {
      this.start();
    });

    this.menu.onResumeGame(() => {
      this.resume();
    });

    this.menu.onRestartGame(() => {
      this.restart();
    });

    this.menu.onSettingsChange((settings) => {
      this.applySettings(settings);
      this.storage.saveSettings(settings);
    });
  }

  private setupInputCallbacks(): void {
    this.input.onPointerLockChangeCallback((locked) => {
      if (!locked && this._state === 'playing') {
        this.pause();
      }
    });

    // Touch controls
    if (this.input.isTouchDevice) {
      this.touchControls.onWeaponSwitch((index) => {
        const weapons: WeaponType[] = ['pistol', 'shotgun', 'assault_rifle'];
        if (index >= 1 && index <= 3) {
          this.player.switchWeapon(weapons[index - 1]);
        }
      });
    }
  }

  private applySettings(settings: GameSettings): void {
    this.audio.setVolume(settings.sfxVolume);
    this.audio.setMusicVolume(settings.musicVolume);
    this.input.setSensitivity(settings.mouseSensitivity);
    this.input.setInvertY(settings.invertY);
  }

  public get state(): GameState {
    return this._state;
  }

  public get stats(): GameStats {
    return { ...this._stats };
  }

  public start(): void {
    this._state = 'playing';
    this._stats = this.createEmptyStats();

    this.menu.hide();
    this.hud.show();

    if (this.input.isTouchDevice) {
      this.touchControls.show();
    } else {
      this.input.requestPointerLock();
    }

    // Reset player
    this.player.reset(ARENA_MAP.playerSpawn.position);

    // Reset wave manager
    this.waveManager.reset();

    // Clear pickups
    this.pickupManager.clear();

    // Initialize HUD
    this.hud.updateHealth(this.player.health, this.player.maxHealth);
    this.hud.updateWeapon(this.player.currentWeapon);
    this.updateAmmoDisplay();
    this.hud.updateWave(1);
    this.hud.updateScore(0);

    // Start first wave
    setTimeout(() => {
      if (this._state === 'playing') {
        this.waveManager.startWave(1);
      }
    }, 1000);
  }

  public pause(): void {
    if (this._state !== 'playing') return;

    this._state = 'paused';
    this.input.exitPointerLock();
    this.menu.showPauseMenu();
    this.hud.hide();
    this.touchControls.hide();
  }

  public resume(): void {
    if (this._state !== 'paused') return;

    this._state = 'playing';
    this.menu.hide();
    this.hud.show();

    if (this.input.isTouchDevice) {
      this.touchControls.show();
    } else {
      this.input.requestPointerLock();
    }
  }

  public restart(): void {
    this.start();
  }

  private gameOver(): void {
    this._state = 'gameOver';

    // Save high score
    const highScores = this.storage.getHighScores();
    const currentHighScore = highScores.length > 0 ? highScores[0].score : 0;

    if (this._stats.score > currentHighScore) {
      this.storage.saveHighScore(this._stats.score, this._stats.wave);
    }

    // Show game over screen
    this.input.exitPointerLock();
    this.hud.hide();
    this.touchControls.hide();
    this.menu.showGameOverScreen(this._stats, currentHighScore);

    if (this.onGameOverCallback) {
      this.onGameOverCallback(this._stats);
    }
  }

  private updateAmmoDisplay(): void {
    const weapon = this.player.getWeapon();
    if (weapon) {
      this.hud.updateAmmo(
        weapon.currentAmmo,
        weapon.config.magazineSize,
        weapon.reserveAmmo
      );
    }
  }

  private createEmptyStats(): GameStats {
    return {
      wave: 0,
      score: 0,
      enemiesKilled: 0,
      damageDealt: 0,
      damageTaken: 0,
      shotsFired: 0,
      shotsHit: 0,
    };
  }

  private startGameLoop(): void {
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private gameLoop = (): void => {
    this.animationFrameId = requestAnimationFrame(this.gameLoop);

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1); // Cap delta to prevent huge jumps
    this.lastTime = now;

    this.update(delta);
    this.renderer.render();
    this.input.update();

    if (this.input.isTouchDevice) {
      this.touchControls.update();
    }
  };

  public update(delta: number): void {
    if (this._state !== 'playing') return;

    // Handle pause
    if (this.input.isActionJustPressed('pause')) {
      this.pause();
      return;
    }

    // Update physics
    this.physics.step(delta);

    // Handle touch input
    if (this.input.isTouchDevice) {
      this.handleTouchInput(delta);
    }

    // Update player
    this.player.update(delta);

    // Update wave manager
    this.waveManager.update(delta, this.player.position);

    // Update pickups
    this.pickupManager.update(delta);

    // Check pickup collisions
    this.pickupManager.checkCollisions(this.player.position);
  }

  private handleTouchInput(delta: number): void {
    const movement = this.touchControls.getMovementVector();
    // Look is handled via touch controls directly

    // Apply movement
    if (movement.x !== 0 || movement.y !== 0) {
      this.player.move(movement.y, movement.x, delta);
    }

    // Apply look (handled differently for touch)
    // Touch look is handled via the player's look method

    // Fire
    if (this.touchControls.isFirePressed()) {
      this.player.fire();
    }

    // Jump
    if (this.touchControls.isJumpPressed()) {
      this.player.jump();
    }

    // Reload
    if (this.touchControls.isReloadPressed()) {
      this.player.reload();
    }
  }

  public onGameOver(callback: (stats: GameStats) => void): void {
    this.onGameOverCallback = callback;
  }

  public onWaveComplete(callback: (wave: number) => void): void {
    this.onWaveCompleteCallback = callback;
  }

  public dispose(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.player.dispose();
    this.waveManager.dispose();
    this.pickupManager.dispose();
    this.arena.dispose();

    this.hud.dispose();
    this.menu.dispose();
    this.touchControls.dispose();

    this.renderer.dispose();
    this.physics.dispose();
    this.input.dispose();
    this.audio.dispose();
  }
}
