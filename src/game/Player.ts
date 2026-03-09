import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Vector3, WeaponType, HitResult } from '@/types/GameTypes';
import { PLAYER_CONFIG } from '@/data/Config';
import { Physics, COLLISION_GROUPS } from '@/engine/Physics';
import { InputManager } from '@/engine/InputManager';
import { AudioManager } from '@/engine/AudioManager';
import { Weapon } from './Weapon';
import { clamp, HALF_PI } from '@/utils/MathUtils';

export class Player {
  private physics: Physics;
  private input: InputManager;
  private audio: AudioManager;
  private camera: THREE.PerspectiveCamera;

  private body: CANNON.Body;
  private _position: THREE.Vector3 = new THREE.Vector3();
  private _rotation: { pitch: number; yaw: number } = { pitch: 0, yaw: 0 };

  private _health: number;
  private _maxHealth: number;
  private _isAlive: boolean = true;

  private weapons: Map<WeaponType, Weapon> = new Map();
  private _currentWeapon: WeaponType = 'pistol';
  
  private canJump: boolean = true;
  // Used for ground detection
  private _isGrounded: boolean = false;
  private coyoteTime: number = 0;
  private readonly MAX_COYOTE_TIME: number = 0.15;

  private onDeathCallback?: () => void;
  private onDamageCallback?: (amount: number, fromDirection?: Vector3) => void;
  private onHealCallback?: (amount: number) => void;
  private onWeaponFireCallback?: (results: HitResult[]) => void;
  private onWeaponSwitchCallback?: (from: WeaponType, to: WeaponType) => void;

  constructor(
    physics: Physics,
    input: InputManager,
    audio: AudioManager,
    camera: THREE.PerspectiveCamera,
    spawnPosition: Vector3
  ) {
    this.physics = physics;
    this.input = input;
    this.audio = audio;
    this.camera = camera;

    this._maxHealth = PLAYER_CONFIG.maxHealth;
    this._health = this._maxHealth;

    // Create physics body
    this.body = this.physics.createPlayerBody(spawnPosition);
    (this.body as unknown as { userData: { entityType: string } }).userData = { entityType: 'player' };
    this.physics.addBody(this.body);

    // Initialize position
    this._position.set(
      spawnPosition.x,
      spawnPosition.y + PLAYER_CONFIG.height / 2,
      spawnPosition.z
    );

    // Create weapons
    this.initWeapons();
  }

  private initWeapons(): void {
    const weaponTypes: WeaponType[] = ['pistol', 'shotgun', 'assault_rifle'];

    weaponTypes.forEach((type) => {
      const weapon = new Weapon(
        type,
        this.physics,
        this.audio,
        () => this.camera.position.clone(),
        () => {
          const dir = new THREE.Vector3(0, 0, -1);
          dir.applyQuaternion(this.camera.quaternion);
          return dir;
        }
      );
      this.weapons.set(type, weapon);
    });
  }

  public get position(): Vector3 {
    return {
      x: this._position.x,
      y: this._position.y,
      z: this._position.z,
    };
  }

  public get rotation(): { pitch: number; yaw: number } {
    return { ...this._rotation };
  }

  public get health(): number {
    return this._health;
  }

  public get maxHealth(): number {
    return this._maxHealth;
  }

  public get isAlive(): boolean {
    return this._isAlive;
  }

  public get isGrounded(): boolean {
    return this._isGrounded;
  }

  public get currentWeapon(): WeaponType {
    return this._currentWeapon;
  }

  public getWeapon(): Weapon | undefined {
    return this.weapons.get(this._currentWeapon);
  }

  public update(delta: number): void {
    if (!this._isAlive) return;

    this.checkGrounded(delta);
    this.handleInput(delta);
    this.syncWithPhysics();
    this.updateCamera();

    // Update current weapon
    const weapon = this.weapons.get(this._currentWeapon);
    if (weapon) {
      weapon.update(delta);
    }
  }

  private checkGrounded(delta: number): void {
    const rayStart = {
      x: this.body.position.x,
      y: this.body.position.y - PLAYER_CONFIG.height / 2 + 0.1,
      z: this.body.position.z,
    };
    const rayEnd = {
      x: this.body.position.x,
      y: this.body.position.y - PLAYER_CONFIG.height / 2 - 0.2,
      z: this.body.position.z,
    };

    const result = this.physics.raycast(rayStart, rayEnd, {
      collisionFilterMask: COLLISION_GROUPS.WORLD,
    });

    if (result.hit) {
      this._isGrounded = true;
      this.canJump = true;
      this.coyoteTime = this.MAX_COYOTE_TIME;
    } else {
      this._isGrounded = false;
      this.coyoteTime -= delta;
      if (this.coyoteTime <= 0) {
        this.canJump = false;
      }
    }
  }

  private handleInput(delta: number): void {
    // Mouse look (only when pointer is locked)
    if (this.input.isPointerLocked) {
      const mouseDelta = this.input.getMouseDelta();
      this._rotation.yaw -= mouseDelta.x;
      this._rotation.pitch -= mouseDelta.y;
      this._rotation.pitch = clamp(this._rotation.pitch, -HALF_PI + 0.1, HALF_PI - 0.1);
    }

    // Movement (always active)
    const moveForward = this.input.isActionPressed('moveForward') ? 1 : 0;
    const moveBackward = this.input.isActionPressed('moveBackward') ? 1 : 0;
    const moveLeft = this.input.isActionPressed('moveLeft') ? 1 : 0;
    const moveRight = this.input.isActionPressed('moveRight') ? 1 : 0;

    const forward = moveForward - moveBackward;
    const right = moveRight - moveLeft;

    this.move(forward, right, delta);

    // Jump
    if (this.input.isActionJustPressed('jump')) {
      this.jump();
    }

    // Fire
    if (this.input.isActionPressed('fire')) {
      this.fire();
    }

    // Reload
    if (this.input.isActionJustPressed('reload')) {
      this.reload();
    }

    // Weapon switch
    if (this.input.isActionJustPressed('weapon1')) {
      this.switchWeapon('pistol');
    } else if (this.input.isActionJustPressed('weapon2')) {
      this.switchWeapon('shotgun');
    } else if (this.input.isActionJustPressed('weapon3')) {
      this.switchWeapon('assault_rifle');
    }
  }

  public move(forward: number, right: number, _delta: number): void {
    const speed = PLAYER_CONFIG.moveSpeed;

    // Calculate movement direction based on yaw
    // Three.js forward is -Z, so negate sin/cos
    const moveDir = new THREE.Vector3();
    const forwardDir = new THREE.Vector3(
      -Math.sin(this._rotation.yaw),
      0,
      -Math.cos(this._rotation.yaw)
    );
    const rightDir = new THREE.Vector3(
      -Math.sin(this._rotation.yaw - Math.PI / 2),
      0,
      -Math.cos(this._rotation.yaw - Math.PI / 2)
    );

    moveDir.addScaledVector(forwardDir, forward);
    moveDir.addScaledVector(rightDir, right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
    }

    // Apply velocity to physics body
    this.body.velocity.x = moveDir.x * speed;
    this.body.velocity.z = moveDir.z * speed;
  }

  public jump(): void {
    if (!this.canJump && this.coyoteTime <= 0) return;

    this.body.velocity.y = PLAYER_CONFIG.jumpForce;
    this.canJump = false;
    this.coyoteTime = 0;
    this._isGrounded = false;
  }

  public syncWithPhysics(): void {
    this._position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
  }

  private updateCamera(): void {
    // Position camera at player's eye level
    this.camera.position.set(
      this._position.x,
      this._position.y + PLAYER_CONFIG.height * 0.4,
      this._position.z
    );

    // Apply rotation
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this._rotation.yaw;
    this.camera.rotation.x = this._rotation.pitch;
  }

  public takeDamage(amount: number, fromDirection?: Vector3): void {
    if (!this._isAlive) return;

    this._health = Math.max(0, this._health - amount);
    this.audio.play('player_hurt');

    if (this.onDamageCallback) {
      this.onDamageCallback(amount, fromDirection);
    }

    if (this._health <= 0) {
      this.die();
    }
  }

  public heal(amount: number): void {
    if (!this._isAlive) return;

    const oldHealth = this._health;
    this._health = Math.min(this._maxHealth, this._health + amount);

    if (this._health > oldHealth && this.onHealCallback) {
      this.onHealCallback(this._health - oldHealth);
    }
  }

  private die(): void {
    this._isAlive = false;
    this.audio.play('player_death');

    if (this.onDeathCallback) {
      this.onDeathCallback();
    }
  }

  public fire(): boolean {
    const weapon = this.weapons.get(this._currentWeapon);
    if (!weapon) return false;

    const oldAmmo = weapon.currentAmmo;
    const results = weapon.fire();

    // If ammo decreased, a shot was actually fired
    if (weapon.currentAmmo < oldAmmo) {
      if (this.onWeaponFireCallback) {
        this.onWeaponFireCallback(results);
      }
      return true;
    }

    return false;
  }

  public reload(): void {
    const weapon = this.weapons.get(this._currentWeapon);
    if (weapon) {
      weapon.reload();
    }
  }

  public switchWeapon(type: WeaponType): void {
    if (type === this._currentWeapon) return;
    if (!this.weapons.has(type)) return;

    // Cancel any ongoing reload
    const currentWeapon = this.weapons.get(this._currentWeapon);
    if (currentWeapon) {
      currentWeapon.cancelReload();
    }

    const oldWeapon = this._currentWeapon;
    this._currentWeapon = type;
    this.audio.play('weapon_switch');

    if (this.onWeaponSwitchCallback) {
      this.onWeaponSwitchCallback(oldWeapon, type);
    }
  }

  public addAmmo(type: WeaponType, amount: number): void {
    const weapon = this.weapons.get(type);
    if (weapon) {
      weapon.addAmmo(amount);
    }
  }

  public setOnHitEnemy(
    callback: (entityId: string, damage: number, isHeadshot: boolean, position: Vector3) => void
  ): void {
    this.weapons.forEach((weapon) => {
      weapon.setOnHitEnemy(callback);
    });
  }

  public onDeath(callback: () => void): void {
    this.onDeathCallback = callback;
  }

  public onDamage(callback: (amount: number, fromDirection?: Vector3) => void): void {
    this.onDamageCallback = callback;
  }

  public onHeal(callback: (amount: number) => void): void {
    this.onHealCallback = callback;
  }

  public onWeaponFire(callback: (results: HitResult[]) => void): void {
    this.onWeaponFireCallback = callback;
  }

  public onWeaponSwitch(callback: (from: WeaponType, to: WeaponType) => void): void {
    this.onWeaponSwitchCallback = callback;
  }

  public reset(spawnPosition: Vector3): void {
    this._health = this._maxHealth;
    this._isAlive = true;
    this._currentWeapon = 'pistol';
    this._rotation = { pitch: 0, yaw: 0 };

    this.body.position.set(
      spawnPosition.x,
      spawnPosition.y + PLAYER_CONFIG.height / 2,
      spawnPosition.z
    );
    this.body.velocity.set(0, 0, 0);

    this.weapons.forEach((weapon) => weapon.reset());
  }

  public dispose(): void {
    this.physics.removeBody(this.body);
    this.weapons.forEach((weapon) => weapon.dispose());
    this.weapons.clear();
  }
}
