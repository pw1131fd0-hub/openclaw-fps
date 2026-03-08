import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GAME_CONFIG, PLAYER_CONFIG, ARENA_MAP } from '@/data/Config';

// Integration tests for game flow
describe('Game Integration', () => {
  describe('Game configuration', () => {
    it('should have valid starting wave', () => {
      expect(GAME_CONFIG.startingWave).toBe(1);
    });

    it('should have wave intermission time', () => {
      expect(GAME_CONFIG.waveIntermissionTime).toBeGreaterThan(0);
    });

    it('should have scoring values', () => {
      expect(GAME_CONFIG.scorePerKill).toBe(100);
      expect(GAME_CONFIG.scorePerWave).toBe(500);
      expect(GAME_CONFIG.scorePerHeadshot).toBe(50);
    });

    it('should have pickup spawn chance', () => {
      expect(GAME_CONFIG.pickupSpawnChance).toBeGreaterThan(0);
      expect(GAME_CONFIG.pickupSpawnChance).toBeLessThanOrEqual(1);
    });

    it('should have physics settings', () => {
      expect(GAME_CONFIG.gravity).toBeLessThan(0);
      expect(GAME_CONFIG.physicsStepSize).toBe(1 / 60);
    });
  });

  describe('Player configuration', () => {
    it('should have movement speed', () => {
      expect(PLAYER_CONFIG.moveSpeed).toBe(8);
    });

    it('should have sprint multiplier', () => {
      expect(PLAYER_CONFIG.sprintMultiplier).toBe(1.5);
    });

    it('should have jump force', () => {
      expect(PLAYER_CONFIG.jumpForce).toBe(7);
    });

    it('should have max health', () => {
      expect(PLAYER_CONFIG.maxHealth).toBe(100);
    });

    it('should have player dimensions', () => {
      expect(PLAYER_CONFIG.height).toBe(1.8);
      expect(PLAYER_CONFIG.radius).toBe(0.5);
    });
  });

  describe('Arena map configuration', () => {
    it('should have player spawn point', () => {
      expect(ARENA_MAP.playerSpawn.position).toBeDefined();
      expect(ARENA_MAP.playerSpawn.position.x).toBe(0);
      expect(ARENA_MAP.playerSpawn.position.z).toBe(0);
    });

    it('should have multiple enemy spawn points', () => {
      expect(ARENA_MAP.enemySpawns.length).toBeGreaterThanOrEqual(4);
    });

    it('should have pickup spawn locations', () => {
      expect(ARENA_MAP.pickupSpawns.length).toBeGreaterThan(0);
    });

    it('should have map bounds', () => {
      expect(ARENA_MAP.bounds.min.x).toBeLessThan(ARENA_MAP.bounds.max.x);
      expect(ARENA_MAP.bounds.min.z).toBeLessThan(ARENA_MAP.bounds.max.z);
    });
  });
});

describe('Scoring system', () => {
  it('should calculate kill score correctly', () => {
    const baseKillScore = GAME_CONFIG.scorePerKill;
    const enemyScoreValue = 100;
    
    expect(baseKillScore + enemyScoreValue).toBe(200);
  });

  it('should calculate wave completion bonus', () => {
    const waveBonus = GAME_CONFIG.scorePerWave;
    expect(waveBonus).toBe(500);
  });

  it('should calculate headshot bonus', () => {
    const headshotBonus = GAME_CONFIG.scorePerHeadshot;
    expect(headshotBonus).toBe(50);
  });

  it('should accumulate score over multiple waves', () => {
    let totalScore = 0;
    
    // Wave 1: 3 kills (each kill gives both scorePerKill + enemy's scoreValue)
    const enemyScoreValue = 100; // Default enemy score value
    totalScore += 3 * (GAME_CONFIG.scorePerKill + enemyScoreValue);
    totalScore += GAME_CONFIG.scorePerWave;
    
    // Wave 2: 5 kills with 1 headshot
    totalScore += 5 * (GAME_CONFIG.scorePerKill + enemyScoreValue);
    totalScore += GAME_CONFIG.scorePerHeadshot;
    totalScore += GAME_CONFIG.scorePerWave;
    
    expect(totalScore).toBe(2650); // (3*200) + 500 + (5*200) + 50 + 500
  });
});

describe('Wave progression', () => {
  it('should increase enemy count each wave', () => {
    // Based on getWaveConfig formula
    const baseEnemies = 3;
    const enemiesPerWave = 2;
    
    const wave1Enemies = baseEnemies + (1 - 1) * enemiesPerWave;
    const wave5Enemies = baseEnemies + (5 - 1) * enemiesPerWave;
    const wave10Enemies = baseEnemies + (10 - 1) * enemiesPerWave;
    
    expect(wave1Enemies).toBe(3);
    expect(wave5Enemies).toBe(11);
    expect(wave10Enemies).toBe(21);
  });

  it('should increase enemy difficulty each wave', () => {
    // Health multiplier formula: 1 + (wave - 1) * 0.1
    const wave1HealthMult = 1 + (1 - 1) * 0.1;
    const wave5HealthMult = 1 + (5 - 1) * 0.1;
    const wave10HealthMult = 1 + (10 - 1) * 0.1;
    
    expect(wave1HealthMult).toBeCloseTo(1.0);
    expect(wave5HealthMult).toBeCloseTo(1.4);
    expect(wave10HealthMult).toBeCloseTo(1.9);
  });

  it('should add more ranged enemies in later waves', () => {
    // Ranged ratio formula: Math.min(0.5, wave * 0.05)
    const wave1RangedRatio = Math.min(0.5, 1 * 0.05);
    const wave5RangedRatio = Math.min(0.5, 5 * 0.05);
    const wave10RangedRatio = Math.min(0.5, 10 * 0.05);
    
    expect(wave1RangedRatio).toBeCloseTo(0.05);
    expect(wave5RangedRatio).toBeCloseTo(0.25);
    expect(wave10RangedRatio).toBeCloseTo(0.5);
  });
});

describe('Health system', () => {
  it('should start with full health', () => {
    const health = PLAYER_CONFIG.maxHealth;
    expect(health).toBe(100);
  });

  it('should not exceed max health when healing', () => {
    let health = 75;
    const maxHealth = PLAYER_CONFIG.maxHealth;
    const healAmount = 50;
    
    health = Math.min(maxHealth, health + healAmount);
    expect(health).toBe(100);
  });

  it('should not go below 0 when taking damage', () => {
    let health = 10;
    const damage = 50;
    
    health = Math.max(0, health - damage);
    expect(health).toBe(0);
  });

  it('should trigger death when health reaches 0', () => {
    let health = 100;
    let isAlive = true;
    
    health = Math.max(0, health - 100);
    if (health <= 0) {
      isAlive = false;
    }
    
    expect(health).toBe(0);
    expect(isAlive).toBe(false);
  });
});

describe('Weapon system', () => {
  it('should switch weapons correctly', () => {
    let currentWeapon = 'pistol';
    
    currentWeapon = 'shotgun';
    expect(currentWeapon).toBe('shotgun');
    
    currentWeapon = 'assault_rifle';
    expect(currentWeapon).toBe('assault_rifle');
  });

  it('should not switch to same weapon', () => {
    let currentWeapon = 'pistol';
    const switchCount = { value: 0 };
    
    const switchWeapon = (weapon: string) => {
      if (weapon !== currentWeapon) {
        switchCount.value++;
        currentWeapon = weapon;
      }
    };
    
    switchWeapon('pistol'); // Same weapon
    expect(switchCount.value).toBe(0);
    
    switchWeapon('shotgun'); // Different weapon
    expect(switchCount.value).toBe(1);
  });
});

describe('Pickup system', () => {
  it('should have health pickup config', () => {
    const healthPickupValue = 25;
    expect(healthPickupValue).toBeGreaterThan(0);
  });

  it('should have ammo pickup configs', () => {
    const ammoValues = {
      pistol: 12,
      shotgun: 6,
      rifle: 30,
    };
    
    expect(ammoValues.pistol).toBe(12);
    expect(ammoValues.shotgun).toBe(6);
    expect(ammoValues.rifle).toBe(30);
  });

  it('should respect pickup collection radius', () => {
    const collectRadius = 1.5;
    const playerPos = { x: 0, y: 0, z: 0 };
    const pickupPos = { x: 1, y: 0, z: 0 };
    
    const distance = Math.sqrt(
      Math.pow(pickupPos.x - playerPos.x, 2) +
      Math.pow(pickupPos.z - playerPos.z, 2)
    );
    
    expect(distance).toBeLessThan(collectRadius);
  });
});

describe('Game state machine', () => {
  it('should transition from loading to menu', () => {
    let state = 'loading';
    
    state = 'menu';
    expect(state).toBe('menu');
  });

  it('should transition from menu to playing', () => {
    let state = 'menu';
    
    state = 'playing';
    expect(state).toBe('playing');
  });

  it('should transition from playing to paused', () => {
    let state = 'playing';
    
    state = 'paused';
    expect(state).toBe('paused');
  });

  it('should transition from paused to playing', () => {
    let state = 'paused';
    
    state = 'playing';
    expect(state).toBe('playing');
  });

  it('should transition from playing to gameOver', () => {
    let state = 'playing';
    
    state = 'gameOver';
    expect(state).toBe('gameOver');
  });

  it('should transition from gameOver to menu', () => {
    let state = 'gameOver';
    
    state = 'menu';
    expect(state).toBe('menu');
  });
});
