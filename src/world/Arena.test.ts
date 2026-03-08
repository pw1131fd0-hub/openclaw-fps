import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { Arena } from './Arena';
import { Physics, COLLISION_GROUPS } from '@/engine/Physics';

// Mock THREE.js mesh and geometry creation
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three');
  
  return {
    ...actual,
  };
});

describe('Arena', () => {
  let arena: Arena;
  let scene: THREE.Scene;
  let physics: Physics;

  beforeEach(() => {
    scene = new THREE.Scene();
    physics = new Physics();
    arena = new Arena(scene, physics);
  });

  afterEach(() => {
    arena.dispose();
    physics.dispose();
  });

  describe('initialization', () => {
    it('should create Arena instance', () => {
      expect(arena).toBeDefined();
    });
  });

  describe('build()', () => {
    it('should not throw when building', () => {
      expect(() => arena.build()).not.toThrow();
    });

    it('should add objects to scene', () => {
      const initialChildren = scene.children.length;
      arena.build();
      
      expect(scene.children.length).toBeGreaterThan(initialChildren);
    });

    it('should add physics bodies to world', () => {
      const initialBodies = physics.world.bodies.length;
      arena.build();
      
      expect(physics.world.bodies.length).toBeGreaterThan(initialBodies);
    });

    it('should create ground plane', () => {
      arena.build();
      
      // Should have at least one horizontal plane (ground)
      const groundMesh = scene.children.find(
        child => child instanceof THREE.Mesh && 
        child.geometry instanceof THREE.PlaneGeometry
      );
      expect(groundMesh).toBeDefined();
    });

    it('should create grid helper', () => {
      arena.build();
      
      const gridHelper = scene.children.find(
        child => child instanceof THREE.GridHelper
      );
      expect(gridHelper).toBeDefined();
    });

    it('should create walls', () => {
      arena.build();
      
      // Walls are box meshes
      const boxMeshes = scene.children.filter(
        child => child instanceof THREE.Mesh &&
        child.geometry instanceof THREE.BoxGeometry
      );
      expect(boxMeshes.length).toBeGreaterThan(0);
    });

    it('should create obstacles/covers', () => {
      arena.build();
      
      // Multiple box meshes for obstacles
      const boxMeshes = scene.children.filter(
        child => child instanceof THREE.Mesh &&
        child.geometry instanceof THREE.BoxGeometry
      );
      // At least 4 walls + multiple obstacles
      expect(boxMeshes.length).toBeGreaterThan(4);
    });

    it('should create platforms', () => {
      arena.build();
      
      // Platforms are also box meshes but positioned higher
      const boxMeshes = scene.children.filter(
        child => child instanceof THREE.Mesh &&
        child.geometry instanceof THREE.BoxGeometry &&
        child.position.y > 1
      );
      expect(boxMeshes.length).toBeGreaterThan(0);
    });
  });

  describe('getPickupSpawnPoints()', () => {
    it('should return array of pickup spawn points', () => {
      arena.build();
      const points = arena.getPickupSpawnPoints();
      
      expect(Array.isArray(points)).toBe(true);
    });

    it('should have spawn points with x, y, z coordinates', () => {
      arena.build();
      const points = arena.getPickupSpawnPoints();
      
      if (points.length > 0) {
        const point = points[0];
        expect(point).toHaveProperty('x');
        expect(point).toHaveProperty('y');
        expect(point).toHaveProperty('z');
      }
    });

    it('should return multiple spawn points', () => {
      arena.build();
      const points = arena.getPickupSpawnPoints();
      
      expect(points.length).toBeGreaterThan(0);
    });
  });

  describe('getEnemySpawnPoints()', () => {
    it('should return array of enemy spawn points', () => {
      const points = arena.getEnemySpawnPoints();
      
      expect(Array.isArray(points)).toBe(true);
    });

    it('should have spawn points with x, y, z coordinates', () => {
      const points = arena.getEnemySpawnPoints();
      
      if (points.length > 0) {
        const point = points[0];
        expect(point).toHaveProperty('x');
        expect(point).toHaveProperty('y');
        expect(point).toHaveProperty('z');
      }
    });

    it('should return multiple spawn points', () => {
      const points = arena.getEnemySpawnPoints();
      
      expect(points.length).toBeGreaterThan(0);
    });
  });

  describe('getPlayerSpawnPoint()', () => {
    it('should return player spawn point', () => {
      const point = arena.getPlayerSpawnPoint();
      
      expect(point).toBeDefined();
    });

    it('should have x, y, z coordinates', () => {
      const point = arena.getPlayerSpawnPoint();
      
      expect(point).toHaveProperty('x');
      expect(point).toHaveProperty('y');
      expect(point).toHaveProperty('z');
    });

    it('should return consistent spawn point', () => {
      const point1 = arena.getPlayerSpawnPoint();
      const point2 = arena.getPlayerSpawnPoint();
      
      expect(point1.x).toBe(point2.x);
      expect(point1.y).toBe(point2.y);
      expect(point1.z).toBe(point2.z);
    });
  });

  describe('dispose()', () => {
    it('should not throw when disposing', () => {
      arena.build();
      expect(() => arena.dispose()).not.toThrow();
    });

    it('should remove meshes from scene', () => {
      arena.build();
      const childrenAfterBuild = scene.children.length;
      
      arena.dispose();
      
      // Some scene children might remain (lights, etc from other sources)
      // But arena objects should be removed
      expect(scene.children.length).toBeLessThan(childrenAfterBuild);
    });

    it('should not throw when called multiple times', () => {
      arena.build();
      arena.dispose();
      
      expect(() => arena.dispose()).not.toThrow();
    });

    it('should not throw when called without build', () => {
      expect(() => arena.dispose()).not.toThrow();
    });
  });

  describe('physics integration', () => {
    beforeEach(() => {
      arena.build();
    });

    it('should create ground physics body', () => {
      // Ground should be a static body
      const staticBodies = physics.world.bodies.filter(body => body.mass === 0);
      expect(staticBodies.length).toBeGreaterThan(0);
    });

    it('should create wall physics bodies', () => {
      // Walls should be static bodies with WORLD collision group
      const worldBodies = physics.world.bodies.filter(
        body => (body.collisionFilterGroup ?? 0 & COLLISION_GROUPS.WORLD) !== 0
      );
      expect(worldBodies.length).toBeGreaterThan(0);
    });

    it('should create obstacle physics bodies', () => {
      // Multiple static box bodies
      const staticBoxes = physics.world.bodies.filter(body => body.mass === 0);
      expect(staticBoxes.length).toBeGreaterThan(5);
    });
  });

  describe('visual elements', () => {
    beforeEach(() => {
      arena.build();
    });

    it('should create meshes with shadows enabled', () => {
      const shadowCasters = scene.children.filter(
        child => child instanceof THREE.Mesh && (child as THREE.Mesh).castShadow
      );
      expect(shadowCasters.length).toBeGreaterThan(0);
    });

    it('should create meshes that receive shadows', () => {
      const shadowReceivers = scene.children.filter(
        child => child instanceof THREE.Mesh && (child as THREE.Mesh).receiveShadow
      );
      expect(shadowReceivers.length).toBeGreaterThan(0);
    });
  });
});

describe('Arena spawn point distribution', () => {
  let arena: Arena;
  let scene: THREE.Scene;
  let physics: Physics;

  beforeEach(() => {
    scene = new THREE.Scene();
    physics = new Physics();
    arena = new Arena(scene, physics);
    arena.build();
  });

  afterEach(() => {
    arena.dispose();
    physics.dispose();
  });

  it('should have enemy spawn points spread around the arena', () => {
    const points = arena.getEnemySpawnPoints();
    
    // Check that spawn points are distributed (not all in same position)
    if (points.length > 1) {
      const firstPoint = points[0];
      const hasVariety = points.some(
        p => p.x !== firstPoint.x || p.z !== firstPoint.z
      );
      expect(hasVariety).toBe(true);
    }
  });

  it('should have pickup spawn points spread around the arena', () => {
    const points = arena.getPickupSpawnPoints();
    
    if (points.length > 1) {
      const firstPoint = points[0];
      const hasVariety = points.some(
        p => p.x !== firstPoint.x || p.z !== firstPoint.z
      );
      expect(hasVariety).toBe(true);
    }
  });

  it('should have player spawn point inside arena bounds', () => {
    const point = arena.getPlayerSpawnPoint();
    const arenaSize = 30; // Based on config
    
    expect(Math.abs(point.x)).toBeLessThanOrEqual(arenaSize);
    expect(Math.abs(point.z)).toBeLessThanOrEqual(arenaSize);
  });
});
