// Game state types
export type GameState = 'loading' | 'menu' | 'playing' | 'paused' | 'gameOver';

// Weapon types
export type WeaponType = 'pistol' | 'shotgun' | 'assault_rifle';

// Enemy types
export type EnemyType = 'melee' | 'ranged';

// Enemy AI states
export type EnemyState = 'idle' | 'patrol' | 'chase' | 'attack' | 'dead';

// Pickup types
export type PickupType = 'health' | 'ammo_pistol' | 'ammo_shotgun' | 'ammo_rifle';

// Vector3 interface
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

// Game statistics
export interface GameStats {
  wave: number;
  score: number;
  enemiesKilled: number;
  damageDealt: number;
  damageTaken: number;
  shotsFired: number;
  shotsHit: number;
}

// Weapon configuration
export interface WeaponConfig {
  type: WeaponType;
  name: string;
  damage: number;
  headshotMultiplier: number;
  fireRate: number;
  magazineSize: number;
  maxReserveAmmo: number;
  reloadTime: number;
  spread: number;
  projectileCount: number;
  range: number;
}

// Enemy configuration
export interface EnemyConfig {
  type: EnemyType;
  name: string;
  health: number;
  speed: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
  detectionRange: number;
  scoreValue: number;
  modelScale: number;
}

// Pickup configuration
export interface PickupConfig {
  type: PickupType;
  value: number;
  respawnTime: number;
  collectRadius: number;
}

// Player configuration
export interface PlayerConfig {
  moveSpeed: number;
  sprintMultiplier: number;
  jumpForce: number;
  mouseSensitivity: number;
  maxHealth: number;
  height: number;
  radius: number;
}

// Wave configuration
export interface WaveConfig {
  wave: number;
  totalEnemies: number;
  meleeCount: number;
  rangedCount: number;
  spawnDelay: number;
  enemyHealthMultiplier: number;
  enemyDamageMultiplier: number;
}

// Game settings (user preferences)
export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  mouseSensitivity: number;
  invertY: boolean;
  showFPS: boolean;
  touchControlsEnabled: boolean;
  graphicsQuality: 'low' | 'medium' | 'high';
}

// High score entry
export interface HighScoreEntry {
  score: number;
  wave: number;
  date: string;
}

// Hit result from raycasting
export interface HitResult {
  hit: boolean;
  entityId?: string;
  entityType?: 'enemy' | 'pickup' | 'world';
  position?: Vector3;
  distance?: number;
  damage?: number;
  isHeadshot?: boolean;
}

// Spawn point
export interface SpawnPoint {
  position: Vector3;
  rotation?: number;
}

// Map configuration
export interface MapConfig {
  id: string;
  name: string;
  playerSpawn: SpawnPoint;
  enemySpawns: SpawnPoint[];
  pickupSpawns: Vector3[];
  obstacles?: { position: Vector3; size: { w: number; h: number; d: number } }[];
  platforms?: { position: Vector3; size: { w: number; h: number; d: number } }[];
  bounds: {
    min: Vector3;
    max: Vector3;
  };
}

// Sound names for audio manager
export type SoundName =
  | 'pistol_fire'
  | 'shotgun_fire'
  | 'rifle_fire'
  | 'reload'
  | 'empty_click'
  | 'weapon_switch'
  | 'enemy_hurt'
  | 'enemy_death'
  | 'player_hurt'
  | 'player_death'
  | 'pickup_health'
  | 'pickup_ammo'
  | 'wave_start'
  | 'wave_complete'
  | 'hit_marker'
  | 'footstep';

// Key action mappings
export type KeyAction =
  | 'moveForward'
  | 'moveBackward'
  | 'moveLeft'
  | 'moveRight'
  | 'sprint'
  | 'jump'
  | 'reload'
  | 'fire'
  | 'weapon1'
  | 'weapon2'
  | 'weapon3'
  | 'pause';

// Event types
export interface GameEvents {
  gameStateChange: GameState;
  playerDamage: { amount: number; fromDirection?: Vector3 };
  playerHeal: { amount: number };
  playerDeath: void;
  enemyDeath: { enemyId: string; position: Vector3; score: number };
  waveStart: { wave: number };
  waveComplete: { wave: number; score: number };
  weaponFire: { weapon: WeaponType };
  weaponReload: { weapon: WeaponType };
  weaponSwitch: { from: WeaponType; to: WeaponType };
  pickupCollected: { type: PickupType; value: number };
  scoreUpdate: { score: number };
}
