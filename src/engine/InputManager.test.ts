import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InputManager } from './InputManager';
import { DEFAULT_SETTINGS } from '@/data/Config';

describe('InputManager', () => {
  let inputManager: InputManager;

  beforeEach(() => {
    // Create mock canvas for pointer lock
    const canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    canvas.requestPointerLock = vi.fn();
    document.body.appendChild(canvas);
    
    inputManager = new InputManager();
  });

  afterEach(() => {
    inputManager.dispose();
    document.body.innerHTML = '';
  });

  describe('initialization', () => {
    it('should create InputManager instance', () => {
      expect(inputManager).toBeDefined();
    });

    it('should start with pointer unlocked', () => {
      expect(inputManager.isPointerLocked).toBe(false);
    });

    it('should detect touch device capability', () => {
      expect(typeof inputManager.isTouchDevice).toBe('boolean');
    });
  });

  describe('isActionPressed()', () => {
    it('should return false for unpressed actions', () => {
      expect(inputManager.isActionPressed('moveForward')).toBe(false);
      expect(inputManager.isActionPressed('fire')).toBe(false);
      expect(inputManager.isActionPressed('jump')).toBe(false);
    });

    it('should return true when key is pressed', () => {
      // Simulate keydown
      const event = new KeyboardEvent('keydown', { code: 'KeyW' });
      document.dispatchEvent(event);
      
      expect(inputManager.isActionPressed('moveForward')).toBe(true);
    });

    it('should return false after key is released', () => {
      // Press
      const keydown = new KeyboardEvent('keydown', { code: 'KeyW' });
      document.dispatchEvent(keydown);
      
      // Release
      const keyup = new KeyboardEvent('keyup', { code: 'KeyW' });
      document.dispatchEvent(keyup);
      
      expect(inputManager.isActionPressed('moveForward')).toBe(false);
    });

    it('should support WASD movement', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
      expect(inputManager.isActionPressed('moveForward')).toBe(true);
      
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS' }));
      expect(inputManager.isActionPressed('moveBackward')).toBe(true);
      
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
      expect(inputManager.isActionPressed('moveLeft')).toBe(true);
      
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));
      expect(inputManager.isActionPressed('moveRight')).toBe(true);
    });

    it('should support arrow key movement', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));
      expect(inputManager.isActionPressed('moveForward')).toBe(true);
      
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
      expect(inputManager.isActionPressed('moveBackward')).toBe(true);
      
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft' }));
      expect(inputManager.isActionPressed('moveLeft')).toBe(true);
      
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
      expect(inputManager.isActionPressed('moveRight')).toBe(true);
    });

    it('should detect jump key (Space)', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      expect(inputManager.isActionPressed('jump')).toBe(true);
    });

    it('should detect reload key (R)', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' }));
      expect(inputManager.isActionPressed('reload')).toBe(true);
    });

    it('should detect weapon switch keys', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1' }));
      expect(inputManager.isActionPressed('weapon1')).toBe(true);
      
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit2' }));
      expect(inputManager.isActionPressed('weapon2')).toBe(true);
      
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit3' }));
      expect(inputManager.isActionPressed('weapon3')).toBe(true);
    });

    it('should detect pause key (Escape)', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
      expect(inputManager.isActionPressed('pause')).toBe(true);
    });

    it('should detect left mouse button for fire', () => {
      document.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      expect(inputManager.isActionPressed('fire')).toBe(true);
    });

    it('should return false for invalid action', () => {
      expect(inputManager.isActionPressed('invalidAction' as any)).toBe(false);
    });
  });

  describe('isActionJustPressed()', () => {
    it('should return false for unpressed actions', () => {
      expect(inputManager.isActionJustPressed('jump')).toBe(false);
    });

    it('should return true on first frame of key press', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      
      expect(inputManager.isActionJustPressed('jump')).toBe(true);
    });

    it('should return false after update clears just-pressed state', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      
      inputManager.update();
      
      expect(inputManager.isActionJustPressed('jump')).toBe(false);
    });

    it('should return false for held keys', () => {
      // Press key
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      inputManager.update();
      
      // Key still held (duplicate keydown)
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      
      expect(inputManager.isActionJustPressed('jump')).toBe(false);
    });

    it('should detect mouse button just pressed', () => {
      document.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      
      expect(inputManager.isActionJustPressed('fire')).toBe(true);
    });
  });

  describe('isMouseButtonPressed()', () => {
    it('should detect left mouse button', () => {
      document.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      expect(inputManager.isMouseButtonPressed(0)).toBe(true);
    });

    it('should detect right mouse button', () => {
      document.dispatchEvent(new MouseEvent('mousedown', { button: 2 }));
      expect(inputManager.isMouseButtonPressed(2)).toBe(true);
    });

    it('should return false after mouse up', () => {
      document.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      document.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
      
      expect(inputManager.isMouseButtonPressed(0)).toBe(false);
    });
  });

  describe('getMouseDelta()', () => {
    it('should return zero delta by default', () => {
      const delta = inputManager.getMouseDelta();
      
      expect(delta.x).toBe(0);
      expect(delta.y).toBe(0);
    });

    it('should reset delta after update', () => {
      inputManager.update();
      
      const delta = inputManager.getMouseDelta();
      expect(delta.x).toBe(0);
      expect(delta.y).toBe(0);
    });
  });

  describe('setSensitivity()', () => {
    it('should set mouse sensitivity', () => {
      expect(() => inputManager.setSensitivity(0.005)).not.toThrow();
    });
  });

  describe('setInvertY()', () => {
    it('should set invert Y option', () => {
      expect(() => inputManager.setInvertY(true)).not.toThrow();
    });
  });

  describe('requestPointerLock()', () => {
    it('should request pointer lock on canvas', () => {
      const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
      
      inputManager.requestPointerLock();
      
      expect(canvas.requestPointerLock).toHaveBeenCalled();
    });

    it('should not throw if canvas not found', () => {
      document.body.innerHTML = '';
      
      expect(() => inputManager.requestPointerLock()).not.toThrow();
    });
  });

  describe('exitPointerLock()', () => {
    it('should exit pointer lock', () => {
      // Mock exitPointerLock since jsdom doesn't have it
      document.exitPointerLock = vi.fn();
      
      inputManager.exitPointerLock();
      
      expect(document.exitPointerLock).toHaveBeenCalled();
    });
  });

  describe('onPointerLockChangeCallback()', () => {
    it('should register callback', () => {
      const callback = vi.fn();
      
      expect(() => inputManager.onPointerLockChangeCallback(callback)).not.toThrow();
    });

    it('should call callback on pointer lock change', () => {
      const callback = vi.fn();
      inputManager.onPointerLockChangeCallback(callback);
      
      document.dispatchEvent(new Event('pointerlockchange'));
      
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('update()', () => {
    it('should clear just-pressed state', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      expect(inputManager.isActionJustPressed('jump')).toBe(true);
      
      inputManager.update();
      
      expect(inputManager.isActionJustPressed('jump')).toBe(false);
    });

    it('should clear mouse delta', () => {
      inputManager.update();
      
      const delta = inputManager.getMouseDelta();
      expect(delta.x).toBe(0);
      expect(delta.y).toBe(0);
    });
  });

  describe('dispose()', () => {
    it('should not throw', () => {
      expect(() => inputManager.dispose()).not.toThrow();
    });
  });

  describe('prevent default behavior', () => {
    it('should prevent default for game keys', () => {
      const event = new KeyboardEvent('keydown', { code: 'Space' });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      
      document.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('default settings', () => {
    it('should use default mouse sensitivity', () => {
      expect(DEFAULT_SETTINGS.mouseSensitivity).toBe(0.0015);
    });

    it('should support invert Y option', () => {
      expect(typeof DEFAULT_SETTINGS.invertY).toBe('boolean');
    });
  });
});
