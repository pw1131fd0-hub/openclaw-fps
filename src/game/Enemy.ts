import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { EnemyType, EnemyState, EnemyConfig, Vector3 } from '@/types/GameTypes';
import { ENEMY_CONFIGS, COLORS } from '@/data/Config';
import { Physics } from '@/engine/Physics';
import { AudioManager } from '@/engine/AudioManager';
import { distance2D, directionTo, generateUUID } from '@/utils/MathUtils';

export class Enemy {
  public readonly id: string;
  public readonly type: EnemyType;
  public readonly config: EnemyConfig;

  private physics: Physics;
  private audio: AudioManager;
  private scene: THREE.Scene;

  private mesh: THREE.Group;
  private body: CANNON.Body;

  private _health: number;
  private _maxHealth: number;
  private _state: EnemyState = 'idle';
  private _isAlive: boolean = true;

  private patrolPoints: Vector3[] = [];
  private currentPatrolIndex: number = 0;
  private lastAttackTime: number = 0;

  private damageMultiplier: number = 1;
  // Used for wave difficulty scaling
  private _healthMultiplier: number = 1;

  private onDeathCallback?: (enemy: Enemy, points: number) => void;
  private onAttackCallback?: (damage: number, direction: Vector3) => void;

  constructor(
    type: EnemyType,
    physics: Physics,
    audio: AudioManager,
    scene: THREE.Scene
  ) {
    this.id = generateUUID();
    this.type = type;
    this.config = ENEMY_CONFIGS[type];
    this.physics = physics;
    this.audio = audio;
    this.scene = scene;

    this._maxHealth = this.config.health;
    this._health = this._maxHealth;

    // Create visual mesh
    this.mesh = this.createMesh();
    this.scene.add(this.mesh);

    // Create physics body (will be positioned on spawn)
    this.body = this.physics.createEnemyBody({ x: 0, y: 0, z: 0 });
    (this.body as unknown as { userData: { entityId: string; entityType: string } }).userData = {
      entityId: this.id,
      entityType: 'enemy',
    };
    this.physics.addBody(this.body);
  }

  private createMesh(): THREE.Group {
    const group = new THREE.Group();

    // Body (low-poly capsule shape)
    const bodyColor = this.type === 'melee' ? COLORS.danger : COLORS.secondary;
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.7,
      metalness: 0.3,
    });

    // Torso
    const torsoGeometry = new THREE.BoxGeometry(0.6, 1.0, 0.4);
    const torso = new THREE.Mesh(torsoGeometry, bodyMaterial);
    torso.position.y = 0.8;
    torso.castShadow = true;
    group.add(torso);

    // Head
    const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.5,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5;
    head.castShadow = true;
    group.add(head);

    // Eyes (glowing)
    const eyeGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.05);
    const eyeMaterial = new THREE.MeshBasicMaterial({
      color: this.type === 'melee' ? COLORS.danger : COLORS.primary,
    });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 1.55, 0.2);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 1.55, 0.2);
    group.add(rightEye);

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.15, 0.3, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.15, 0.3, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // For ranged enemies, add a "gun"
    if (this.type === 'ranged') {
      const gunGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.4);
      const gunMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.8,
        roughness: 0.2,
      });
      const gun = new THREE.Mesh(gunGeometry, gunMaterial);
      gun.position.set(0.4, 0.9, 0.3);
      group.add(gun);
    }

    return group;
  }

  public spawn(position: Vector3, healthMultiplier: number = 1, damageMultiplier: number = 1): void {
    this._healthMultiplier = healthMultiplier;
    this.damageMultiplier = damageMultiplier;

    this._maxHealth = this.config.health * healthMultiplier;
    this._health = this._maxHealth;
    this._isAlive = true;
    this._state = 'patrol';

    // Position body and mesh
    this.body.position.set(position.x, position.y + 0.9, position.z);
    this.body.velocity.set(0, 0, 0);
    this.mesh.position.set(position.x, position.y, position.z);
    this.mesh.visible = true;

    // Generate patrol points around spawn
    this.generatePatrolPoints(position);
  }

  private generatePatrolPoints(center: Vector3): void {
    this.patrolPoints = [];
    const radius = 5;
    const points = 4;

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      this.patrolPoints.push({
        x: center.x + Math.cos(angle) * radius,
        y: center.y,
        z: center.z + Math.sin(angle) * radius,
      });
    }
    this.currentPatrolIndex = 0;
  }

  public get position(): Vector3 {
    return {
      x: this.mesh.position.x,
      y: this.mesh.position.y,
      z: this.mesh.position.z,
    };
  }

  public get health(): number {
    return this._health;
  }

  public get maxHealth(): number {
    return this._maxHealth;
  }

  public get state(): EnemyState {
    return this._state;
  }

  public get isAlive(): boolean {
    return this._isAlive;
  }

  public get healthMultiplier(): number {
    return this._healthMultiplier;
  }

  public update(delta: number, playerPosition: Vector3): void {
    if (!this._isAlive) return;

    // Sync mesh with physics
    this.mesh.position.set(
      this.body.position.x,
      this.body.position.y - 0.9,
      this.body.position.z
    );

    const distanceToPlayer = distance2D(this.position, playerPosition);

    // State machine
    switch (this._state) {
      case 'patrol':
        this.patrol(delta);
        if (distanceToPlayer < this.config.detectionRange) {
          this._state = 'chase';
        }
        break;

      case 'chase':
        this.chase(delta, playerPosition);
        if (distanceToPlayer <= this.config.attackRange) {
          this._state = 'attack';
        } else if (distanceToPlayer > this.config.detectionRange * 1.5) {
          this._state = 'patrol';
        }
        break;

      case 'attack':
        this.attack(playerPosition);
        if (distanceToPlayer > this.config.attackRange * 1.2) {
          this._state = 'chase';
        }
        break;

      case 'idle':
        if (distanceToPlayer < this.config.detectionRange) {
          this._state = 'chase';
        }
        break;
    }

    // Face target or movement direction
    this.updateFacing(playerPosition);
  }

  private patrol(delta: number): void {
    if (this.patrolPoints.length === 0) return;

    const target = this.patrolPoints[this.currentPatrolIndex];
    const dist = distance2D(this.position, target);

    if (dist < 1) {
      this.currentPatrolIndex =
        (this.currentPatrolIndex + 1) % this.patrolPoints.length;
    } else {
      this.moveTowards(target, delta, 0.5);
    }
  }

  private chase(delta: number, playerPosition: Vector3): void {
    this.moveTowards(playerPosition, delta, 1);
  }

  private moveTowards(target: Vector3, _delta: number, speedMultiplier: number): void {
    const dir = directionTo(this.position, target);
    const speed = this.config.speed * speedMultiplier;

    this.body.velocity.x = dir.x * speed;
    this.body.velocity.z = dir.z * speed;
  }

  private attack(playerPosition: Vector3): void {
    const now = performance.now();
    if (now - this.lastAttackTime < this.config.attackCooldown) return;

    this.lastAttackTime = now;
    const damage = this.config.damage * this.damageMultiplier;

    // Calculate direction from player to enemy for damage indicator
    const dir = directionTo(playerPosition, this.position);

    if (this.onAttackCallback) {
      this.onAttackCallback(damage, dir);
    }

    // Stop moving while attacking
    this.body.velocity.x = 0;
    this.body.velocity.z = 0;
  }

  private updateFacing(playerPosition: Vector3): void {
    // Look towards player when chasing/attacking, or towards movement direction
    let targetX: number, targetZ: number;

    if (this._state === 'chase' || this._state === 'attack') {
      targetX = playerPosition.x;
      targetZ = playerPosition.z;
    } else if (this.body.velocity.x !== 0 || this.body.velocity.z !== 0) {
      targetX = this.position.x + this.body.velocity.x;
      targetZ = this.position.z + this.body.velocity.z;
    } else {
      return;
    }

    const angle = Math.atan2(
      targetX - this.position.x,
      targetZ - this.position.z
    );
    this.mesh.rotation.y = angle;
  }

  public takeDamage(amount: number, _isHeadshot: boolean): void {
    if (!this._isAlive) return;

    this._health -= amount;
    this.audio.play('enemy_hurt');

    // Flash effect
    this.flashDamage();

    if (this._health <= 0) {
      this.die();
    }
  }

  private flashDamage(): void {
    // Temporarily change material to white
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.emissive.setHex(0xffffff);
        child.material.emissiveIntensity = 0.5;

        setTimeout(() => {
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.emissive.setHex(0x000000);
            child.material.emissiveIntensity = 0;
          }
        }, 100);
      }
    });
  }

  public die(): void {
    if (!this._isAlive) return;

    this._isAlive = false;
    this._state = 'dead';
    this.audio.play('enemy_death');

    // Death animation - fall and fade
    this.body.velocity.set(0, 0, 0);
    this.body.collisionResponse = false;

    const startY = this.mesh.position.y;
    const startRotX = this.mesh.rotation.x;
    let progress = 0;

    const animate = () => {
      progress += 0.05;
      if (progress < 1) {
        this.mesh.rotation.x = startRotX + Math.PI / 2 * progress;
        this.mesh.position.y = startY - progress * 0.5;
        requestAnimationFrame(animate);
      } else {
        this.mesh.visible = false;
        if (this.onDeathCallback) {
          this.onDeathCallback(this, this.config.scoreValue);
        }
      }
    };
    animate();
  }

  public onDeath(callback: (enemy: Enemy, points: number) => void): void {
    this.onDeathCallback = callback;
  }

  public onAttack(callback: (damage: number, direction: Vector3) => void): void {
    this.onAttackCallback = callback;
  }

  public reset(): void {
    this._health = this._maxHealth;
    this._isAlive = false;
    this._state = 'idle';
    this.mesh.visible = false;
    this.mesh.rotation.set(0, 0, 0);
    this.body.velocity.set(0, 0, 0);
    this.body.collisionResponse = true;
  }

  public dispose(): void {
    this.scene.remove(this.mesh);
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
    this.physics.removeBody(this.body);
  }
}
