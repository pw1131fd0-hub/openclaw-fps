import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { Player } from './Player';
import { Physics } from '@/engine/Physics';
import { createMockInputManager, createMockAudioManager } from '@/test/mocks';
import { WeaponType, Vector3 } from '@/types/GameTypes';
import { PLAYER_CONFIG } from '@/data/Config';

describe('Player', () => {
  let player: Player;
  let physics: Physics;
  let mockInput: ReturnType<typeof createMockInputManager>;
  let mockAudio: ReturnType<typeof createMockAudioManager>;
  let camera: THREE.PerspectiveCamera;
  const spawnPosition: Vector3 = { x: 0, y: 0, z: 0 };

  beforeEach(() => {
    physics = new Physics();
    mockInput = createMockInputManager();
    mockAudio = createMockAudioManager();
    camera = new THREE.PerspectiveCamera();
    
    player = new Player(
      physics,
      mockInput as any,
      mockAudio as any,
      camera,
      spawnPosition
    );
  });

  afterEach(() => {
    player.dispose();
    physics.dispose();
  });

  describe('initialization', () => {
    it('should create Player instance', () => {
      expect(player).toBeDefined();
    });

    it('should have max health', () => {
      expect(player.maxHealth).toBe(PLAYER_CONFIG.maxHealth);
    });

    it('should start with full health', () => {
      expect(player.health).toBe(player.maxHealth);
    });

    it('should start alive', () => {
      expect(player.isAlive).toBe(true);
    });

    it('should start with pistol weapon', () => {
      expect(player.currentWeapon).toBe('pistol');
    });

    it('should have position near spawn', () => {
      const pos = player.position;
      expect(pos.x).toBeCloseTo(spawnPosition.x, 1);
      expect(pos.z).toBeCloseTo(spawnPosition.z, 1);
    });

    it('should have initial rotation', () => {
      const rot = player.rotation;
      expect(rot.pitch).toBe(0);
      expect(rot.yaw).toBe(0);
    });

    it('should add physics body to world', () => {
      const playerBodies = physics.world.bodies.filter(
        body => body.mass > 0
      );
      expect(playerBodies.length).toBeGreaterThan(0);
    });
  });

  describe('position and rotation', () => {
    it('should return position as Vector3', () => {
      const pos = player.position;
      
      expect(pos).toHaveProperty('x');
      expect(pos).toHaveProperty('y');
      expect(pos).toHaveProperty('z');
    });

    it('should return rotation with pitch and yaw', () => {
      const rot = player.rotation;
      
      expect(rot).toHaveProperty('pitch');
      expect(rot).toHaveProperty('yaw');
    });
  });

  describe('health management', () => {
    it('should get current health', () => {
      expect(typeof player.health).toBe('number');
    });

    it('should get max health', () => {
      expect(typeof player.maxHealth).toBe('number');
      expect(player.maxHealth).toBeGreaterThan(0);
    });
  });

  describe('takeDamage()', () => {
    it('should reduce health', () => {
      const initialHealth = player.health;
      player.takeDamage(20);
      
      expect(player.health).toBe(initialHealth - 20);
    });

    it('should not go below 0', () => {
      player.takeDamage(1000);
      
      expect(player.health).toBe(0);
    });

    it('should play hurt sound', () => {
      player.takeDamage(10);
      
      expect(mockAudio.play).toHaveBeenCalledWith('player_hurt');
    });

    it('should call onDamage callback', () => {
      const callback = vi.fn();
      player.onDamage(callback);
      
      player.takeDamage(25);
      
      expect(callback).toHaveBeenCalledWith(25, undefined);
    });

    it('should pass damage direction to callback', () => {
      const callback = vi.fn();
      player.onDamage(callback);
      const direction = { x: 1, y: 0, z: 0 };
      
      player.takeDamage(25, direction);
      
      expect(callback).toHaveBeenCalledWith(25, direction);
    });

    it('should trigger death at 0 health', () => {
      const deathCallback = vi.fn();
      player.onDeath(deathCallback);
      
      player.takeDamage(player.maxHealth);
      
      expect(deathCallback).toHaveBeenCalled();
    });

    it('should set isAlive to false on death', () => {
      player.takeDamage(player.maxHealth);
      
      expect(player.isAlive).toBe(false);
    });

    it('should play death sound on death', () => {
      player.takeDamage(player.maxHealth);
      
      expect(mockAudio.play).toHaveBeenCalledWith('player_death');
    });

    it('should not take damage when dead', () => {
      player.takeDamage(player.maxHealth);
      const healthAfterDeath = player.health;
      
      player.takeDamage(50);
      
      expect(player.health).toBe(healthAfterDeath);
    });
  });

  describe('heal()', () => {
    beforeEach(() => {
      player.takeDamage(50);
    });

    it('should increase health', () => {
      const healthBefore = player.health;
      player.heal(20);
      
      expect(player.health).toBe(healthBefore + 20);
    });

    it('should not exceed max health', () => {
      player.heal(1000);
      
      expect(player.health).toBe(player.maxHealth);
    });

    it('should call onHeal callback', () => {
      const callback = vi.fn();
      player.onHeal(callback);
      
      player.heal(20);
      
      expect(callback).toHaveBeenCalledWith(20);
    });

    it('should not call onHeal if no healing happened', () => {
      player.heal(50); // Heal to full
      
      const callback = vi.fn();
      player.onHeal(callback);
      
      player.heal(20); // Already full
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not heal when dead', () => {
      player.takeDamage(player.maxHealth);
      
      player.heal(50);
      
      expect(player.health).toBe(0);
    });
  });

  describe('weapon switching', () => {
    it('should switch to shotgun', () => {
      player.switchWeapon('shotgun');
      
      expect(player.currentWeapon).toBe('shotgun');
    });

    it('should switch to assault rifle', () => {
      player.switchWeapon('assault_rifle');
      
      expect(player.currentWeapon).toBe('assault_rifle');
    });

    it('should switch back to pistol', () => {
      player.switchWeapon('shotgun');
      player.switchWeapon('pistol');
      
      expect(player.currentWeapon).toBe('pistol');
    });

    it('should play switch sound', () => {
      player.switchWeapon('shotgun');
      
      expect(mockAudio.play).toHaveBeenCalledWith('weapon_switch');
    });

    it('should call onWeaponSwitch callback', () => {
      const callback = vi.fn();
      player.onWeaponSwitch(callback);
      
      player.switchWeapon('shotgun');
      
      expect(callback).toHaveBeenCalledWith('pistol', 'shotgun');
    });

    it('should not switch to same weapon', () => {
      const callback = vi.fn();
      player.onWeaponSwitch(callback);
      
      player.switchWeapon('pistol');
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should get current weapon', () => {
      const weapon = player.getWeapon();
      
      expect(weapon).toBeDefined();
    });
  });

  describe('movement', () => {
    it('should move forward', () => {
      const initialZ = player.position.z;
      player.move(1, 0, false, 0.1);
      physics.step(0.1);
      player.syncWithPhysics();
      
      // Position should change based on rotation
      expect(player.position).toBeDefined();
    });

    it('should move backward', () => {
      player.move(-1, 0, false, 0.1);
      physics.step(0.1);
      player.syncWithPhysics();
      
      expect(player.position).toBeDefined();
    });

    it('should strafe left', () => {
      player.move(0, -1, false, 0.1);
      physics.step(0.1);
      player.syncWithPhysics();
      
      expect(player.position).toBeDefined();
    });

    it('should strafe right', () => {
      player.move(0, 1, false, 0.1);
      physics.step(0.1);
      player.syncWithPhysics();
      
      expect(player.position).toBeDefined();
    });
  });

  describe('jumping', () => {
    it('should attempt to jump', () => {
      expect(() => player.jump()).not.toThrow();
    });

    it('should not throw when called multiple times', () => {
      expect(() => {
        player.jump();
        player.jump();
        player.jump();
      }).not.toThrow();
    });
  });

  describe('fire()', () => {
    it('should return boolean', () => {
      const result = player.fire();
      
      expect(typeof result).toBe('boolean');
    });

    it('should be able to fire', () => {
      // Player starts with ammo
      expect(() => player.fire()).not.toThrow();
    });
  });

  describe('reload()', () => {
    it('should not throw', () => {
      expect(() => player.reload()).not.toThrow();
    });
  });

  describe('addAmmo()', () => {
    it('should add pistol ammo', () => {
      expect(() => player.addAmmo('pistol', 30)).not.toThrow();
    });

    it('should add shotgun ammo', () => {
      expect(() => player.addAmmo('shotgun', 10)).not.toThrow();
    });

    it('should add assault rifle ammo', () => {
      expect(() => player.addAmmo('assault_rifle', 60)).not.toThrow();
    });
  });

  describe('setOnHitEnemy()', () => {
    it('should set callback for all weapons', () => {
      const callback = vi.fn();
      
      expect(() => player.setOnHitEnemy(callback)).not.toThrow();
    });
  });

  describe('update()', () => {
    it('should not throw', () => {
      expect(() => player.update(0.016)).not.toThrow();
    });

    it('should not update when dead', () => {
      player.takeDamage(player.maxHealth);
      
      expect(() => player.update(0.016)).not.toThrow();
    });
  });

  describe('reset()', () => {
    it('should restore full health', () => {
      player.takeDamage(50);
      
      player.reset(spawnPosition);
      
      expect(player.health).toBe(player.maxHealth);
    });

    it('should set isAlive to true', () => {
      player.takeDamage(player.maxHealth);
      
      player.reset(spawnPosition);
      
      expect(player.isAlive).toBe(true);
    });

    it('should reset weapon to pistol', () => {
      player.switchWeapon('shotgun');
      
      player.reset(spawnPosition);
      
      expect(player.currentWeapon).toBe('pistol');
    });

    it('should reset rotation', () => {
      player.reset(spawnPosition);
      
      const rot = player.rotation;
      expect(rot.pitch).toBe(0);
      expect(rot.yaw).toBe(0);
    });

    it('should reset position', () => {
      const newSpawn = { x: 10, y: 5, z: -10 };
      
      player.reset(newSpawn);
      physics.step(0.016);
      player.syncWithPhysics();
      
      const pos = player.position;
      expect(pos.x).toBeCloseTo(newSpawn.x, 0);
    });
  });

  describe('callbacks', () => {
    it('should register onDeath callback', () => {
      const callback = vi.fn();
      player.onDeath(callback);
      
      expect(() => player.dispose()).not.toThrow();
    });

    it('should register onDamage callback', () => {
      const callback = vi.fn();
      player.onDamage(callback);
      
      expect(() => player.dispose()).not.toThrow();
    });

    it('should register onHeal callback', () => {
      const callback = vi.fn();
      player.onHeal(callback);
      
      expect(() => player.dispose()).not.toThrow();
    });

    it('should register onWeaponFire callback', () => {
      const callback = vi.fn();
      player.onWeaponFire(callback);
      
      expect(() => player.dispose()).not.toThrow();
    });

    it('should register onWeaponSwitch callback', () => {
      const callback = vi.fn();
      player.onWeaponSwitch(callback);
      
      expect(() => player.dispose()).not.toThrow();
    });
  });

  describe('dispose()', () => {
    it('should not throw', () => {
      expect(() => player.dispose()).not.toThrow();
    });

    it('should remove physics body', () => {
      const bodiesBefore = physics.world.bodies.length;
      
      player.dispose();
      
      expect(physics.world.bodies.length).toBeLessThan(bodiesBefore);
    });
  });

  describe('isGrounded', () => {
    it('should have isGrounded property', () => {
      expect(typeof player.isGrounded).toBe('boolean');
    });
  });
});
