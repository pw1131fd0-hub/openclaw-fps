import * as THREE from 'three';
import { PickupType, PickupConfig, Vector3 } from '@/types/GameTypes';
import { PICKUP_CONFIGS, COLORS, GAME_CONFIG } from '@/data/Config';
import { AudioManager } from '@/engine/AudioManager';
import { distance2D, generateUUID } from '@/utils/MathUtils';

interface Pickup {
  id: string;
  type: PickupType;
  config: PickupConfig;
  mesh: THREE.Group;
  position: Vector3;
  isCollected: boolean;
  rotationSpeed: number;
  bobOffset: number;
}

export class PickupManager {
  private scene: THREE.Scene;
  private audio: AudioManager;

  private pickups: Pickup[] = [];

  private onCollectCallback?: (type: PickupType, value: number) => void;

  constructor(scene: THREE.Scene, audio: AudioManager) {
    this.scene = scene;
    this.audio = audio;
  }

  public setSpawnPoints(_points: Vector3[]): void {
    // Points stored for future use
  }

  public spawnPickup(type: PickupType, position: Vector3): Pickup {
    const config = PICKUP_CONFIGS[type];
    const mesh = this.createPickupMesh(type);

    mesh.position.set(position.x, position.y + 0.5, position.z);
    this.scene.add(mesh);

    const pickup: Pickup = {
      id: generateUUID(),
      type,
      config,
      mesh,
      position: { ...position },
      isCollected: false,
      rotationSpeed: 1 + Math.random() * 0.5,
      bobOffset: Math.random() * Math.PI * 2,
    };

    this.pickups.push(pickup);
    return pickup;
  }

  public spawnRandomPickup(position: Vector3): Pickup | null {
    // Determine pickup type based on probability
    const rand = Math.random();
    let type: PickupType;

    if (rand < 0.3) {
      type = 'health';
    } else if (rand < 0.5) {
      type = 'ammo_pistol';
    } else if (rand < 0.7) {
      type = 'ammo_shotgun';
    } else {
      type = 'ammo_rifle';
    }

    return this.spawnPickup(type, position);
  }

  public trySpawnOnEnemyDeath(position: Vector3): void {
    if (Math.random() < GAME_CONFIG.pickupSpawnChance) {
      this.spawnRandomPickup(position);
    }
  }

  private createPickupMesh(type: PickupType): THREE.Group {
    const group = new THREE.Group();

    let color: number;
    let geometry: THREE.BufferGeometry;

    if (type === 'health') {
      color = COLORS.health;
      // Cross shape for health
      const boxH = new THREE.BoxGeometry(0.4, 0.15, 0.15);
      const boxV = new THREE.BoxGeometry(0.15, 0.4, 0.15);
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
        roughness: 0.3,
        metalness: 0.5,
      });

      const meshH = new THREE.Mesh(boxH, material);
      const meshV = new THREE.Mesh(boxV, material);
      group.add(meshH);
      group.add(meshV);
    } else {
      // Ammo box
      color = COLORS.ammo;
      geometry = new THREE.BoxGeometry(0.3, 0.25, 0.15);
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
        roughness: 0.3,
        metalness: 0.5,
      });
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);

      // Add stripe for ammo type
      const stripeGeometry = new THREE.BoxGeometry(0.32, 0.05, 0.16);
      const stripeColor =
        type === 'ammo_pistol'
          ? 0xffffff
          : type === 'ammo_shotgun'
            ? COLORS.danger
            : COLORS.secondary;
      const stripeMaterial = new THREE.MeshStandardMaterial({
        color: stripeColor,
        emissive: stripeColor,
        emissiveIntensity: 0.5,
      });
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.y = 0.05;
      group.add(stripe);
    }

    // Add glow
    const glowGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.15,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    return group;
  }

  public checkCollisions(playerPosition: Vector3): void {
    const collectRadius = 1.5;

    this.pickups.forEach((pickup) => {
      if (pickup.isCollected) return;

      const dist = distance2D(playerPosition, pickup.position);
      if (dist < collectRadius) {
        this.collectPickup(pickup);
      }
    });
  }

  private collectPickup(pickup: Pickup): void {
    pickup.isCollected = true;

    // Play sound
    if (pickup.type === 'health') {
      this.audio.play('pickup_health');
    } else {
      this.audio.play('pickup_ammo');
    }

    // Collection animation
    const startScale = pickup.mesh.scale.x;
    let progress = 0;

    const animate = () => {
      progress += 0.1;
      if (progress < 1) {
        const scale = startScale * (1 - progress);
        pickup.mesh.scale.set(scale, scale, scale);
        pickup.mesh.position.y += 0.05;
        requestAnimationFrame(animate);
      } else {
        this.removePickup(pickup);
      }
    };
    animate();

    // Notify callback
    if (this.onCollectCallback) {
      this.onCollectCallback(pickup.type, pickup.config.value);
    }
  }

  private removePickup(pickup: Pickup): void {
    this.scene.remove(pickup.mesh);
    pickup.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });

    const index = this.pickups.indexOf(pickup);
    if (index !== -1) {
      this.pickups.splice(index, 1);
    }
  }

  public update(delta: number): void {
    const time = performance.now() / 1000;

    this.pickups.forEach((pickup) => {
      if (pickup.isCollected) return;

      // Rotate
      pickup.mesh.rotation.y += pickup.rotationSpeed * delta;

      // Bob up and down
      const bobHeight = 0.1;
      const bobSpeed = 2;
      pickup.mesh.position.y =
        pickup.position.y + 0.5 + Math.sin(time * bobSpeed + pickup.bobOffset) * bobHeight;
    });
  }

  public onCollect(callback: (type: PickupType, value: number) => void): void {
    this.onCollectCallback = callback;
  }

  public clear(): void {
    this.pickups.forEach((pickup) => {
      this.scene.remove(pickup.mesh);
      pickup.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
    });
    this.pickups = [];
  }

  public dispose(): void {
    this.clear();
  }
}
