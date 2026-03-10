import { KeyAction } from '@/types/GameTypes';
import { DEFAULT_SETTINGS } from '@/data/Config';

type KeyBindings = Record<KeyAction, string[]>;

const DEFAULT_KEY_BINDINGS: KeyBindings = {
  moveForward: ['KeyW', 'ArrowUp'],
  moveBackward: ['KeyS', 'ArrowDown'],
  moveLeft: ['KeyA', 'ArrowLeft'],
  moveRight: ['KeyD', 'ArrowRight'],
  sprint: ['ShiftLeft', 'ShiftRight'],
  jump: ['Space'],
  reload: ['KeyR'],
  fire: ['MouseLeft'],
  weapon1: ['Digit1'],
  weapon2: ['Digit2'],
  weapon3: ['Digit3'],
  pause: ['Escape'],
};

export class InputManager {
  private keysPressed: Set<string> = new Set();
  private keysJustPressed: Set<string> = new Set();
  private keysJustReleased: Set<string> = new Set();

  private mouseButtons: Set<number> = new Set();
  private mouseButtonsJustPressed: Set<number> = new Set();
  private mouseDelta: { x: number; y: number } = { x: 0, y: 0 };

  private _isPointerLocked: boolean = false;
  private pointerLockCallbacks: ((locked: boolean) => void)[] = [];

  private bindings: KeyBindings = DEFAULT_KEY_BINDINGS;
  private sensitivity: number = DEFAULT_SETTINGS.mouseSensitivity;
  private invertY: boolean = DEFAULT_SETTINGS.invertY;

  // Store bound methods for correct removal
  private boundKeyDown = this.onKeyDown.bind(this);
  private boundKeyUp = this.onKeyUp.bind(this);
  private boundMouseDown = this.onMouseDown.bind(this);
  private boundMouseUp = this.onMouseUp.bind(this);
  private boundMouseMove = this.onMouseMove.bind(this);
  private boundPointerLockChange = this.onPointerLockChange.bind(this);

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    document.addEventListener('keydown', this.boundKeyDown);
    document.addEventListener('keyup', this.boundKeyUp);

    // Mouse events
    document.addEventListener('mousedown', this.boundMouseDown);
    document.addEventListener('mouseup', this.boundMouseUp);
    document.addEventListener('mousemove', this.boundMouseMove);

    // Pointer lock
    document.addEventListener(
      'pointerlockchange',
      this.boundPointerLockChange
    );
  }

  private onKeyDown(event: KeyboardEvent): void {
    const code = event.code;
    
    // Check code for justPressed
    if (!this.keysPressed.has(code)) {
      this.keysJustPressed.add(code);
    }
    
    this.keysPressed.add(code);

    // Prevent default for game keys
    if (this.isGameKey(code)) {
      event.preventDefault();
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keysPressed.delete(event.code);
    this.keysJustReleased.add(event.code);
  }

  private onMouseDown(event: MouseEvent): void {
    if (!this.mouseButtons.has(event.button)) {
      this.mouseButtonsJustPressed.add(event.button);
    }
    this.mouseButtons.add(event.button);

    // Request pointer lock on click if we are in a context where it's allowed
    if (!this._isPointerLocked && event.button === 0) {
      this.requestPointerLock();
    }
  }

  private onMouseUp(event: MouseEvent): void {
    this.mouseButtons.delete(event.button);
  }

  private onMouseMove(event: MouseEvent): void {
    if (this._isPointerLocked) {
      this.mouseDelta.x += event.movementX;
      this.mouseDelta.y += event.movementY;
    }
  }

  private onPointerLockChange(): void {
    this._isPointerLocked = document.pointerLockElement !== null;
    this.pointerLockCallbacks.forEach((callback) =>
      callback(this._isPointerLocked)
    );
  }

  private isGameKey(code: string): boolean {
    for (const keys of Object.values(this.bindings)) {
      if (keys.includes(code)) {
        return true;
      }
    }
    return false;
  }

  // Public API
  public get isPointerLocked(): boolean {
    return this._isPointerLocked;
  }

  public get isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  public isActionPressed(action: KeyAction): boolean {
    const keys = this.bindings[action];
    if (!keys) return false;

    for (const key of keys) {
      if (key === 'MouseLeft' && this.mouseButtons.has(0)) return true;
      if (key === 'MouseRight' && this.mouseButtons.has(2)) return true;
      if (this.keysPressed.has(key)) return true;
    }
    return false;
  }

  public isActionJustPressed(action: KeyAction): boolean {
    const keys = this.bindings[action];
    if (!keys) return false;

    for (const key of keys) {
      if (key === 'MouseLeft' && this.mouseButtonsJustPressed.has(0))
        return true;
      if (key === 'MouseRight' && this.mouseButtonsJustPressed.has(2))
        return true;
      if (this.keysJustPressed.has(key)) return true;
    }
    return false;
  }

  public getMouseDelta(): { x: number; y: number } {
    const yMultiplier = this.invertY ? -1 : 1;
    return {
      x: this.mouseDelta.x * this.sensitivity,
      y: this.mouseDelta.y * this.sensitivity * yMultiplier,
    };
  }

  public isMouseButtonPressed(button: number): boolean {
    return this.mouseButtons.has(button);
  }

  public requestPointerLock(): void {
    const canvas = document.getElementById('game-canvas');
    if (canvas && !this._isPointerLocked) {
      const promise = canvas.requestPointerLock() as any;
      if (promise && promise.catch) {
        promise.catch((error: Error) => {
          if (error.name !== 'SecurityError') {
            console.error('Pointer lock failed:', error);
          }
        });
      }
    }
  }

  public exitPointerLock(): void {
    document.exitPointerLock();
  }

  public onPointerLockChangeCallback(callback: (locked: boolean) => void): void {
    this.pointerLockCallbacks.push(callback);
  }

  public setSensitivity(sensitivity: number): void {
    this.sensitivity = sensitivity;
  }

  public setInvertY(invert: boolean): void {
    this.invertY = invert;
  }

  public update(): void {
    // Clear per-frame state
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
    this.mouseButtonsJustPressed.clear();
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
  }

  public dispose(): void {
    document.removeEventListener('keydown', this.boundKeyDown);
    document.removeEventListener('keyup', this.boundKeyUp);
    document.removeEventListener('mousedown', this.boundMouseDown);
    document.removeEventListener('mouseup', this.boundMouseUp);
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener(
      'pointerlockchange',
      this.boundPointerLockChange
    );
  }
}
