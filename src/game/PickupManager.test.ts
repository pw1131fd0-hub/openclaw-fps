import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { PickupManager } from './PickupManager';
import { PickupType } from '@/types/GameTypes';
import { createMockAudioManager, createMockScene } from '@/test/mocks';

describe('PickupManager', () => {
  let pickupManager: PickupManager;
  let scene: THREE.Scene;
  let mockAudio: ReturnType<typeof createMockAudioManager>;

  beforeEach(() => {
    scene = new THREE.Scene();
    mockAudio = createMockAudioManager();
    pickupManager = new PickupManager(scene, mockAudio as any);
  });

  afterEach(() => {
    pickupManager.dispose();
  });

  describe('initialization', () => {
    it('should create PickupManager instance', () => {
      expect(pickupManager).toBeDefined();
    });
  });

  describe('setSpawnPoints()', () => {
    it('should not throw when setting spawn points', () => {
      const points = [
        { x: 0, y: 0, z: 0 },
        { x: 5, y: 0, z: 5 },
      ];
      
      expect(() => pickupManager.setSpawnPoints(points)).not.toThrow();
    });
  });

  describe('spawnPickup()', () => {
    it('should spawn health pickup', () => {
      const pickup = pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
      
      expect(pickup).toBeDefined();
      expect(pickup.type).toBe('health');
    });

    it('should spawn pistol ammo pickup', () => {
      const pickup = pickupManager.spawnPickup('ammo_pistol', { x: 0, y: 0, z: 0 });
      
      expect(pickup).toBeDefined();
      expect(pickup.type).toBe('ammo_pistol');
    });

    it('should spawn shotgun ammo pickup', () => {
      const pickup = pickupManager.spawnPickup('ammo_shotgun', { x: 0, y: 0, z: 0 });
      
      expect(pickup).toBeDefined();
      expect(pickup.type).toBe('ammo_shotgun');
    });

    it('should spawn rifle ammo pickup', () => {
      const pickup = pickupManager.spawnPickup('ammo_rifle', { x: 0, y: 0, z: 0 });
      
      expect(pickup).toBeDefined();
      expect(pickup.type).toBe('ammo_rifle');
    });

    it('should add pickup mesh to scene', () => {
      const initialChildren = scene.children.length;
      
      pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
      
      expect(scene.children.length).toBe(initialChildren + 1);
    });

    it('should return pickup with unique id', () => {
      const pickup1 = pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
      const pickup2 = pickupManager.spawnPickup('health', { x: 5, y: 0, z: 5 });
      
      expect(pickup1.id).not.toBe(pickup2.id);
    });

    it('should set pickup position', () => {
      const pickup = pickupManager.spawnPickup('health', { x: 10, y: 2, z: -5 });
      
      expect(pickup.position.x).toBe(10);
      expect(pickup.position.y).toBe(2);
      expect(pickup.position.z).toBe(-5);
    });

    it('should set pickup as not collected', () => {
      const pickup = pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
      
      expect(pickup.isCollected).toBe(false);
    });

    it('should have pickup config', () => {
      const pickup = pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
      
      expect(pickup.config).toBeDefined();
      expect(pickup.config.value).toBeGreaterThan(0);
    });
  });

  describe('spawnRandomPickup()', () => {
    it('should spawn a random pickup', () => {
      const pickup = pickupManager.spawnRandomPickup({ x: 0, y: 0, z: 0 });
      
      expect(pickup).not.toBeNull();
    });

    it('should spawn pickup of valid type', () => {
      const pickup = pickupManager.spawnRandomPickup({ x: 0, y: 0, z: 0 });
      
      if (pickup) {
        const validTypes: PickupType[] = ['health', 'ammo_pistol', 'ammo_shotgun', 'ammo_rifle'];
        expect(validTypes).toContain(pickup.type);
      }
    });

    it('should add mesh to scene', () => {
      const initialChildren = scene.children.length;
      
      pickupManager.spawnRandomPickup({ x: 0, y: 0, z: 0 });
      
      expect(scene.children.length).toBe(initialChildren + 1);
    });
  });

  describe('trySpawnOnEnemyDeath()', () => {
    it('should not throw when called', () => {
      expect(() => 
        pickupManager.trySpawnOnEnemyDeath({ x: 0, y: 0, z: 0 })
      ).not.toThrow();
    });

    it('should sometimes spawn pickup based on chance', () => {
      // Run multiple times to get statistical coverage
      let spawned = 0;
      for (let i = 0; i < 100; i++) {
        const childrenBefore = scene.children.length;
        pickupManager.trySpawnOnEnemyDeath({ x: i, y: 0, z: 0 });
        if (scene.children.length > childrenBefore) {
          spawned++;
        }
      }
      
      // Should spawn some but not all (probability based)
      expect(spawned).toBeGreaterThan(0);
      expect(spawned).toBeLessThan(100);
    });
  });

  describe('checkCollisions()', () => {
    it('should not throw when called', () => {
      pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
      
      expect(() => 
        pickupManager.checkCollisions({ x: 0, y: 0, z: 0 })
      ).not.toThrow();
    });

    it('should collect pickup when player is close', () => {
      vi.useFakeTimers();
      
      const callback = vi.fn();
      pickupManager.onCollect(callback);
      pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
      
      pickupManager.checkCollisions({ x: 0, y: 1, z: 0 });
      
      expect(callback).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should pass pickup type to callback', () => {
      vi.useFakeTimers();
      
      const callback = vi.fn();
      pickupManager.onCollect(callback);
      pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
      
      pickupManager.checkCollisions({ x: 0, y: 1, z: 0 });
      
      expect(callback).toHaveBeenCalledWith('health', expect.any(Number));
      
      vi.useRealTimers();
    });

    it('should pass pickup value to callback', () => {
      vi.useFakeTimers();
      
      const callback = vi.fn();
      pickupManager.onCollect(callback);
      pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
      
      pickupManager.checkCollisions({ x: 0, y: 1, z: 0 });
      
      expect(callback).toHaveBeenCalledWith(expect.any(String), expect.any(Number));
      
      vi.useRealTimers();
    });

    it('should not collect pickup when player is far', () => {
      const callback = vi.fn();
      pickupManager.onCollect(callback);
      pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
      
      pickupManager.checkCollisions({ x: 100, y: 0, z: 100 });
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should play health sound when collecting health', () => {
      vi.useFakeTimers();
      
      pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
      pickupManager.checkCollisions({ x: 0, y: 1, z: 0 });
      
      expect(mockAudio.play).toHaveBeenCalledWith('pickup_health');
      
      vi.useRealTimers();
    });

    it('should play ammo sound when collecting ammo', () => {
      vi.useFakeTimers();
      
      pickupManager.spawnPickup('ammo_pistol', { x: 0, y: 0, z: 0 });
      pickupManager.checkCollisions({ x: 0, y: 1, z: 0 });
      
      expect(mockAudio.play).toHaveBeenCalledWith('pickup_ammo');
      
      vi.useRealTimers();
    });

    it('should not collect already collected pickup', () => {
      vi.useFakeTimers();
      
      const callback = vi.fn();
      pickupManager.onCollect(callback);
      pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
      
      pickupManager.checkCollisions({ x: 0, y: 1, z: 0 });
      pickupManager.checkCollisions({ x: 0, y: 1, z: 0 });
      
      expect(callback).toHaveBeenCalledTimes(1);
      
      vi.useRealTimers();
    });
  });

  describe('update()', () => {
    it('should not throw when called', () => {
      pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
      
      expect(() => pickupManager.update(0.016)).not.toThrow();
    });

    it('should rotate pickup meshes', () => {
      const pickup = pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
      const initialRotation = pickup.mesh.rotation.y;
      
      pickupManager.update(0.016);
      
      expect(pickup.mesh.rotation.y).not.toBe(initialRotation);
    });

    it('should handle multiple pickups', () => {
      pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
      pickupManager.spawnPickup('ammo_pistol', { x: 5, y: 0, z: 0 });
      pickupManager.spawnPickup('ammo_shotgun', { x: 0, y: 0, z: 5 });
      
      expect(() => pickupManager.update(0.016)).not.toThrow();
    });
  });

  describe('onCollect()', () => {
    it('should register callback', () => {
      const callback = vi.fn();
      
      expect(() => pickupManager.onCollect(callback)).not.toThrow();
    });
  });

  describe('clear()', () => {
    it('should remove all pickups from scene', () => {
      pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
      pickupManager.spawnPickup('ammo_pistol', { x: 5, y: 0, z: 0 });
      
      pickupManager.clear();
      
      expect(scene.children.length).toBe(0);
    });

    it('should not throw when called with no pickups', () => {
      expect(() => pickupManager.clear()).not.toThrow();
    });

    it('should allow spawning new pickups after clear', () => {
      pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
      pickupManager.clear();
      
      const pickup = pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
      
      expect(pickup).toBeDefined();
      expect(scene.children.length).toBe(1);
    });
  });

  describe('dispose()', () => {
    it('should not throw when called', () => {
      pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
      
      expect(() => pickupManager.dispose()).not.toThrow();
    });

    it('should remove all pickups', () => {
      pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
      pickupManager.spawnPickup('ammo_pistol', { x: 5, y: 0, z: 0 });
      
      pickupManager.dispose();
      
      expect(scene.children.length).toBe(0);
    });
  });
});

describe('PickupManager mesh creation', () => {
  let pickupManager: PickupManager;
  let scene: THREE.Scene;
  let mockAudio: ReturnType<typeof createMockAudioManager>;

  beforeEach(() => {
    scene = new THREE.Scene();
    mockAudio = createMockAudioManager();
    pickupManager = new PickupManager(scene, mockAudio as any);
  });

  afterEach(() => {
    pickupManager.dispose();
  });

  it('should create mesh as THREE.Group', () => {
    const pickup = pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
    
    expect(pickup.mesh).toBeInstanceOf(THREE.Group);
  });

  it('should position mesh above ground', () => {
    const pickup = pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
    
    expect(pickup.mesh.position.y).toBeGreaterThan(0);
  });

  it('should create health pickup with cross shape', () => {
    const pickup = pickupManager.spawnPickup('health', { x: 0, y: 0, z: 0 });
    
    // Health pickup should have multiple meshes (cross shape + glow)
    const meshCount = pickup.mesh.children.filter(
      child => child instanceof THREE.Mesh
    ).length;
    expect(meshCount).toBeGreaterThan(1);
  });

  it('should create ammo pickup with box shape', () => {
    const pickup = pickupManager.spawnPickup('ammo_pistol', { x: 0, y: 0, z: 0 });
    
    // Should have box mesh + stripe + glow
    const meshCount = pickup.mesh.children.filter(
      child => child instanceof THREE.Mesh
    ).length;
    expect(meshCount).toBeGreaterThan(0);
  });
});
