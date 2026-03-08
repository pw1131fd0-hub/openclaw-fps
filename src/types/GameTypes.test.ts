import { describe, it, expect } from 'vitest';
import {
  GameState,
  WeaponType,
  EnemyType,
  EnemyState,
  PickupType,
  Vector3,
  GameStats,
  WeaponConfig,
  EnemyConfig,
  PickupConfig,
  PlayerConfig,
  WaveConfig,
  GameSettings,
  HighScoreEntry,
  HitResult,
  SpawnPoint,
  MapConfig,
  SoundName,
  KeyAction,
} from '@/types/GameTypes';

describe('GameTypes', () => {
  describe('GameState', () => {
    it('should support all valid game states', () => {
      const states: GameState[] = ['loading', 'menu', 'playing', 'paused', 'gameOver'];
      states.forEach((state) => {
        expect(typeof state).toBe('string');
      });
    });
  });

  describe('WeaponType', () => {
    it('should support all weapon types', () => {
      const weapons: WeaponType[] = ['pistol', 'shotgun', 'assault_rifle'];
      expect(weapons).toHaveLength(3);
    });
  });

  describe('EnemyType', () => {
    it('should support all enemy types', () => {
      const enemies: EnemyType[] = ['melee', 'ranged'];
      expect(enemies).toHaveLength(2);
    });
  });

  describe('EnemyState', () => {
    it('should support all enemy states', () => {
      const states: EnemyState[] = ['idle', 'patrol', 'chase', 'attack', 'dead'];
      expect(states).toHaveLength(5);
    });
  });

  describe('PickupType', () => {
    it('should support all pickup types', () => {
      const pickups: PickupType[] = ['health', 'ammo_pistol', 'ammo_shotgun', 'ammo_rifle'];
      expect(pickups).toHaveLength(4);
    });
  });

  describe('Vector3', () => {
    it('should have x, y, z components', () => {
      const vec: Vector3 = { x: 1, y: 2, z: 3 };
      expect(vec.x).toBe(1);
      expect(vec.y).toBe(2);
      expect(vec.z).toBe(3);
    });
  });

  describe('GameStats', () => {
    it('should have all required stats', () => {
      const stats: GameStats = {
        wave: 5,
        score: 1000,
        enemiesKilled: 25,
        damageDealt: 500,
        damageTaken: 100,
        shotsFired: 150,
        shotsHit: 75,
      };
      expect(stats.wave).toBe(5);
      expect(stats.score).toBe(1000);
      expect(stats.shotsHit / stats.shotsFired).toBe(0.5); // 50% accuracy
    });
  });

  describe('WeaponConfig', () => {
    it('should have all required weapon properties', () => {
      const config: WeaponConfig = {
        type: 'pistol',
        name: 'Pistol',
        damage: 25,
        headshotMultiplier: 2.0,
        fireRate: 3,
        magazineSize: 12,
        maxReserveAmmo: 60,
        reloadTime: 1500,
        spread: 1,
        projectileCount: 1,
        range: 100,
      };
      expect(config.type).toBe('pistol');
      expect(config.damage * config.headshotMultiplier).toBe(50);
    });
  });

  describe('EnemyConfig', () => {
    it('should have all required enemy properties', () => {
      const config: EnemyConfig = {
        type: 'melee',
        name: 'Zombie',
        health: 100,
        speed: 5,
        damage: 15,
        attackRange: 2,
        attackCooldown: 1000,
        detectionRange: 30,
        scoreValue: 100,
        modelScale: 1.0,
      };
      expect(config.type).toBe('melee');
      expect(config.health).toBe(100);
    });
  });

  describe('PickupConfig', () => {
    it('should have all required pickup properties', () => {
      const config: PickupConfig = {
        type: 'health',
        value: 25,
        respawnTime: 0,
        collectRadius: 1.5,
      };
      expect(config.type).toBe('health');
      expect(config.value).toBe(25);
    });
  });

  describe('PlayerConfig', () => {
    it('should have all required player properties', () => {
      const config: PlayerConfig = {
        moveSpeed: 8,
        sprintMultiplier: 1.5,
        jumpForce: 7,
        mouseSensitivity: 0.002,
        maxHealth: 100,
        height: 1.8,
        radius: 0.5,
      };
      expect(config.moveSpeed * config.sprintMultiplier).toBe(12);
    });
  });

  describe('WaveConfig', () => {
    it('should have all required wave properties', () => {
      const config: WaveConfig = {
        wave: 1,
        totalEnemies: 5,
        meleeCount: 4,
        rangedCount: 1,
        spawnDelay: 2000,
        enemyHealthMultiplier: 1.0,
        enemyDamageMultiplier: 1.0,
      };
      expect(config.meleeCount + config.rangedCount).toBe(config.totalEnemies);
    });
  });

  describe('GameSettings', () => {
    it('should have all required settings', () => {
      const settings: GameSettings = {
        musicVolume: 0.5,
        sfxVolume: 0.7,
        mouseSensitivity: 0.002,
        invertY: false,
        showFPS: false,
        touchControlsEnabled: true,
      };
      expect(settings.musicVolume).toBe(0.5);
      expect(settings.invertY).toBe(false);
    });
  });

  describe('HighScoreEntry', () => {
    it('should have all required score properties', () => {
      const entry: HighScoreEntry = {
        score: 5000,
        wave: 10,
        date: '2024-01-01T00:00:00.000Z',
      };
      expect(entry.score).toBe(5000);
      expect(entry.wave).toBe(10);
    });
  });

  describe('HitResult', () => {
    it('should support no-hit result', () => {
      const result: HitResult = { hit: false };
      expect(result.hit).toBe(false);
    });

    it('should support hit with full details', () => {
      const result: HitResult = {
        hit: true,
        entityId: 'enemy-1',
        entityType: 'enemy',
        position: { x: 10, y: 1, z: 5 },
        distance: 15,
        damage: 25,
        isHeadshot: true,
      };
      expect(result.hit).toBe(true);
      expect(result.isHeadshot).toBe(true);
    });
  });

  describe('SpawnPoint', () => {
    it('should have position and optional rotation', () => {
      const spawn: SpawnPoint = {
        position: { x: 0, y: 1, z: 0 },
        rotation: Math.PI,
      };
      expect(spawn.position.y).toBe(1);
      expect(spawn.rotation).toBe(Math.PI);
    });
  });

  describe('MapConfig', () => {
    it('should have all required map properties', () => {
      const map: MapConfig = {
        id: 'test-map',
        name: 'Test Map',
        playerSpawn: {
          position: { x: 0, y: 1, z: 0 },
          rotation: 0,
        },
        enemySpawns: [{ position: { x: 10, y: 1, z: 10 } }],
        pickupSpawns: [{ x: 5, y: 0.5, z: 5 }],
        bounds: {
          min: { x: -50, y: 0, z: -50 },
          max: { x: 50, y: 30, z: 50 },
        },
      };
      expect(map.id).toBe('test-map');
      expect(map.enemySpawns.length).toBe(1);
    });
  });

  describe('SoundName', () => {
    it('should include all required sounds', () => {
      const sounds: SoundName[] = [
        'pistol_fire',
        'shotgun_fire',
        'rifle_fire',
        'reload',
        'empty_click',
        'weapon_switch',
        'enemy_hurt',
        'enemy_death',
        'player_hurt',
        'player_death',
        'pickup_health',
        'pickup_ammo',
        'wave_start',
        'wave_complete',
        'hit_marker',
        'footstep',
      ];
      expect(sounds).toHaveLength(16);
    });
  });

  describe('KeyAction', () => {
    it('should include all required actions', () => {
      const actions: KeyAction[] = [
        'moveForward',
        'moveBackward',
        'moveLeft',
        'moveRight',
        'jump',
        'reload',
        'fire',
        'weapon1',
        'weapon2',
        'weapon3',
        'pause',
      ];
      expect(actions).toHaveLength(11);
    });
  });
});
