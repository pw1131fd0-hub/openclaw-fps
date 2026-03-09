import { EnemyType, Vector3, WaveConfig } from '@/types/GameTypes';
import { getWaveConfig, GAME_CONFIG } from '@/data/Config';
import { Physics } from '@/engine/Physics';
import { AudioManager } from '@/engine/AudioManager';
import { Enemy } from './Enemy';
import { ObjectPool } from '@/utils/ObjectPool';
import { randomElement, shuffleArray } from '@/utils/MathUtils';
import * as THREE from 'three';

export class WaveManager {
  private physics: Physics;
  private audio: AudioManager;
  private scene: THREE.Scene;

  private _currentWave: number = 0;
  private _enemiesRemaining: number = 0;
  private _isWaveActive: boolean = false;
  private _score: number = 0;

  private meleePool: ObjectPool<Enemy>;
  private rangedPool: ObjectPool<Enemy>;
  private activeEnemies: Enemy[] = [];
  private spawnPoints: Vector3[] = [];
  private spawnQueue: { type: EnemyType; delay: number }[] = [];
  private spawnTimer: number | null = null;
  private waveConfig: WaveConfig | null = null;

  private onWaveStartCallback?: (wave: number) => void;
  private onWaveCompleteCallback?: (wave: number, score: number) => void;
  private onEnemyDeathCallback?: (enemy: Enemy, position: Vector3, score: number) => void;
  private onEnemyAttackCallback?: (damage: number, direction: Vector3) => void;

  constructor(
    physics: Physics,
    audio: AudioManager,
    scene: THREE.Scene
  ) {
    this.physics = physics;
    this.audio = audio;
    this.scene = scene;

    // Create enemy pools
    this.meleePool = new ObjectPool<Enemy>(
      () => this.createEnemy('melee'),
      (enemy) => enemy.reset(),
      10
    );
    this.rangedPool = new ObjectPool<Enemy>(
      () => this.createEnemy('ranged'),
      (enemy) => enemy.reset(),
      5
    );
  }

  private createEnemy(type: EnemyType): Enemy {
    const enemy = new Enemy(type, this.physics, this.audio, this.scene);

    enemy.onDeath((e, points) => {
      this.handleEnemyDeath(e, points);
    });

    enemy.onAttack((damage, direction) => {
      if (this.onEnemyAttackCallback) {
        this.onEnemyAttackCallback(damage, direction);
      }
    });

    return enemy;
  }

  public setSpawnPoints(points: Vector3[]): void {
    this.spawnPoints = points;
  }

  public get currentWave(): number {
    return this._currentWave;
  }

  public get enemiesRemaining(): number {
    return this._enemiesRemaining;
  }

  public get isWaveActive(): boolean {
    return this._isWaveActive;
  }

  public get score(): number {
    return this._score;
  }

  public startWave(waveNumber: number): void {
    this._currentWave = waveNumber;
    this.waveConfig = getWaveConfig(waveNumber);
    this._enemiesRemaining = this.waveConfig.totalEnemies;
    this._isWaveActive = true;

    this.audio.play('wave_start');

    if (this.onWaveStartCallback) {
      this.onWaveStartCallback(waveNumber);
    }

    // Build spawn queue
    this.buildSpawnQueue();

    // Start spawning
    this.processSpawnQueue();
  }

  private buildSpawnQueue(): void {
    if (!this.waveConfig) return;

    this.spawnQueue = [];

    // Add melee enemies
    for (let i = 0; i < this.waveConfig.meleeCount; i++) {
      this.spawnQueue.push({
        type: 'melee',
        delay: this.waveConfig.spawnDelay,
      });
    }

    // Add ranged enemies
    for (let i = 0; i < this.waveConfig.rangedCount; i++) {
      this.spawnQueue.push({
        type: 'ranged',
        delay: this.waveConfig.spawnDelay,
      });
    }

    // Shuffle the queue
    this.spawnQueue = shuffleArray(this.spawnQueue);
  }

  private processSpawnQueue(): void {
    if (this.spawnQueue.length === 0) return;

    const next = this.spawnQueue.shift()!;
    this.spawnEnemy(next.type);

    if (this.spawnQueue.length > 0) {
      this.spawnTimer = window.setTimeout(() => {
        this.processSpawnQueue();
      }, next.delay);
    }
  }

  private spawnEnemy(type: EnemyType): void {
    if (this.spawnPoints.length === 0) return;

    // Get a random spawn point
    const spawnPoint = randomElement(this.spawnPoints);

    // Get enemy from pool
    const enemy = type === 'melee' 
      ? this.meleePool.acquire() 
      : this.rangedPool.acquire();

    // Spawn the enemy
    enemy.spawn(
      spawnPoint,
      this.waveConfig?.enemyHealthMultiplier || 1,
      this.waveConfig?.enemyDamageMultiplier || 1
    );

    this.activeEnemies.push(enemy);
  }

  private handleEnemyDeath(enemy: Enemy, points: number): void {
    this._enemiesRemaining--;
    this._score += points;

    // Remove from active list
    const index = this.activeEnemies.indexOf(enemy);
    if (index !== -1) {
      this.activeEnemies.splice(index, 1);
    }

    // Return to pool
    if (enemy.type === 'melee') {
      this.meleePool.release(enemy);
    } else {
      this.rangedPool.release(enemy);
    }

    if (this.onEnemyDeathCallback) {
      this.onEnemyDeathCallback(enemy, enemy.position, points);
    }

    // Check wave completion
    if (this._enemiesRemaining <= 0 && this.spawnQueue.length === 0) {
      this.completeWave();
    }
  }

  private completeWave(): void {
    this._isWaveActive = false;
    this._score += GAME_CONFIG.scorePerWave;

    this.audio.play('wave_complete');

    if (this.onWaveCompleteCallback) {
      this.onWaveCompleteCallback(this._currentWave, this._score);
    }
  }

  public update(delta: number, playerPosition: Vector3): void {
    // Update all active enemies
    this.activeEnemies.forEach((enemy) => {
      if (enemy.isAlive) {
        enemy.update(delta, playerPosition);
      }
    });
  }

  public damageEnemy(entityId: string, damage: number, isHeadshot: boolean): void {
    const enemy = this.activeEnemies.find((e) => e.id === entityId);
    if (enemy && enemy.isAlive) {
      enemy.takeDamage(damage, isHeadshot);

      if (isHeadshot) {
        this._score += GAME_CONFIG.scorePerHeadshot;
      }
    }
  }

  public getActiveEnemies(): Enemy[] {
    return this.activeEnemies.filter((e) => e.isAlive);
  }

  public onWaveStart(callback: (wave: number) => void): void {
    this.onWaveStartCallback = callback;
  }

  public onWaveComplete(callback: (wave: number, score: number) => void): void {
    this.onWaveCompleteCallback = callback;
  }

  public onEnemyDeath(callback: (enemy: Enemy, position: Vector3, score: number) => void): void {
    this.onEnemyDeathCallback = callback;
  }

  public onEnemyAttack(callback: (damage: number, direction: Vector3) => void): void {
    this.onEnemyAttackCallback = callback;
  }

  public reset(): void {
    // Clear spawn timer
    if (this.spawnTimer) {
      clearTimeout(this.spawnTimer);
      this.spawnTimer = null;
    }

    // Reset and return all active enemies to their pools
    this.activeEnemies.forEach((enemy) => {
      if (enemy.type === 'melee') {
        this.meleePool.release(enemy);
      } else {
        this.rangedPool.release(enemy);
      }
    });
    this.activeEnemies = [];

    this._currentWave = 0;
    this._enemiesRemaining = 0;
    this._isWaveActive = false;
    this._score = 0;
    this.spawnQueue = [];
  }

  public dispose(): void {
    this.reset();
    this.meleePool.releaseAll();
    this.rangedPool.releaseAll();
  }
}
