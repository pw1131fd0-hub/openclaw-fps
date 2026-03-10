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

  // View bobbing and tilting
  private bobTimer: number = 0;
  private currentBobOffset: number = 0;
  private currentHBobOffset: number = 0;
  private currentTilt: number = 0;
  private targetTilt: number = 0;
  private _currentSpread: number = 0;
  
  // Recoil
  private recoilPitch: number = 0;
  private targetRecoilPitch: number = 0;

  // Footsteps
  private footstepTimer: number = 0;
  private readonly FOOTSTEP_INTERVAL: number = 0.4;
  private readonly SPRINT_FOOTSTEP_INTERVAL: number = 0.25;

  // External movement input (e.g. from touch)
  private externalMovement: { forward: number; right: number; sprint: boolean } | null = null;

  private onDeathCallback?: () => void;
  private onDamageCallback?: (amount: number, fromDirection?: Vector3) => void;
  private onHealCallback?: (amount: number) => void;
  private onWeaponFireCallback?: (results: HitResult[]) => void;
  private onWeaponSwitchCallback?: (from: WeaponType, to: WeaponType) => void;
  private onSpreadChangeCallback?: (spread: number) => void;

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
    this.updateBobbing(delta);
    this.updateTilting(delta);
    this.updateFootsteps(delta);
    this.updateRecoil(delta);
    this.updateCamera();
    this.updateCrosshair(delta);

    // Update current weapon
    const weapon = this.weapons.get(this._currentWeapon);
    if (weapon) {
      weapon.update(delta);
    }
  }

  private updateRecoil(delta: number): void {
    // Recover from recoil
    const recoverySpeed = 10.0;
    this.recoilPitch += (this.targetRecoilPitch - this.recoilPitch) * 20.0 * delta;
    this.targetRecoilPitch *= Math.pow(0.1, delta * recoverySpeed);
    
    // Smoothly return recoilPitch to 0
    if (Math.abs(this.targetRecoilPitch) < 0.001) {
        this.recoilPitch *= Math.pow(0.1, delta * recoverySpeed);
    }
  }

  private updateCamera(): void {
    // Position camera at player's eye level + bobbing offset
    // Also apply horizontal bobbing
    const rightDir = new THREE.Vector3(
      -Math.sin(this._rotation.yaw - Math.PI / 2),
      0,
      -Math.cos(this._rotation.yaw - Math.PI / 2)
    );

    this.camera.position.set(
      this._position.x + rightDir.x * this.currentHBobOffset,
      this._position.y + PLAYER_CONFIG.height * 0.4 + this.currentBobOffset,
      this._position.z + rightDir.z * this.currentHBobOffset
    );

    // Apply rotation (including recoil)
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this._rotation.yaw;
    this.camera.rotation.x = this._rotation.pitch + this.recoilPitch;
    this.camera.rotation.z = this.currentTilt; // Apply strafe tilt
  }

  private updateCrosshair(delta: number): void {
    const horizontalVelocity = new THREE.Vector2(this.body.velocity.x, this.body.velocity.z);
    const speed = horizontalVelocity.length();
    
    // Calculate target spread
    let targetSpread = 0;
    
    if (!this._isGrounded) {
      targetSpread = 15.0; // High spread in air
    } else if (speed > 0.1) {
      const isSprinting = speed > PLAYER_CONFIG.moveSpeed * 1.1;
      targetSpread = isSprinting ? 8.0 : 4.0; // Medium spread when moving
    }
    
    // Smoothly interpolate spread
    const lerpFactor = 10.0;
    this._currentSpread += (targetSpread - this._currentSpread) * lerpFactor * delta;
    
    if (this.onSpreadChangeCallback) {
        this.onSpreadChangeCallback(this._currentSpread);
    }
  }

  private updateBobbing(delta: number): void {
    const horizontalVelocity = new THREE.Vector2(this.body.velocity.x, this.body.velocity.z);
    const speed = horizontalVelocity.length();

    if (this._isGrounded) {
      if (speed > 0.1) {
        // Walking/Sprinting bob
        const bobFactor = speed / PLAYER_CONFIG.moveSpeed;
        const isSprinting = speed > PLAYER_CONFIG.moveSpeed * 1.1;
        const bobSpeed = isSprinting ? 14 : 10;
        this.bobTimer += delta * bobSpeed;
        
        // Vertical bob (up and down)
        const vBobAmount = 0.06 * bobFactor;
        const targetVBob = Math.sin(this.bobTimer * 2) * vBobAmount; // Double speed for vertical
        
        // Horizontal sway (side to side)
        const hBobAmount = 0.04 * bobFactor;
        const targetHBob = Math.cos(this.bobTimer) * hBobAmount;
        
        this.currentBobOffset += (targetVBob - this.currentBobOffset) * 12 * delta;
        this.currentHBobOffset += (targetHBob - this.currentHBobOffset) * 12 * delta;
      } else {
        // Idle breathing bob (subtle)
        this.bobTimer += delta * 1.5;
        const targetVBob = Math.sin(this.bobTimer) * 0.015;
        const targetHBob = Math.cos(this.bobTimer * 0.5) * 0.005;
        
        this.currentBobOffset += (targetVBob - this.currentBobOffset) * 2 * delta;
        this.currentHBobOffset += (targetHBob - this.currentHBobOffset) * 2 * delta;
      }
    } else {
      // Return to zero when in air
      this.currentBobOffset += (0 - this.currentBobOffset) * 4 * delta;
      this.currentHBobOffset += (0 - this.currentHBobOffset) * 4 * delta;
    }
  }

  private updateTilting(delta: number): void {
    // Strafe tilt
    const rightDir = new THREE.Vector3(
      -Math.sin(this._rotation.yaw - Math.PI / 2),
      0,
      -Math.cos(this._rotation.yaw - Math.PI / 2)
    );

    const horizontalVelocity = new THREE.Vector3(this.body.velocity.x, 0, this.body.velocity.z);
    const strafeSpeed = horizontalVelocity.dot(rightDir);
    
    // Tilt based on strafing (more pronounced)
    const strafeTilt = -(strafeSpeed / PLAYER_CONFIG.moveSpeed) * 0.1;
    
    // Mouse look tilt (subtle tilt when turning)
    const mouseDelta = this.input.getMouseDelta();
    const turnTilt = -mouseDelta.x * 2.0;

    this.targetTilt = strafeTilt + turnTilt;
    
    // Smoothly interpolate current tilt
    const tiltLerpFactor = 8;
    this.currentTilt += (this.targetTilt - this.currentTilt) * tiltLerpFactor * delta;
  }

  private updateFootsteps(delta: number): void {
    const horizontalVelocity = new THREE.Vector2(this.body.velocity.x, this.body.velocity.z);
    const speed = horizontalVelocity.length();

    if (this._isGrounded && speed > 1.5) {
      this.footstepTimer -= delta;
      if (this.footstepTimer <= 0) {
        this.audio.play('footstep');
        
        // Adjust interval based on speed
        const isSprinting = speed > PLAYER_CONFIG.moveSpeed * 1.1;
        this.footstepTimer = isSprinting ? this.SPRINT_FOOTSTEP_INTERVAL : this.FOOTSTEP_INTERVAL;
      }
    }
    else {
      this.footstepTimer = 0.1; // Reset timer so it plays soon after starting movement
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

    const wasGrounded = this._isGrounded;
    if (result.hit) {
      this._isGrounded = true;
      this.canJump = true;
      this.coyoteTime = this.MAX_COYOTE_TIME;

      if (!wasGrounded) {
        this.onLand();
      }
    } else {
      this._isGrounded = false;
      this.coyoteTime -= delta;
      if (this.coyoteTime <= 0) {
        this.canJump = false;
      }
    }
  }

  private onLand(): void {
    this.audio.play('footstep');
    // Camera impact dip
    this.currentBobOffset = -0.2;
    // Add a bit of tilt on land
    this.currentTilt += (Math.random() - 0.5) * 0.05;
  }

  public setExternalMovement(forward: number, right: number, sprint: boolean = false): void {
    this.externalMovement = { forward, right, sprint };
  }

  public addRotation(pitch: number, yaw: number): void {
    this._rotation.pitch -= pitch;  // 修復：反轉 pitch 方向（負值表示向上看）
    this._rotation.yaw -= yaw;
    this._rotation.pitch = clamp(this._rotation.pitch, -HALF_PI + 0.1, HALF_PI - 0.1);
  }

  private handleInput(delta: number): void {
    // Mouse look (only when pointer is locked)
    if (this.input.isPointerLocked) {
      const mouseDelta = this.input.getMouseDelta();
      this.addRotation(mouseDelta.y, mouseDelta.x);
    }

    // Keyboard movement
    const moveForward = this.input.isActionPressed('moveForward') ? 1 : 0;
    const moveBackward = this.input.isActionPressed('moveBackward') ? 1 : 0;
    const moveLeft = this.input.isActionPressed('moveLeft') ? 1 : 0;
    const moveRight = this.input.isActionPressed('moveRight') ? 1 : 0;
    let isSprinting = this.input.isActionPressed('sprint');

    let forward = moveForward - moveBackward;
    let right = moveRight - moveLeft;

    // Combine with external (touch) movement if present
    if (this.externalMovement) {
      if (Math.abs(this.externalMovement.forward) > Math.abs(forward)) {
        forward = this.externalMovement.forward;
        if (this.externalMovement.sprint) isSprinting = true;
      }
      if (Math.abs(this.externalMovement.right) > Math.abs(right)) {
        right = this.externalMovement.right;
      }
      
      this.externalMovement = null;
    }

    this.move(forward, right, isSprinting, delta);

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

  public move(forward: number, right: number, isSprinting: boolean, delta: number): void {
    let speed = PLAYER_CONFIG.moveSpeed;
    if (isSprinting && forward > 0) {
        speed *= PLAYER_CONFIG.sprintMultiplier;
    }

    // Calculate movement direction based on yaw
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
      // Wake up the body to ensure physics engine processes the velocity change
      if (this.body.sleepState === CANNON.Body.SLEEPING) {
        this.body.wakeUp();
      }
    }

    // Target velocity on XZ plane
    const targetVelocityX = moveDir.x * speed;
    const targetVelocityZ = moveDir.z * speed;

    // Current velocity
    const currentVelocityX = this.body.velocity.x;
    const currentVelocityZ = this.body.velocity.z;

    // Smoothly interpolate towards target velocity
    // Adjusted lerp factors for more "realistic" inertia
    let lerpFactor = this._isGrounded ? 12.0 : 3.0;
    
    // If no input, stop on ground
    if (moveDir.lengthSq() === 0 && this._isGrounded) {
        lerpFactor = 15.0;
    }

    const t = 1 - Math.exp(-lerpFactor * delta);
    
    this.body.velocity.x = currentVelocityX + (targetVelocityX - currentVelocityX) * t;
    this.body.velocity.z = currentVelocityZ + (targetVelocityZ - currentVelocityZ) * t;
  }

  public jump(): void {
    if (!this.canJump && this.coyoteTime <= 0) return;

    this.body.velocity.y = PLAYER_CONFIG.jumpForce;
    this.canJump = false;
    this.coyoteTime = 0;
    this._isGrounded = false;
    
    // Slight upward camera kick on jump
    this.currentBobOffset = 0.08;
  }

  public syncWithPhysics(): void {
    this._position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
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
      
      // Apply recoil kick
      let recoilKick = 0.05; // Base recoil for pistol
      if (this._currentWeapon === 'shotgun') recoilKick = 0.15;
      if (this._currentWeapon === 'assault_rifle') recoilKick = 0.08;
      
      this.targetRecoilPitch -= recoilKick;
      
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

  public applyWeaponUpgrade(upgradeType: 'damage' | 'fireRate' | 'magazineSize'): void {
    this.weapons.forEach((weapon) => {
      weapon.applyUpgrade(upgradeType);
    });
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

  public onSpreadChange(callback: (spread: number) => void): void {
    this.onSpreadChangeCallback = callback;
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
