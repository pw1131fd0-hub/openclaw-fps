import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Physics, COLLISION_GROUPS, RaycastResult } from './Physics';
import * as CANNON from 'cannon-es';

// Mock cannon-es minimally to test Physics
vi.mock('cannon-es', async () => {
  const actual = await vi.importActual<typeof import('cannon-es')>('cannon-es');
  return actual;
});

describe('Physics', () => {
  let physics: Physics;

  beforeEach(() => {
    physics = new Physics();
  });

  describe('initialization', () => {
    it('should create Physics instance', () => {
      expect(physics).toBeDefined();
    });

    it('should create CANNON.World', () => {
      expect(physics.world).toBeDefined();
      expect(physics.world).toBeInstanceOf(CANNON.World);
    });

    it('should set gravity', () => {
      expect(physics.world.gravity.y).toBeLessThan(0);
    });

    it('should use SAPBroadphase', () => {
      expect(physics.world.broadphase).toBeInstanceOf(CANNON.SAPBroadphase);
    });

    it('should allow sleep', () => {
      expect(physics.world.allowSleep).toBe(true);
    });
  });

  describe('COLLISION_GROUPS', () => {
    it('should define WORLD group', () => {
      expect(COLLISION_GROUPS.WORLD).toBe(1);
    });

    it('should define PLAYER group', () => {
      expect(COLLISION_GROUPS.PLAYER).toBe(2);
    });

    it('should define ENEMY group', () => {
      expect(COLLISION_GROUPS.ENEMY).toBe(4);
    });

    it('should define PROJECTILE group', () => {
      expect(COLLISION_GROUPS.PROJECTILE).toBe(8);
    });

    it('should define PICKUP group', () => {
      expect(COLLISION_GROUPS.PICKUP).toBe(16);
    });

    it('should have unique values for all groups', () => {
      const groups = Object.values(COLLISION_GROUPS);
      const uniqueGroups = new Set(groups);
      expect(uniqueGroups.size).toBe(groups.length);
    });
  });

  describe('addBody()', () => {
    it('should add body to world', () => {
      const body = new CANNON.Body({ mass: 1 });
      const initialCount = physics.world.bodies.length;
      
      physics.addBody(body);
      
      expect(physics.world.bodies.length).toBe(initialCount + 1);
    });

    it('should return body ID', () => {
      const body = new CANNON.Body({ mass: 1 });
      const id = physics.addBody(body);
      
      expect(typeof id).toBe('number');
    });

    it('should return incrementing IDs', () => {
      const body1 = new CANNON.Body({ mass: 1 });
      const body2 = new CANNON.Body({ mass: 1 });
      
      const id1 = physics.addBody(body1);
      const id2 = physics.addBody(body2);
      
      expect(id2).toBe(id1 + 1);
    });
  });

  describe('removeBody()', () => {
    it('should remove body from world', () => {
      const body = new CANNON.Body({ mass: 1 });
      physics.addBody(body);
      const countAfterAdd = physics.world.bodies.length;
      
      physics.removeBody(body);
      
      expect(physics.world.bodies.length).toBe(countAfterAdd - 1);
    });
  });

  describe('getBody()', () => {
    it('should return body by ID', () => {
      const body = new CANNON.Body({ mass: 1 });
      const id = physics.addBody(body);
      
      const retrieved = physics.getBody(id);
      
      expect(retrieved).toBe(body);
    });

    it('should return undefined for non-existent ID', () => {
      const retrieved = physics.getBody(999);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('step()', () => {
    it('should advance physics simulation', () => {
      const body = new CANNON.Body({ 
        mass: 1,
        position: new CANNON.Vec3(0, 10, 0)
      });
      physics.addBody(body);
      
      const initialY = body.position.y;
      physics.step(1/60);
      
      // Body should fall due to gravity
      expect(body.position.y).toBeLessThan(initialY);
    });

    it('should not throw with zero delta', () => {
      expect(() => physics.step(0)).not.toThrow();
    });
  });

  describe('createPlayerBody()', () => {
    it('should create body at given position', () => {
      const position = { x: 5, y: 2, z: 10 };
      const body = physics.createPlayerBody(position);
      
      expect(body.position.x).toBe(position.x);
      expect(body.position.z).toBe(position.z);
    });

    it('should have fixed rotation', () => {
      const body = physics.createPlayerBody({ x: 0, y: 0, z: 0 });
      expect(body.fixedRotation).toBe(true);
    });

    it('should use PLAYER collision group', () => {
      const body = physics.createPlayerBody({ x: 0, y: 0, z: 0 });
      expect(body.collisionFilterGroup).toBe(COLLISION_GROUPS.PLAYER);
    });

    it('should collide with WORLD and ENEMY', () => {
      const body = physics.createPlayerBody({ x: 0, y: 0, z: 0 });
      expect(body.collisionFilterMask & COLLISION_GROUPS.WORLD).toBeTruthy();
      expect(body.collisionFilterMask & COLLISION_GROUPS.ENEMY).toBeTruthy();
    });
  });

  describe('createEnemyBody()', () => {
    it('should create body at given position', () => {
      const position = { x: 5, y: 0, z: 10 };
      const body = physics.createEnemyBody(position);
      
      expect(body.position.x).toBe(position.x);
      expect(body.position.z).toBe(position.z);
    });

    it('should have fixed rotation', () => {
      const body = physics.createEnemyBody({ x: 0, y: 0, z: 0 });
      expect(body.fixedRotation).toBe(true);
    });

    it('should use ENEMY collision group', () => {
      const body = physics.createEnemyBody({ x: 0, y: 0, z: 0 });
      expect(body.collisionFilterGroup).toBe(COLLISION_GROUPS.ENEMY);
    });

    it('should accept custom radius and height', () => {
      const body = physics.createEnemyBody({ x: 0, y: 0, z: 0 }, 1.0, 2.0);
      expect(body).toBeDefined();
    });
  });

  describe('createStaticBox()', () => {
    it('should create static body (mass 0)', () => {
      const body = physics.createStaticBox(
        { x: 0, y: 0, z: 0 },
        { width: 2, height: 2, depth: 2 }
      );
      
      expect(body.mass).toBe(0);
    });

    it('should position at given location', () => {
      const position = { x: 5, y: 3, z: -2 };
      const body = physics.createStaticBox(position, { width: 2, height: 2, depth: 2 });
      
      expect(body.position.x).toBe(position.x);
      expect(body.position.y).toBe(position.y);
      expect(body.position.z).toBe(position.z);
    });

    it('should use WORLD collision group', () => {
      const body = physics.createStaticBox(
        { x: 0, y: 0, z: 0 },
        { width: 2, height: 2, depth: 2 }
      );
      expect(body.collisionFilterGroup).toBe(COLLISION_GROUPS.WORLD);
    });
  });

  describe('createGroundPlane()', () => {
    it('should create static plane', () => {
      const body = physics.createGroundPlane();
      expect(body.mass).toBe(0);
    });

    it('should use WORLD collision group', () => {
      const body = physics.createGroundPlane();
      expect(body.collisionFilterGroup).toBe(COLLISION_GROUPS.WORLD);
    });

    it('should be horizontal (rotated)', () => {
      const body = physics.createGroundPlane();
      // Should be rotated to be horizontal
      expect(body.quaternion.x).not.toBe(0);
    });
  });

  describe('raycast()', () => {
    beforeEach(() => {
      // Create ground plane for raycast to hit
      const ground = physics.createGroundPlane();
      physics.addBody(ground);
    });

    it('should return RaycastResult object', () => {
      const result = physics.raycast(
        { x: 0, y: 10, z: 0 },
        { x: 0, y: -10, z: 0 }
      );
      
      expect(result).toHaveProperty('hit');
    });

    it('should detect ground hit', () => {
      const result = physics.raycast(
        { x: 0, y: 10, z: 0 },
        { x: 0, y: -10, z: 0 }
      );
      
      expect(result.hit).toBe(true);
    });

    it('should return hit point', () => {
      const result = physics.raycast(
        { x: 0, y: 10, z: 0 },
        { x: 0, y: -10, z: 0 }
      );
      
      if (result.hit) {
        expect(result.point).toBeDefined();
        expect(result.point?.y).toBeCloseTo(0, 1);
      }
    });

    it('should return miss for rays that hit nothing', () => {
      const result = physics.raycast(
        { x: 0, y: 10, z: 0 },
        { x: 0, y: 20, z: 0 }
      );
      
      expect(result.hit).toBe(false);
    });
  });

  describe('raycastAll()', () => {
    beforeEach(() => {
      const ground = physics.createGroundPlane();
      physics.addBody(ground);
    });

    it('should return array of results', () => {
      const results = physics.raycastAll(
        { x: 0, y: 10, z: 0 },
        { x: 0, y: -10, z: 0 }
      );
      
      expect(Array.isArray(results)).toBe(true);
    });

    it('should return sorted results by distance', () => {
      // Add multiple bodies
      const box1 = physics.createStaticBox({ x: 0, y: 5, z: 0 }, { width: 2, height: 0.5, depth: 2 });
      const box2 = physics.createStaticBox({ x: 0, y: 3, z: 0 }, { width: 2, height: 0.5, depth: 2 });
      physics.addBody(box1);
      physics.addBody(box2);

      const results = physics.raycastAll(
        { x: 0, y: 10, z: 0 },
        { x: 0, y: -10, z: 0 }
      );
      
      // Results should be sorted by distance (closest first)
      for (let i = 1; i < results.length; i++) {
        expect(results[i].distance! >= results[i-1].distance!).toBe(true);
      }
    });
  });

  describe('dispose()', () => {
    it('should remove all bodies', () => {
      const body1 = new CANNON.Body({ mass: 1 });
      const body2 = new CANNON.Body({ mass: 1 });
      physics.addBody(body1);
      physics.addBody(body2);
      
      physics.dispose();
      
      expect(physics.world.bodies.length).toBe(0);
    });

    it('should not throw when called multiple times', () => {
      physics.dispose();
      expect(() => physics.dispose()).not.toThrow();
    });
  });
});
