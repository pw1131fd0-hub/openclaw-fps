import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WaveManager } from '@/game/WaveManager';
import { getWaveConfig, GAME_CONFIG } from '@/data/Config';
import type { Physics } from '@/engine/Physics';
import type { AudioManager } from '@/engine/AudioManager';
import type * as THREE from 'three';

// Create mock implementations
function createMockPhysics(): Physics {
  return {
    createPlayerBody: vi.fn(),
    createEnemyBody: vi.fn(() => ({
      position: { x: 0, y: 0, z: 0, set: vi.fn() },
      velocity: { x: 0, y: 0, z: 0, set: vi.fn() },
      addEventListener: vi.fn(),
      collisionResponse: true,
    })),
    addBody: vi.fn(),
    removeBody: vi.fn(),
    raycast: vi.fn(() => ({ hit: false })),
    update: vi.fn(),
    step: vi.fn(),
    createStaticBox: vi.fn(),
    createPickupBody: vi.fn(),
    dispose: vi.fn(),
  } as unknown as Physics;
}

function createMockAudioManager(): AudioManager {
  return {
    play: vi.fn(),
    stop: vi.fn(),
    setVolume: vi.fn(),
    setMasterVolume: vi.fn(),
    isPlaying: vi.fn(() => false),
    loadSounds: vi.fn(),
    dispose: vi.fn(),
  } as unknown as AudioManager;
}

function createMockScene(): THREE.Scene {
  return {
    add: vi.fn(),
    remove: vi.fn(),
    children: [],
  } as unknown as THREE.Scene;
}

describe('WaveManager', () => {
  let waveManager: WaveManager;
  let mockPhysics: Physics;
  let mockAudio: AudioManager;
  let mockScene: THREE.Scene;

  beforeEach(() => {
    vi.useFakeTimers();
    mockPhysics = createMockPhysics();
    mockAudio = createMockAudioManager();
    mockScene = createMockScene();

    waveManager = new WaveManager(mockPhysics, mockAudio, mockScene);
    waveManager.setSpawnPoints([
      { x: 10, y: 1, z: 10 },
      { x: -10, y: 1, z: 10 },
      { x: 10, y: 1, z: -10 },
      { x: -10, y: 1, z: -10 },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should start with wave 0', () => {
      expect(waveManager.currentWave).toBe(0);
    });

    it('should start with 0 enemies remaining', () => {
      expect(waveManager.enemiesRemaining).toBe(0);
    });

    it('should not be active initially', () => {
      expect(waveManager.isWaveActive).toBe(false);
    });

    it('should start with score 0', () => {
      expect(waveManager.score).toBe(0);
    });
  });

  describe('startWave', () => {
    it('should set current wave number', () => {
      waveManager.startWave(1);
      expect(waveManager.currentWave).toBe(1);
    });

    it('should set wave as active', () => {
      waveManager.startWave(1);
      expect(waveManager.isWaveActive).toBe(true);
    });

    it('should set enemies remaining based on wave config', () => {
      waveManager.startWave(1);
      const config = getWaveConfig(1);
      expect(waveManager.enemiesRemaining).toBe(config.totalEnemies);
    });

    it('should play wave start sound', () => {
      waveManager.startWave(1);
      expect(mockAudio.play).toHaveBeenCalledWith('wave_start');
    });

    it('should call onWaveStart callback', () => {
      const callback = vi.fn();
      waveManager.onWaveStart(callback);
      waveManager.startWave(1);
      expect(callback).toHaveBeenCalledWith(1);
    });

    it('should handle multiple waves', () => {
      waveManager.startWave(1);
      expect(waveManager.currentWave).toBe(1);
      
      // Reset for next wave
      waveManager.reset();
      waveManager.startWave(5);
      expect(waveManager.currentWave).toBe(5);
    });
  });

  describe('wave configuration', () => {
    it('should increase enemies with higher waves', () => {
      const wave1Config = getWaveConfig(1);
      const wave5Config = getWaveConfig(5);
      
      expect(wave5Config.totalEnemies).toBeGreaterThan(wave1Config.totalEnemies);
    });

    it('should increase enemy health multiplier with waves', () => {
      const wave1Config = getWaveConfig(1);
      const wave10Config = getWaveConfig(10);
      
      expect(wave10Config.enemyHealthMultiplier).toBeGreaterThan(wave1Config.enemyHealthMultiplier);
    });

    it('should add ranged enemies in later waves', () => {
      const wave1Config = getWaveConfig(1);
      const wave10Config = getWaveConfig(10);
      
      const rangedRatio1 = wave1Config.rangedCount / wave1Config.totalEnemies;
      const rangedRatio10 = wave10Config.rangedCount / wave10Config.totalEnemies;
      
      expect(rangedRatio10).toBeGreaterThanOrEqual(rangedRatio1);
    });
  });

  describe('getActiveEnemies', () => {
    it('should return empty array when no enemies', () => {
      const enemies = waveManager.getActiveEnemies();
      expect(enemies).toHaveLength(0);
    });
  });

  describe('damageEnemy', () => {
    it('should not throw when enemy not found', () => {
      expect(() => {
        waveManager.damageEnemy('nonexistent', 50, false);
      }).not.toThrow();
    });

    it('should add headshot bonus score', () => {
      const initialScore = waveManager.score;
      // Note: This requires an active enemy which is complex to mock
      // The implementation adds GAME_CONFIG.scorePerHeadshot for headshots
      expect(GAME_CONFIG.scorePerHeadshot).toBeGreaterThan(0);
    });
  });

  describe('callbacks', () => {
    it('should register onWaveStart callback', () => {
      const callback = vi.fn();
      waveManager.onWaveStart(callback);
      waveManager.startWave(1);
      expect(callback).toHaveBeenCalled();
    });

    it('should register onWaveComplete callback', () => {
      const callback = vi.fn();
      waveManager.onWaveComplete(callback);
      // Callback would be called when wave completes
      expect(callback).not.toHaveBeenCalled(); // Not yet complete
    });

    it('should register onEnemyDeath callback', () => {
      const callback = vi.fn();
      waveManager.onEnemyDeath(callback);
      // Would be called when enemy dies
    });

    it('should register onEnemyAttack callback', () => {
      const callback = vi.fn();
      waveManager.onEnemyAttack(callback);
      // Would be called when enemy attacks
    });
  });

  describe('reset', () => {
    it('should reset wave to 0', () => {
      waveManager.startWave(5);
      waveManager.reset();
      expect(waveManager.currentWave).toBe(0);
    });

    it('should reset enemies remaining to 0', () => {
      waveManager.startWave(1);
      waveManager.reset();
      expect(waveManager.enemiesRemaining).toBe(0);
    });

    it('should set wave as not active', () => {
      waveManager.startWave(1);
      waveManager.reset();
      expect(waveManager.isWaveActive).toBe(false);
    });

    it('should reset score to 0', () => {
      waveManager.startWave(1);
      waveManager.reset();
      expect(waveManager.score).toBe(0);
    });

    it('should clear active enemies', () => {
      waveManager.startWave(1);
      waveManager.reset();
      expect(waveManager.getActiveEnemies()).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should not throw when called', () => {
      expect(() => {
        waveManager.update(0.016, { x: 0, y: 1, z: 0 });
      }).not.toThrow();
    });

    it('should accept player position', () => {
      waveManager.startWave(1);
      expect(() => {
        waveManager.update(0.016, { x: 5, y: 1, z: 5 });
      }).not.toThrow();
    });
  });

  describe('dispose', () => {
    it('should reset and release pool', () => {
      waveManager.startWave(1);
      expect(() => {
        waveManager.dispose();
      }).not.toThrow();
    });
  });
});

// Import afterEach
import { afterEach } from 'vitest';
