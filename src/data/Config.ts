import {
  WeaponType,
  EnemyType,
  PickupType,
  WeaponConfig,
  EnemyConfig,
  PickupConfig,
  PlayerConfig,
  WaveConfig,
  MapConfig,
  GameSettings,
  Vector3,
} from '@/types/GameTypes';

// Weapon configurations
export const WEAPON_CONFIGS: Record<WeaponType, WeaponConfig> = {
  pistol: {
    type: 'pistol',
    name: '手槍',
    damage: 25,
    headshotMultiplier: 2.0,
    fireRate: 3,
    magazineSize: 12,
    maxReserveAmmo: 60,
    reloadTime: 1500,
    spread: 1,
    projectileCount: 1,
    range: 100,
  },
  shotgun: {
    type: 'shotgun',
    name: '散彈槍',
    damage: 15,
    headshotMultiplier: 1.5,
    fireRate: 1,
    magazineSize: 6,
    maxReserveAmmo: 30,
    reloadTime: 2500,
    spread: 10,
    projectileCount: 8,
    range: 30,
  },
  assault_rifle: {
    type: 'assault_rifle',
    name: '突擊步槍',
    damage: 20,
    headshotMultiplier: 2.5,
    fireRate: 10,
    magazineSize: 30,
    maxReserveAmmo: 120,
    reloadTime: 2000,
    spread: 3,
    projectileCount: 1,
    range: 80,
  },
};

// Enemy configurations
export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  melee: {
    type: 'melee',
    name: '近戰敵人',
    health: 100,
    speed: 5,
    damage: 15,
    attackRange: 2,
    attackCooldown: 1000,
    detectionRange: 30,
    scoreValue: 100,
    modelScale: 1.0,
  },
  ranged: {
    type: 'ranged',
    name: '遠程敵人',
    health: 75,
    speed: 3,
    damage: 10,
    attackRange: 25,
    attackCooldown: 2000,
    detectionRange: 40,
    scoreValue: 150,
    modelScale: 1.0,
  },
};

// Pickup configurations
export const PICKUP_CONFIGS: Record<PickupType, PickupConfig> = {
  health: {
    type: 'health',
    value: 25,
    respawnTime: 0,
    collectRadius: 1.5,
  },
  ammo_pistol: {
    type: 'ammo_pistol',
    value: 12,
    respawnTime: 0,
    collectRadius: 1.5,
  },
  ammo_shotgun: {
    type: 'ammo_shotgun',
    value: 6,
    respawnTime: 0,
    collectRadius: 1.5,
  },
  ammo_rifle: {
    type: 'ammo_rifle',
    value: 30,
    respawnTime: 0,
    collectRadius: 1.5,
  },
};

// Player configuration
export const PLAYER_CONFIG: PlayerConfig = {
  moveSpeed: 5.5,
  sprintMultiplier: 1.5,
  jumpForce: 7,
  mouseSensitivity: 0.0007,
  maxHealth: 100,
  height: 1.8,
  radius: 0.5,
};

// Game configuration
export const GAME_CONFIG = {
  startingWave: 1,
  waveIntermissionTime: 3000,
  scorePerKill: 100,
  scorePerWave: 500,
  scorePerHeadshot: 50,
  pickupSpawnChance: 0.3,
  gravity: -20,
  physicsStepSize: 1 / 60,
};

// Wave configuration generator
export function getWaveConfig(wave: number): WaveConfig {
  const baseEnemies = 3;
  const enemiesPerWave = 2;
  const totalEnemies = baseEnemies + (wave - 1) * enemiesPerWave;

  // Early waves have more melee, later waves add ranged
  const rangedRatio = Math.min(0.5, wave * 0.05);
  const rangedCount = Math.floor(totalEnemies * rangedRatio);
  const meleeCount = totalEnemies - rangedCount;

  return {
    wave,
    totalEnemies,
    meleeCount,
    rangedCount,
    spawnDelay: Math.max(500, 2000 - wave * 100),
    enemyHealthMultiplier: 1 + (wave - 1) * 0.1,
    enemyDamageMultiplier: 1 + (wave - 1) * 0.05,
  };
}

// Default game settings
export const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.5,
  sfxVolume: 0.7,
  mouseSensitivity: 0.0007,
  invertY: false,
  showFPS: false,
  touchControlsEnabled: true,
  graphicsQuality: 'high',
};

// Map configurations
export const MAPS: Record<string, MapConfig> = {
  arena: {
    id: 'arena',
    name: '基礎競技場',
    playerSpawn: {
      position: { x: 0, y: 1, z: 0 },
      rotation: 0,
    },
    enemySpawns: [
      { position: { x: 20, y: 1, z: 20 } },
      { position: { x: -20, y: 1, z: 20 } },
      { position: { x: 20, y: 1, z: -20 } },
      { position: { x: -20, y: 1, z: -20 } },
      { position: { x: 0, y: 1, z: 25 } },
      { position: { x: 0, y: 1, z: -25 } },
      { position: { x: 25, y: 1, z: 0 } },
      { position: { x: -25, y: 1, z: 0 } },
    ],
    pickupSpawns: [
      { x: 10, y: 0.5, z: 10 },
      { x: -10, y: 0.5, z: 10 },
      { x: 10, y: 0.5, z: -10 },
      { x: -10, y: 0.5, z: -10 },
      { x: 0, y: 0.5, z: 15 },
      { x: 0, y: 0.5, z: -15 },
    ],
    bounds: {
      min: { x: -30, y: 0, z: -30 },
      max: { x: 30, y: 20, z: 30 },
    },
  },
  warehouse: {
    id: 'warehouse',
    name: '工業倉庫',
    playerSpawn: {
      position: { x: -20, y: 1, z: -20 },
      rotation: Math.PI / 4,
    },
    enemySpawns: [
      { position: { x: 20, y: 1, z: 20 } },
      { position: { x: 20, y: 1, z: -20 } },
      { position: { x: -20, y: 1, z: 20 } },
      { position: { x: 0, y: 1, z: 0 } },
    ],
    pickupSpawns: [
      { x: 0, y: 0.5, z: 10 },
      { x: 0, y: 0.5, z: -10 },
      { x: 10, y: 0.5, z: 0 },
      { x: -10, y: 0.5, z: 0 },
    ],
    obstacles: [
      // Central large crate
      { position: { x: 0, y: 2, z: 0 }, size: { w: 6, h: 4, d: 6 } },
      // Corner crates
      { position: { x: 15, y: 1, z: 15 }, size: { w: 4, h: 2, d: 4 } },
      { position: { x: -15, y: 1, z: 15 }, size: { w: 4, h: 2, d: 4 } },
      { position: { x: 15, y: 1, z: -15 }, size: { w: 4, h: 2, d: 4 } },
      // Side walls
      { position: { x: 0, y: 1.5, z: 18 }, size: { w: 10, h: 3, d: 1 } },
      { position: { x: 0, y: 1.5, z: -18 }, size: { w: 10, h: 3, d: 1 } },
    ],
    platforms: [
      { position: { x: 0, y: 4, z: 0 }, size: { w: 8, h: 0.5, d: 8 } },
    ],
    bounds: {
      min: { x: -25, y: 0, z: -25 },
      max: { x: 25, y: 15, z: 25 },
    },
  },
  ruins: {
    id: 'ruins',
    name: '城市廢墟',
    playerSpawn: {
      position: { x: 0, y: 1, z: 25 },
      rotation: Math.PI,
    },
    enemySpawns: [
      { position: { x: 15, y: 1, z: 0 } },
      { position: { x: -15, y: 1, z: 0 } },
      { position: { x: 0, y: 1, z: -20 } },
      { position: { x: 20, y: 1, z: 20 } },
      { position: { x: -20, y: 1, z: 20 } },
    ],
    pickupSpawns: [
      { x: 5, y: 0.5, z: 5 },
      { x: -5, y: 0.5, z: -5 },
      { x: 0, y: 0.5, z: 0 },
    ],
    obstacles: [
      // Scattered debris
      { position: { x: 8, y: 0.5, z: 8 }, size: { w: 2, h: 1, d: 2 } },
      { position: { x: -8, y: 1, z: -8 }, size: { w: 3, h: 2, d: 3 } },
      { position: { x: 12, y: 2, z: -10 }, size: { w: 2, h: 4, d: 2 } },
      { position: { x: -12, y: 1.5, z: 5 }, size: { w: 4, h: 3, d: 2 } },
      // Broken walls
      { position: { x: 0, y: 1, z: 0 }, size: { w: 8, h: 2, d: 1 } },
      { position: { x: 10, y: 1, z: 0 }, size: { w: 1, h: 2, d: 8 } },
    ],
    platforms: [
      { position: { x: 20, y: 3, z: -20 }, size: { w: 6, h: 0.5, d: 6 } },
      { position: { x: -20, y: 3, z: -20 }, size: { w: 6, h: 0.5, d: 6 } },
    ],
    bounds: {
      min: { x: -30, y: 0, z: -30 },
      max: { x: 30, y: 20, z: 30 },
    },
  },
};

// For backward compatibility
export const ARENA_MAP = MAPS.arena;

// Color palette (from PRD)
export const COLORS = {
  primary: 0x00d4ff,       // 電子藍
  secondary: 0xff6b35,     // 霓虹橘
  accent: 0x39ff14,        // 酸性綠
  background: 0x0a0e17,    // 深空黑
  surface: 0x1a1f2e,       // 金屬灰
  textPrimary: 0xe8e8e8,   // 淺灰白
  textSecondary: 0x8892a0, // 霧灰
  danger: 0xff3366,        // 警報紅
  health: 0x39ff14,        // 血量綠
  ammo: 0x00d4ff,          // 彈藥藍
};

// Helper to convert color to CSS
export function colorToCSS(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

// Get weapon by index (1, 2, 3 keys)
export function getWeaponByIndex(index: number): WeaponType | null {
  const weapons: WeaponType[] = ['pistol', 'shotgun', 'assault_rifle'];
  return weapons[index - 1] || null;
}

// Calculate distance between two vectors
export function distance(a: Vector3, b: Vector3): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Normalize a vector
export function normalize(v: Vector3): Vector3 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}
