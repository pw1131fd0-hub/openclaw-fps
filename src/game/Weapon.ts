import { WeaponType, WeaponConfig, HitResult, Vector3 } from '@/types/GameTypes';
import { WEAPON_CONFIGS } from '@/data/Config';
import { Physics } from '@/engine/Physics';
import { AudioManager } from '@/engine/AudioManager';
import * as THREE from 'three';
import { DEG_TO_RAD, randomRange } from '@/utils/MathUtils';

export class Weapon {
  public readonly type: WeaponType;
  public readonly config: WeaponConfig;

  private _currentAmmo: number;
  private _reserveAmmo: number;
  private _isReloading: boolean = false;
  private lastFireTime: number = 0;
  private reloadTimer: number | null = null;

  private physics: Physics;
  private audio: AudioManager;
  private getPlayerPosition: () => THREE.Vector3;
  private getPlayerDirection: () => THREE.Vector3;
  private onHitEnemy?: (entityId: string, damage: number, isHeadshot: boolean, position: Vector3) => void;

  constructor(
    type: WeaponType,
    physics: Physics,
    audio: AudioManager,
    getPlayerPosition: () => THREE.Vector3,
    getPlayerDirection: () => THREE.Vector3
  ) {
    this.type = type;
    this.config = WEAPON_CONFIGS[type];
    this.physics = physics;
    this.audio = audio;
    this.getPlayerPosition = getPlayerPosition;
    this.getPlayerDirection = getPlayerDirection;

    this._currentAmmo = this.config.magazineSize;
    this._reserveAmmo = this.config.maxReserveAmmo;
  }

  public get currentAmmo(): number {
    return this._currentAmmo;
  }

  public get reserveAmmo(): number {
    return this._reserveAmmo;
  }

  public get isReloading(): boolean {
    return this._isReloading;
  }

  public get canFire(): boolean {
    if (this._isReloading) return false;
    if (this._currentAmmo <= 0) return false;

    const now = performance.now();
    const fireInterval = 1000 / this.config.fireRate;
    return now - this.lastFireTime >= fireInterval;
  }

  public setOnHitEnemy(
    callback: (entityId: string, damage: number, isHeadshot: boolean, position: Vector3) => void
  ): void {
    this.onHitEnemy = callback;
  }

  public fire(): HitResult[] {
    if (!this.canFire) {
      if (this._currentAmmo <= 0 && !this._isReloading) {
        this.audio.play('empty_click');
      }
      return [];
    }

    this._currentAmmo--;
    this.lastFireTime = performance.now();

    // Play fire sound
    const soundName =
      this.type === 'pistol'
        ? 'pistol_fire'
        : this.type === 'shotgun'
          ? 'shotgun_fire'
          : 'rifle_fire';
    this.audio.play(soundName);

    const results: HitResult[] = [];
    const playerPos = this.getPlayerPosition();
    const playerDir = this.getPlayerDirection();

    // Fire projectiles
    for (let i = 0; i < this.config.projectileCount; i++) {
      const result = this.fireProjectile(playerPos, playerDir);
      if (result.hit) {
        results.push(result);
      }
    }

    // Auto-reload when empty
    if (this._currentAmmo <= 0 && this._reserveAmmo > 0) {
      this.reload();
    }

    return results;
  }

  private fireProjectile(
    origin: THREE.Vector3,
    direction: THREE.Vector3
  ): HitResult {
    // Apply spread
    const spreadRad = this.config.spread * DEG_TO_RAD;
    const spreadX = randomRange(-spreadRad, spreadRad);
    const spreadY = randomRange(-spreadRad, spreadRad);

    const spreadDir = direction.clone();
    spreadDir.applyAxisAngle(new THREE.Vector3(1, 0, 0), spreadX);
    spreadDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadY);

    // Calculate end point
    const end = origin
      .clone()
      .add(spreadDir.multiplyScalar(this.config.range));

    // Raycast
    const rayResult = this.physics.raycast(
      { x: origin.x, y: origin.y, z: origin.z },
      { x: end.x, y: end.y, z: end.z }
    );

    if (rayResult.hit && rayResult.body) {
      const bodyWithUserData = rayResult.body as unknown as { userData?: { entityId?: string; entityType?: string } };
      const entityId = bodyWithUserData.userData?.entityId;
      const entityType = bodyWithUserData.userData?.entityType;

      if (entityType === 'enemy' && entityId) {
        // Calculate if headshot (hit in upper portion)
        const hitY = rayResult.point?.y || 0;
        const bodyY = rayResult.body.position.y;
        const bodyHeight = 1.8; // Approximate enemy height
        const isHeadshot = hitY > bodyY + bodyHeight * 0.3;

        const damage = isHeadshot
          ? this.config.damage * this.config.headshotMultiplier
          : this.config.damage;

        if (this.onHitEnemy) {
          this.onHitEnemy(entityId, damage, isHeadshot, rayResult.point!);
        }

        return {
          hit: true,
          entityId,
          entityType: 'enemy',
          position: rayResult.point,
          distance: rayResult.distance,
          damage,
          isHeadshot,
        };
      }

      return {
        hit: true,
        entityType: 'world',
        position: rayResult.point,
        distance: rayResult.distance,
      };
    }

    return { hit: false };
  }

  public reload(): void {
    if (this._isReloading) return;
    if (this._currentAmmo >= this.config.magazineSize) return;
    if (this._reserveAmmo <= 0) return;

    this._isReloading = true;
    this.audio.play('reload');

    this.reloadTimer = window.setTimeout(() => {
      const needed = this.config.magazineSize - this._currentAmmo;
      const toLoad = Math.min(needed, this._reserveAmmo);

      this._currentAmmo += toLoad;
      this._reserveAmmo -= toLoad;
      this._isReloading = false;
      this.reloadTimer = null;
    }, this.config.reloadTime);
  }

  public cancelReload(): void {
    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
      this.reloadTimer = null;
      this._isReloading = false;
    }
  }

  public addAmmo(amount: number): void {
    this._reserveAmmo = Math.min(
      this._reserveAmmo + amount,
      this.config.maxReserveAmmo
    );
  }

  public reset(): void {
    this._currentAmmo = this.config.magazineSize;
    this._reserveAmmo = this.config.maxReserveAmmo;
    this._isReloading = false;
    this.lastFireTime = 0;
    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
      this.reloadTimer = null;
    }
  }

  public update(_delta: number): void {
    // Could add weapon sway or other per-frame updates here
  }

  public dispose(): void {
    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
    }
  }
}
