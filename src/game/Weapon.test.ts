import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Weapon } from '@/game/Weapon';
import { WEAPON_CONFIGS } from '@/data/Config';
import type { Physics } from '@/engine/Physics';
import type { AudioManager } from '@/engine/AudioManager';
import * as THREE from 'three';

// Create mock implementations
function createMockPhysics(): Physics {
  return {
    createPlayerBody: vi.fn(),
    createEnemyBody: vi.fn(),
    addBody: vi.fn(),
    removeBody: vi.fn(),
    raycast: vi.fn(() => ({ hit: false })),
    update: vi.fn(),
    step: vi.fn(),
    createStaticBox: vi.fn(),
    createPickupBody: vi.fn(),
    dispose: vi.fn(),
  } as unknown as Physics;
}

function createMockAudioManager(): AudioManager {
  return {
    play: vi.fn(),
    stop: vi.fn(),
    setVolume: vi.fn(),
    setMasterVolume: vi.fn(),
    isPlaying: vi.fn(() => false),
    loadSounds: vi.fn(),
    dispose: vi.fn(),
  } as unknown as AudioManager;
}

describe('Weapon', () => {
  let weapon: Weapon;
  let mockPhysics: Physics;
  let mockAudio: AudioManager;
  let getPlayerPosition: () => THREE.Vector3;
  let getPlayerDirection: () => THREE.Vector3;

  beforeEach(() => {
    mockPhysics = createMockPhysics();
    mockAudio = createMockAudioManager();
    getPlayerPosition = () => new THREE.Vector3(0, 1, 0);
    getPlayerDirection = () => new THREE.Vector3(0, 0, -1);
    
    weapon = new Weapon(
      'pistol',
      mockPhysics,
      mockAudio,
      getPlayerPosition,
      getPlayerDirection
    );
  });

  describe('initialization', () => {
    it('should initialize with correct weapon type', () => {
      expect(weapon.type).toBe('pistol');
    });

    it('should load config for weapon type', () => {
      expect(weapon.config).toEqual(WEAPON_CONFIGS.pistol);
    });

    it('should start with full magazine', () => {
      expect(weapon.currentAmmo).toBe(WEAPON_CONFIGS.pistol.magazineSize);
    });

    it('should start with max reserve ammo', () => {
      expect(weapon.reserveAmmo).toBe(WEAPON_CONFIGS.pistol.maxReserveAmmo);
    });

    it('should not be reloading initially', () => {
      expect(weapon.isReloading).toBe(false);
    });
  });

  describe('canFire', () => {
    it('should be able to fire when has ammo', () => {
      expect(weapon.canFire).toBe(true);
    });

    it('should not be able to fire when no ammo and no reserve', () => {
      // Fire all ammo
      while (weapon.currentAmmo > 0) {
        weapon.fire();
      }
      // Cancel the auto-reload
      weapon.cancelReload();
      
      // Remove all reserve ammo by adding negative (reset and use)
      weapon.reset();
      // Fire all bullets to empty magazine
      while (weapon.currentAmmo > 0) {
        weapon.fire();
      }
      weapon.cancelReload();
      
      expect(weapon.currentAmmo).toBe(0);
      expect(weapon.canFire).toBe(false);
    });
  });

  describe('fire', () => {
    it('should decrease ammo when firing', () => {
      const initialAmmo = weapon.currentAmmo;
      weapon.fire();
      expect(weapon.currentAmmo).toBe(initialAmmo - 1);
    });

    it('should play fire sound', () => {
      weapon.fire();
      expect(mockAudio.play).toHaveBeenCalledWith('pistol_fire');
    });

    it('should play empty click when out of ammo', () => {
      // Empty the magazine
      while (weapon.currentAmmo > 0) {
        weapon.fire();
      }
      // Wait for reload to start, then cancel it
      weapon.cancelReload();
      
      // Try to fire again
      weapon.fire();
      expect(mockAudio.play).toHaveBeenCalledWith('empty_click');
    });

    it('should perform raycast', () => {
      weapon.fire();
      expect(mockPhysics.raycast).toHaveBeenCalled();
    });

    it('should return hit results', () => {
      (mockPhysics.raycast as ReturnType<typeof vi.fn>).mockReturnValue({
        hit: true,
        body: {
          userData: { entityId: 'enemy-1', entityType: 'enemy' },
          position: { y: 1 },
        },
        point: { x: 10, y: 1, z: -10 },
        distance: 10,
      });

      const results = weapon.fire();
      expect(results.length).toBe(1);
      expect(results[0].hit).toBe(true);
    });
  });

  describe('reload', () => {
    it('should start reloading', () => {
      // Fire some shots first
      weapon.fire();
      weapon.fire();
      
      weapon.reload();
      expect(weapon.isReloading).toBe(true);
    });

    it('should play reload sound', () => {
      weapon.fire();
      weapon.reload();
      expect(mockAudio.play).toHaveBeenCalledWith('reload');
    });

    it('should not reload when magazine is full', () => {
      weapon.reload();
      expect(weapon.isReloading).toBe(false);
    });

    it('should not reload when already reloading', () => {
      weapon.fire();
      weapon.reload();
      const callCount = (mockAudio.play as ReturnType<typeof vi.fn>).mock.calls.length;
      weapon.reload(); // Try to reload again
      // Should not have called play again
      expect((mockAudio.play as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
    });

    it('should restore ammo after reload time', async () => {
      // Fire some ammo first (not all, to avoid auto-reload)
      weapon.fire();
      weapon.fire();
      
      const ammoBeforeReload = weapon.currentAmmo;
      
      vi.useFakeTimers();
      weapon.reload();
      
      expect(weapon.isReloading).toBe(true);
      
      // Fast forward past reload time
      await vi.advanceTimersByTimeAsync(WEAPON_CONFIGS.pistol.reloadTime + 100);
      
      expect(weapon.isReloading).toBe(false);
      expect(weapon.currentAmmo).toBe(WEAPON_CONFIGS.pistol.magazineSize);
      
      vi.useRealTimers();
    });
  });

  describe('cancelReload', () => {
    it('should cancel ongoing reload', () => {
      weapon.fire();
      weapon.reload();
      expect(weapon.isReloading).toBe(true);
      
      weapon.cancelReload();
      expect(weapon.isReloading).toBe(false);
    });
  });

  describe('addAmmo', () => {
    it('should add reserve ammo', () => {
      // Start with a fresh weapon that isn't at max reserve
      // First fire a shot and reload to reduce reserve
      weapon.fire();
      vi.useFakeTimers();
      weapon.reload();
      vi.advanceTimersByTime(WEAPON_CONFIGS.pistol.reloadTime + 100);
      vi.useRealTimers();
      
      // Now reserve should be less than max
      const beforeAddAmmo = weapon.reserveAmmo;
      weapon.addAmmo(5);
      
      // Should have added 5 (or hit max)
      expect(weapon.reserveAmmo).toBe(Math.min(beforeAddAmmo + 5, WEAPON_CONFIGS.pistol.maxReserveAmmo));
    });

    it('should not exceed max reserve ammo', () => {
      weapon.addAmmo(1000);
      expect(weapon.reserveAmmo).toBe(WEAPON_CONFIGS.pistol.maxReserveAmmo);
    });
  });

  describe('reset', () => {
    it('should reset ammo to full', () => {
      // Use some ammo
      weapon.fire();
      weapon.fire();
      
      weapon.reset();
      
      expect(weapon.currentAmmo).toBe(WEAPON_CONFIGS.pistol.magazineSize);
      expect(weapon.reserveAmmo).toBe(WEAPON_CONFIGS.pistol.maxReserveAmmo);
    });

    it('should cancel any ongoing reload', () => {
      weapon.fire();
      weapon.reload();
      
      weapon.reset();
      
      expect(weapon.isReloading).toBe(false);
    });
  });

  describe('shotgun', () => {
    beforeEach(() => {
      weapon = new Weapon(
        'shotgun',
        mockPhysics,
        mockAudio,
        getPlayerPosition,
        getPlayerDirection
      );
    });

    it('should have multiple projectiles', () => {
      expect(weapon.config.projectileCount).toBeGreaterThan(1);
    });

    it('should fire multiple raycasts', () => {
      weapon.fire();
      expect(mockPhysics.raycast).toHaveBeenCalledTimes(WEAPON_CONFIGS.shotgun.projectileCount);
    });
  });

  describe('assault_rifle', () => {
    beforeEach(() => {
      weapon = new Weapon(
        'assault_rifle',
        mockPhysics,
        mockAudio,
        getPlayerPosition,
        getPlayerDirection
      );
    });

    it('should have higher fire rate than pistol', () => {
      expect(weapon.config.fireRate).toBeGreaterThan(WEAPON_CONFIGS.pistol.fireRate);
    });

    it('should have larger magazine than pistol', () => {
      expect(weapon.config.magazineSize).toBeGreaterThan(WEAPON_CONFIGS.pistol.magazineSize);
    });
  });

  describe('hit enemy callback', () => {
    it('should call onHitEnemy when hitting enemy', () => {
      const hitCallback = vi.fn();
      weapon.setOnHitEnemy(hitCallback);

      (mockPhysics.raycast as ReturnType<typeof vi.fn>).mockReturnValue({
        hit: true,
        body: {
          userData: { entityId: 'enemy-1', entityType: 'enemy' },
          position: { y: 1 },
        },
        point: { x: 10, y: 1, z: -10 },
        distance: 10,
      });

      weapon.fire();
      
      expect(hitCallback).toHaveBeenCalledWith(
        'enemy-1',
        expect.any(Number),
        expect.any(Boolean),
        expect.objectContaining({ x: 10, y: 1, z: -10 })
      );
    });
  });
});
