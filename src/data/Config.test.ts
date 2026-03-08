import { describe, it, expect } from 'vitest';
import {
  WEAPON_CONFIGS,
  ENEMY_CONFIGS,
  PICKUP_CONFIGS,
  PLAYER_CONFIG,
  GAME_CONFIG,
  DEFAULT_SETTINGS,
  ARENA_MAP,
  COLORS,
  getWaveConfig,
  colorToCSS,
  getWeaponByIndex,
  distance,
  normalize,
} from '@/data/Config';
import { Vector3 } from '@/types/GameTypes';

describe('Config', () => {
  describe('WEAPON_CONFIGS', () => {
    it('should have pistol configuration', () => {
      expect(WEAPON_CONFIGS.pistol).toBeDefined();
      expect(WEAPON_CONFIGS.pistol.type).toBe('pistol');
      expect(WEAPON_CONFIGS.pistol.damage).toBeGreaterThan(0);
      expect(WEAPON_CONFIGS.pistol.magazineSize).toBeGreaterThan(0);
    });

    it('should have shotgun configuration', () => {
      expect(WEAPON_CONFIGS.shotgun).toBeDefined();
      expect(WEAPON_CONFIGS.shotgun.type).toBe('shotgun');
      expect(WEAPON_CONFIGS.shotgun.projectileCount).toBeGreaterThan(1);
    });

    it('should have assault rifle configuration', () => {
      expect(WEAPON_CONFIGS.assault_rifle).toBeDefined();
      expect(WEAPON_CONFIGS.assault_rifle.type).toBe('assault_rifle');
      expect(WEAPON_CONFIGS.assault_rifle.fireRate).toBeGreaterThan(WEAPON_CONFIGS.pistol.fireRate);
    });

    it('all weapons should have required properties', () => {
      Object.values(WEAPON_CONFIGS).forEach((config) => {
        expect(config.type).toBeDefined();
        expect(config.name).toBeDefined();
        expect(config.damage).toBeGreaterThan(0);
        expect(config.headshotMultiplier).toBeGreaterThan(1);
        expect(config.fireRate).toBeGreaterThan(0);
        expect(config.magazineSize).toBeGreaterThan(0);
        expect(config.maxReserveAmmo).toBeGreaterThan(0);
        expect(config.reloadTime).toBeGreaterThan(0);
        expect(config.range).toBeGreaterThan(0);
      });
    });
  });

  describe('ENEMY_CONFIGS', () => {
    it('should have melee enemy configuration', () => {
      expect(ENEMY_CONFIGS.melee).toBeDefined();
      expect(ENEMY_CONFIGS.melee.type).toBe('melee');
      expect(ENEMY_CONFIGS.melee.attackRange).toBeLessThan(10);
    });

    it('should have ranged enemy configuration', () => {
      expect(ENEMY_CONFIGS.ranged).toBeDefined();
      expect(ENEMY_CONFIGS.ranged.type).toBe('ranged');
      expect(ENEMY_CONFIGS.ranged.attackRange).toBeGreaterThan(ENEMY_CONFIGS.melee.attackRange);
    });

    it('melee should be faster but ranged should have more detection range', () => {
      expect(ENEMY_CONFIGS.melee.speed).toBeGreaterThan(ENEMY_CONFIGS.ranged.speed);
      expect(ENEMY_CONFIGS.ranged.detectionRange).toBeGreaterThan(ENEMY_CONFIGS.melee.detectionRange);
    });
  });

  describe('PICKUP_CONFIGS', () => {
    it('should have health pickup', () => {
      expect(PICKUP_CONFIGS.health).toBeDefined();
      expect(PICKUP_CONFIGS.health.value).toBeGreaterThan(0);
    });

    it('should have ammo pickups for all weapons', () => {
      expect(PICKUP_CONFIGS.ammo_pistol).toBeDefined();
      expect(PICKUP_CONFIGS.ammo_shotgun).toBeDefined();
      expect(PICKUP_CONFIGS.ammo_rifle).toBeDefined();
    });
  });

  describe('PLAYER_CONFIG', () => {
    it('should have valid player configuration', () => {
      expect(PLAYER_CONFIG.moveSpeed).toBeGreaterThan(0);
      expect(PLAYER_CONFIG.sprintMultiplier).toBeGreaterThan(1);
      expect(PLAYER_CONFIG.jumpForce).toBeGreaterThan(0);
      expect(PLAYER_CONFIG.maxHealth).toBeGreaterThan(0);
      expect(PLAYER_CONFIG.height).toBeGreaterThan(0);
      expect(PLAYER_CONFIG.radius).toBeGreaterThan(0);
    });
  });

  describe('GAME_CONFIG', () => {
    it('should have valid game configuration', () => {
      expect(GAME_CONFIG.startingWave).toBeGreaterThanOrEqual(1);
      expect(GAME_CONFIG.waveIntermissionTime).toBeGreaterThan(0);
      expect(GAME_CONFIG.scorePerKill).toBeGreaterThan(0);
      expect(GAME_CONFIG.gravity).toBeLessThan(0);
    });
  });

  describe('getWaveConfig', () => {
    it('should return wave configuration for wave 1', () => {
      const config = getWaveConfig(1);
      expect(config.wave).toBe(1);
      expect(config.totalEnemies).toBeGreaterThan(0);
      expect(config.meleeCount + config.rangedCount).toBe(config.totalEnemies);
    });

    it('should increase enemies with higher waves', () => {
      const wave1 = getWaveConfig(1);
      const wave5 = getWaveConfig(5);
      expect(wave5.totalEnemies).toBeGreaterThan(wave1.totalEnemies);
    });

    it('should add more ranged enemies in later waves', () => {
      const wave1 = getWaveConfig(1);
      const wave10 = getWaveConfig(10);
      const rangedRatio1 = wave1.rangedCount / wave1.totalEnemies;
      const rangedRatio10 = wave10.rangedCount / wave10.totalEnemies;
      expect(rangedRatio10).toBeGreaterThan(rangedRatio1);
    });

    it('should increase enemy stats with waves', () => {
      const wave1 = getWaveConfig(1);
      const wave5 = getWaveConfig(5);
      expect(wave5.enemyHealthMultiplier).toBeGreaterThan(wave1.enemyHealthMultiplier);
      expect(wave5.enemyDamageMultiplier).toBeGreaterThan(wave1.enemyDamageMultiplier);
    });

    it('should decrease spawn delay with higher waves', () => {
      const wave1 = getWaveConfig(1);
      const wave10 = getWaveConfig(10);
      expect(wave10.spawnDelay).toBeLessThanOrEqual(wave1.spawnDelay);
    });
  });

  describe('DEFAULT_SETTINGS', () => {
    it('should have valid default settings', () => {
      expect(DEFAULT_SETTINGS.musicVolume).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_SETTINGS.musicVolume).toBeLessThanOrEqual(1);
      expect(DEFAULT_SETTINGS.sfxVolume).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_SETTINGS.sfxVolume).toBeLessThanOrEqual(1);
      expect(typeof DEFAULT_SETTINGS.invertY).toBe('boolean');
      expect(typeof DEFAULT_SETTINGS.showFPS).toBe('boolean');
    });
  });

  describe('ARENA_MAP', () => {
    it('should have valid map configuration', () => {
      expect(ARENA_MAP.id).toBe('arena');
      expect(ARENA_MAP.name).toBeDefined();
      expect(ARENA_MAP.playerSpawn.position).toBeDefined();
      expect(ARENA_MAP.enemySpawns.length).toBeGreaterThan(0);
      expect(ARENA_MAP.pickupSpawns.length).toBeGreaterThan(0);
    });

    it('should have valid bounds', () => {
      expect(ARENA_MAP.bounds.min.x).toBeLessThan(ARENA_MAP.bounds.max.x);
      expect(ARENA_MAP.bounds.min.y).toBeLessThan(ARENA_MAP.bounds.max.y);
      expect(ARENA_MAP.bounds.min.z).toBeLessThan(ARENA_MAP.bounds.max.z);
    });

    it('player spawn should be within bounds', () => {
      const pos = ARENA_MAP.playerSpawn.position;
      expect(pos.x).toBeGreaterThanOrEqual(ARENA_MAP.bounds.min.x);
      expect(pos.x).toBeLessThanOrEqual(ARENA_MAP.bounds.max.x);
      expect(pos.z).toBeGreaterThanOrEqual(ARENA_MAP.bounds.min.z);
      expect(pos.z).toBeLessThanOrEqual(ARENA_MAP.bounds.max.z);
    });
  });

  describe('COLORS', () => {
    it('should have all required colors', () => {
      expect(COLORS.primary).toBeDefined();
      expect(COLORS.secondary).toBeDefined();
      expect(COLORS.accent).toBeDefined();
      expect(COLORS.background).toBeDefined();
      expect(COLORS.danger).toBeDefined();
      expect(COLORS.health).toBeDefined();
      expect(COLORS.ammo).toBeDefined();
    });

    it('colors should be valid hex values', () => {
      Object.values(COLORS).forEach((color) => {
        expect(typeof color).toBe('number');
        expect(color).toBeGreaterThanOrEqual(0);
        expect(color).toBeLessThanOrEqual(0xffffff);
      });
    });
  });

  describe('colorToCSS', () => {
    it('should convert color to CSS hex string', () => {
      expect(colorToCSS(0x00d4ff)).toBe('#00d4ff');
      expect(colorToCSS(0xff0000)).toBe('#ff0000');
      expect(colorToCSS(0x000000)).toBe('#000000');
      expect(colorToCSS(0xffffff)).toBe('#ffffff');
    });

    it('should pad short hex values', () => {
      expect(colorToCSS(0x123)).toBe('#000123');
    });
  });

  describe('getWeaponByIndex', () => {
    it('should return correct weapon for index 1', () => {
      expect(getWeaponByIndex(1)).toBe('pistol');
    });

    it('should return correct weapon for index 2', () => {
      expect(getWeaponByIndex(2)).toBe('shotgun');
    });

    it('should return correct weapon for index 3', () => {
      expect(getWeaponByIndex(3)).toBe('assault_rifle');
    });

    it('should return null for invalid index', () => {
      expect(getWeaponByIndex(0)).toBeNull();
      expect(getWeaponByIndex(4)).toBeNull();
      expect(getWeaponByIndex(-1)).toBeNull();
    });
  });

  describe('distance utility', () => {
    it('should calculate 3D distance', () => {
      const a: Vector3 = { x: 0, y: 0, z: 0 };
      const b: Vector3 = { x: 3, y: 4, z: 0 };
      expect(distance(a, b)).toBe(5);
    });
  });

  describe('normalize utility', () => {
    it('should normalize vector', () => {
      const v: Vector3 = { x: 3, y: 0, z: 4 };
      const result = normalize(v);
      expect(result.x).toBeCloseTo(0.6);
      expect(result.z).toBeCloseTo(0.8);
    });

    it('should handle zero vector', () => {
      const v: Vector3 = { x: 0, y: 0, z: 0 };
      const result = normalize(v);
      expect(result).toEqual({ x: 0, y: 0, z: 0 });
    });
  });
});
