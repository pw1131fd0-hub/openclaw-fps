// Mock implementations for Three.js and CANNON-es for testing
import { vi } from 'vitest';

// Mock THREE
export const mockThree = {
  Scene: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    remove: vi.fn(),
    children: [],
  })),
  
  PerspectiveCamera: vi.fn().mockImplementation(() => ({
    position: { x: 0, y: 0, z: 0, set: vi.fn(), clone: vi.fn(() => ({ x: 0, y: 0, z: 0 })) },
    rotation: { x: 0, y: 0, z: 0, order: 'XYZ' },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
    aspect: 1,
    updateProjectionMatrix: vi.fn(),
  })),
  
  Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
    x,
    y,
    z,
    set: vi.fn(function(this: { x: number; y: number; z: number }, nx: number, ny: number, nz: number) {
      this.x = nx;
      this.y = ny;
      this.z = nz;
      return this;
    }),
    clone: vi.fn(function(this: { x: number; y: number; z: number }) {
      return { ...this, clone: this.clone, add: vi.fn(), multiplyScalar: vi.fn() };
    }),
    add: vi.fn().mockReturnThis(),
    multiplyScalar: vi.fn().mockReturnThis(),
    addScaledVector: vi.fn().mockReturnThis(),
    normalize: vi.fn().mockReturnThis(),
    lengthSq: vi.fn(() => 0),
    applyAxisAngle: vi.fn().mockReturnThis(),
    applyQuaternion: vi.fn().mockReturnThis(),
  })),
  
  Group: vi.fn().mockImplementation(() => ({
    position: { x: 0, y: 0, z: 0, set: vi.fn() },
    rotation: { x: 0, y: 0, z: 0, set: vi.fn() },
    visible: true,
    add: vi.fn(),
    traverse: vi.fn(),
  })),
  
  Mesh: vi.fn().mockImplementation(() => ({
    position: { x: 0, y: 0, z: 0, set: vi.fn() },
    geometry: { dispose: vi.fn() },
    material: { dispose: vi.fn() },
    castShadow: false,
  })),
  
  BoxGeometry: vi.fn().mockImplementation(() => ({
    dispose: vi.fn(),
  })),
  
  MeshStandardMaterial: vi.fn().mockImplementation(() => ({
    dispose: vi.fn(),
    emissive: { setHex: vi.fn() },
    emissiveIntensity: 0,
  })),
  
  MeshBasicMaterial: vi.fn().mockImplementation(() => ({
    dispose: vi.fn(),
  })),
  
  WebGLRenderer: vi.fn().mockImplementation(() => ({
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    render: vi.fn(),
    domElement: document.createElement('canvas'),
  })),
  
  Raycaster: vi.fn().mockImplementation(() => ({
    set: vi.fn(),
    intersectObjects: vi.fn(() => []),
  })),
};

// Mock CANNON
export const mockCannon = {
  World: vi.fn().mockImplementation(() => ({
    gravity: { set: vi.fn() },
    addBody: vi.fn(),
    removeBody: vi.fn(),
    step: vi.fn(),
    bodies: [],
  })),
  
  Body: vi.fn().mockImplementation(() => ({
    position: { x: 0, y: 0, z: 0, set: vi.fn() },
    velocity: { x: 0, y: 0, z: 0, set: vi.fn() },
    addEventListener: vi.fn(),
    collisionResponse: true,
  })),
  
  Sphere: vi.fn().mockImplementation(() => ({})),
  
  Box: vi.fn().mockImplementation(() => ({})),
  
  Vec3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z })),
  
  Material: vi.fn().mockImplementation(() => ({})),
  
  ContactMaterial: vi.fn().mockImplementation(() => ({})),
};

// Helper to create mock Physics instance
export function createMockPhysics() {
  return {
    createPlayerBody: vi.fn(() => ({
      position: { x: 0, y: 0, z: 0, set: vi.fn() },
      velocity: { x: 0, y: 0, z: 0, set: vi.fn() },
      addEventListener: vi.fn(),
    })),
    createEnemyBody: vi.fn(() => ({
      position: { x: 0, y: 0, z: 0, set: vi.fn() },
      velocity: { x: 0, y: 0, z: 0, set: vi.fn() },
      addEventListener: vi.fn(),
      collisionResponse: true,
    })),
    addBody: vi.fn(),
    removeBody: vi.fn(),
    raycast: vi.fn(() => ({ hit: false })),
    update: vi.fn(),
    step: vi.fn(),
  };
}

// Helper to create mock AudioManager instance
export function createMockAudioManager() {
  return {
    play: vi.fn(),
    stop: vi.fn(),
    setVolume: vi.fn(),
    setMasterVolume: vi.fn(),
    isPlaying: vi.fn(() => false),
    loadSounds: vi.fn(),
    dispose: vi.fn(),
  };
}

// Helper to create mock InputManager instance
export function createMockInputManager() {
  return {
    isPointerLocked: false,
    getMouseDelta: vi.fn(() => ({ x: 0, y: 0 })),
    isActionPressed: vi.fn(() => false),
    isActionJustPressed: vi.fn(() => false),
    update: vi.fn(),
    dispose: vi.fn(),
    lockPointer: vi.fn(),
    unlockPointer: vi.fn(),
  };
}

// Helper to create mock Scene
export function createMockScene() {
  return {
    add: vi.fn(),
    remove: vi.fn(),
    children: [],
  } as unknown as THREE.Scene;
}

// Helper to create mock Camera
export function createMockCamera() {
  return {
    position: { x: 0, y: 0, z: 0, set: vi.fn(), clone: vi.fn(() => ({ x: 0, y: 0, z: 0 })) },
    rotation: { x: 0, y: 0, z: 0, order: 'XYZ' },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
    aspect: 1,
    updateProjectionMatrix: vi.fn(),
  } as unknown as THREE.PerspectiveCamera;
}

// Types for mocks
import type * as THREE from 'three';
