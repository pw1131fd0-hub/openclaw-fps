import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TouchControls } from './TouchControls';

// Helper to create touch events
function createTouchEvent(type: string, touches: Partial<Touch>[], changedTouches?: Partial<Touch>[]): TouchEvent {
  const touchList = touches.map((t, i) => ({
    identifier: i,
    target: document.body,
    clientX: 0,
    clientY: 0,
    screenX: 0,
    screenY: 0,
    pageX: 0,
    pageY: 0,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 0,
    ...t,
  })) as Touch[];

  const changedList = (changedTouches || touches).map((t, i) => ({
    identifier: i,
    target: document.body,
    clientX: 0,
    clientY: 0,
    screenX: 0,
    screenY: 0,
    pageX: 0,
    pageY: 0,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 0,
    ...t,
  })) as Touch[];

  return new TouchEvent(type, {
    touches: touchList,
    changedTouches: changedList,
  });
}

describe('TouchControls', () => {
  let touchControls: TouchControls;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'game-container';
    document.body.appendChild(container);
    
    touchControls = new TouchControls();
    touchControls.init(container);
  });

  afterEach(() => {
    touchControls.dispose();
    document.body.innerHTML = '';
  });

  describe('initialization', () => {
    it('should create TouchControls instance', () => {
      expect(touchControls).toBeDefined();
    });

    it('should append touch controls container to parent', () => {
      const touchElement = document.getElementById('touch-controls');
      expect(touchElement).not.toBeNull();
    });

    it('should create movement joystick', () => {
      const joystick = document.getElementById('movement-joystick');
      expect(joystick).not.toBeNull();
    });

    it('should create look area', () => {
      const lookArea = document.getElementById('look-area');
      expect(lookArea).not.toBeNull();
    });

    it('should create fire button', () => {
      const fireBtn = document.getElementById('fire-button');
      expect(fireBtn).not.toBeNull();
    });

    it('should create jump button', () => {
      const jumpBtn = document.getElementById('jump-button');
      expect(jumpBtn).not.toBeNull();
    });

    it('should create reload button', () => {
      const reloadBtn = document.getElementById('reload-button');
      expect(reloadBtn).not.toBeNull();
    });

    it('should create weapon buttons', () => {
      const weaponButtons = container.querySelectorAll('.weapon-button');
      expect(weaponButtons.length).toBe(3);
    });

    it('should have joystick knob element', () => {
      const knob = document.querySelector('.joystick-knob');
      expect(knob).not.toBeNull();
    });
  });

  describe('show() / hide()', () => {
    it('should show touch controls', () => {
      touchControls.show();
      
      const touchElement = document.getElementById('touch-controls');
      expect(touchElement?.classList.contains('visible')).toBe(true);
    });

    it('should hide touch controls', () => {
      touchControls.show();
      touchControls.hide();
      
      const touchElement = document.getElementById('touch-controls');
      expect(touchElement?.classList.contains('visible')).toBe(false);
    });
  });

  describe('getMovementVector()', () => {
    it('should return zero vector by default', () => {
      const movement = touchControls.getMovementVector();
      
      expect(movement.x).toBeCloseTo(0);
      expect(movement.y).toBeCloseTo(0);
    });
  });

  describe('getLookDelta()', () => {
    it('should return zero delta by default', () => {
      const delta = touchControls.getLookDelta();
      
      expect(delta.x).toBe(0);
      expect(delta.y).toBe(0);
    });
  });

  describe('button states', () => {
    it('should return false for isFirePressed by default', () => {
      expect(touchControls.isFirePressed()).toBe(false);
    });

    it('should return false for isJumpPressed by default', () => {
      expect(touchControls.isJumpPressed()).toBe(false);
    });

    it('should return false for isReloadPressed by default', () => {
      expect(touchControls.isReloadPressed()).toBe(false);
    });
  });

  describe('fire button touch events', () => {
    it('should set isFirePressed to true on touchstart', () => {
      const fireBtn = document.getElementById('fire-button');
      
      const touchEvent = createTouchEvent('touchstart', [{ clientX: 0, clientY: 0 }]);
      fireBtn?.dispatchEvent(touchEvent);
      
      expect(touchControls.isFirePressed()).toBe(true);
    });

    it('should set isFirePressed to false on touchend', () => {
      const fireBtn = document.getElementById('fire-button');
      
      const touchStart = createTouchEvent('touchstart', [{ clientX: 0, clientY: 0 }]);
      fireBtn?.dispatchEvent(touchStart);
      
      const touchEnd = createTouchEvent('touchend', [], [{ clientX: 0, clientY: 0 }]);
      fireBtn?.dispatchEvent(touchEnd);
      
      expect(touchControls.isFirePressed()).toBe(false);
    });

    it('should set isFirePressed to false on touchcancel', () => {
      const fireBtn = document.getElementById('fire-button');
      
      const touchStart = createTouchEvent('touchstart', [{ clientX: 0, clientY: 0 }]);
      fireBtn?.dispatchEvent(touchStart);
      
      const touchCancel = createTouchEvent('touchcancel', [], [{ clientX: 0, clientY: 0 }]);
      fireBtn?.dispatchEvent(touchCancel);
      
      expect(touchControls.isFirePressed()).toBe(false);
    });

    it('should add active class on touchstart', () => {
      const fireBtn = document.getElementById('fire-button');
      
      const touchEvent = createTouchEvent('touchstart', [{ clientX: 0, clientY: 0 }]);
      fireBtn?.dispatchEvent(touchEvent);
      
      expect(fireBtn?.classList.contains('active')).toBe(true);
    });

    it('should remove active class on touchend', () => {
      const fireBtn = document.getElementById('fire-button');
      
      const touchStart = createTouchEvent('touchstart', [{ clientX: 0, clientY: 0 }]);
      fireBtn?.dispatchEvent(touchStart);
      
      const touchEnd = createTouchEvent('touchend', [], [{ clientX: 0, clientY: 0 }]);
      fireBtn?.dispatchEvent(touchEnd);
      
      expect(fireBtn?.classList.contains('active')).toBe(false);
    });
  });

  describe('jump button touch events', () => {
    it('should set isJumpPressed to true on touchstart', () => {
      const jumpBtn = document.getElementById('jump-button');
      
      const touchEvent = createTouchEvent('touchstart', [{ clientX: 0, clientY: 0 }]);
      jumpBtn?.dispatchEvent(touchEvent);
      
      expect(touchControls.isJumpPressed()).toBe(true);
    });

    it('should set isJumpPressed to false on touchend', () => {
      const jumpBtn = document.getElementById('jump-button');
      
      const touchStart = createTouchEvent('touchstart', [{ clientX: 0, clientY: 0 }]);
      jumpBtn?.dispatchEvent(touchStart);
      
      const touchEnd = createTouchEvent('touchend', [], [{ clientX: 0, clientY: 0 }]);
      jumpBtn?.dispatchEvent(touchEnd);
      
      expect(touchControls.isJumpPressed()).toBe(false);
    });
  });

  describe('reload button touch events', () => {
    it('should set isReloadPressed to true on touchstart', () => {
      const reloadBtn = document.getElementById('reload-button');
      
      const touchEvent = createTouchEvent('touchstart', [{ clientX: 0, clientY: 0 }]);
      reloadBtn?.dispatchEvent(touchEvent);
      
      expect(touchControls.isReloadPressed()).toBe(true);
    });
  });

  describe('weapon switch callback', () => {
    it('should register onWeaponSwitch callback', () => {
      const callback = vi.fn();
      touchControls.onWeaponSwitch(callback);
      
      expect(() => touchControls.dispose()).not.toThrow();
    });

    it('should trigger callback with weapon index on button press', () => {
      const callback = vi.fn();
      touchControls.onWeaponSwitch(callback);
      
      const weaponBtns = container.querySelectorAll('.weapon-button');
      const touchEvent = createTouchEvent('touchstart', [{ clientX: 0, clientY: 0 }]);
      weaponBtns[0]?.dispatchEvent(touchEvent);
      
      expect(callback).toHaveBeenCalledWith(1);
    });

    it('should trigger callback with correct index for second weapon', () => {
      const callback = vi.fn();
      touchControls.onWeaponSwitch(callback);
      
      const weaponBtns = container.querySelectorAll('.weapon-button');
      const touchEvent = createTouchEvent('touchstart', [{ clientX: 0, clientY: 0 }]);
      weaponBtns[1]?.dispatchEvent(touchEvent);
      
      expect(callback).toHaveBeenCalledWith(2);
    });

    it('should trigger callback with correct index for third weapon', () => {
      const callback = vi.fn();
      touchControls.onWeaponSwitch(callback);
      
      const weaponBtns = container.querySelectorAll('.weapon-button');
      const touchEvent = createTouchEvent('touchstart', [{ clientX: 0, clientY: 0 }]);
      weaponBtns[2]?.dispatchEvent(touchEvent);
      
      expect(callback).toHaveBeenCalledWith(3);
    });
  });

  describe('update()', () => {
    it('should clear look delta after update', () => {
      // The look delta should be cleared
      touchControls.update();
      
      const delta = touchControls.getLookDelta();
      expect(delta.x).toBe(0);
      expect(delta.y).toBe(0);
    });

    it('should clear single-press states after update', () => {
      // Jump and reload are single-press states
      const jumpBtn = document.getElementById('jump-button');
      const touchEvent = createTouchEvent('touchstart', [{ clientX: 0, clientY: 0 }]);
      jumpBtn?.dispatchEvent(touchEvent);
      
      touchControls.update();
      
      // After update, jump should be false (single-press behavior)
      expect(touchControls.isJumpPressed()).toBe(false);
    });
  });

  describe('dispose()', () => {
    it('should remove touch controls from DOM', () => {
      touchControls.dispose();
      
      const touchElement = document.getElementById('touch-controls');
      expect(touchElement).toBeNull();
    });
  });

  describe('joystick touch handling', () => {
    it('should not throw on joystick touchstart', () => {
      const joystick = document.getElementById('movement-joystick');
      const touchEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      
      expect(() => joystick?.dispatchEvent(touchEvent)).not.toThrow();
    });

    it('should not throw on joystick touchmove', () => {
      const joystick = document.getElementById('movement-joystick');
      
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      joystick?.dispatchEvent(touchStart);
      
      const touchMove = createTouchEvent('touchmove', [{ clientX: 120, clientY: 120 }]);
      expect(() => joystick?.dispatchEvent(touchMove)).not.toThrow();
    });

    it('should not throw on joystick touchend', () => {
      const joystick = document.getElementById('movement-joystick');
      
      const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
      joystick?.dispatchEvent(touchStart);
      
      const touchEnd = createTouchEvent('touchend', [], [{ clientX: 100, clientY: 100 }]);
      expect(() => joystick?.dispatchEvent(touchEnd)).not.toThrow();
    });
  });

  describe('look area touch handling', () => {
    it('should not throw on look area touchstart', () => {
      const lookArea = document.getElementById('look-area');
      const touchEvent = createTouchEvent('touchstart', [{ clientX: 500, clientY: 300 }]);
      
      expect(() => lookArea?.dispatchEvent(touchEvent)).not.toThrow();
    });

    it('should not throw on look area touchmove', () => {
      const lookArea = document.getElementById('look-area');
      
      const touchStart = createTouchEvent('touchstart', [{ clientX: 500, clientY: 300 }]);
      lookArea?.dispatchEvent(touchStart);
      
      const touchMove = createTouchEvent('touchmove', [{ clientX: 520, clientY: 310 }]);
      expect(() => lookArea?.dispatchEvent(touchMove)).not.toThrow();
    });

    it('should not throw on look area touchend', () => {
      const lookArea = document.getElementById('look-area');
      
      const touchStart = createTouchEvent('touchstart', [{ clientX: 500, clientY: 300 }]);
      lookArea?.dispatchEvent(touchStart);
      
      const touchEnd = createTouchEvent('touchend', [], [{ clientX: 500, clientY: 300 }]);
      expect(() => lookArea?.dispatchEvent(touchEnd)).not.toThrow();
    });
  });
});
