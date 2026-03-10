import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { Player } from './Player';
import { Physics } from '@/engine/Physics';
import { createMockInputManager, createMockAudioManager } from '@/test/mocks';
import { Vector3 } from '@/types/GameTypes';
import { PLAYER_CONFIG } from '@/data/Config';

describe('Player Movement', () => {
  let player: Player;
  let physics: Physics;
  let mockInput: any;
  let mockAudio: any;
  let camera: THREE.PerspectiveCamera;
  const spawnPosition: Vector3 = { x: 0, y: 1, z: 0 };

  beforeEach(() => {
    physics = new Physics();
    // Add a floor so raycast works
    const ground = physics.createGroundPlane();
    physics.addBody(ground);

    mockInput = createMockInputManager();
    mockAudio = createMockAudioManager();
    camera = new THREE.PerspectiveCamera();
    
    player = new Player(
      physics,
      mockInput,
      mockAudio,
      camera,
      spawnPosition
    );
  });

  afterEach(() => {
    player.dispose();
    physics.dispose();
  });

  it('should move forward when moveForward action is pressed', () => {
    // Mock W key pressed
    mockInput.isActionPressed.mockImplementation((action: string) => action === 'moveForward');
    
    const initialZ = player.position.z;
    
    // Simulate 10 frames
    for (let i = 0; i < 10; i++) {
      player.update(0.016);
      physics.step(0.016);
      player.syncWithPhysics();
    }
    
    // With yaw 0, forward is -Z
    expect(player.position.z).toBeLessThan(initialZ);
  });

  it('should move right when moveRight action is pressed', () => {
    // Mock D key pressed
    mockInput.isActionPressed.mockImplementation((action: string) => action === 'moveRight');
    
    const initialX = player.position.x;
    
    // Simulate 10 frames
    for (let i = 0; i < 10; i++) {
      player.update(0.016);
      physics.step(0.016);
      player.syncWithPhysics();
    }
    
    // With yaw 0, right is +X
    expect(player.position.x).toBeGreaterThan(initialX);
  });

  it('should be grounded when on the floor', () => {
    // Initial spawn is at y=1.9 (spawnPosition.y + height/2)
    // Floor is at y=0. Player height is 1.8. 
    // Bottom of player is at 1.0. Should fall.
    
    // Step until fallen
    for (let i = 0; i < 60; i++) {
      player.update(0.016);
      physics.step(0.016);
      player.syncWithPhysics();
    }
    
    expect(player.position.y).toBeCloseTo(0.9, 0.1);
    expect(player.isGrounded).toBe(true);
  });
});
