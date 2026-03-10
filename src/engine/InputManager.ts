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
  private boundBlur = this.onBlur.bind(this);
  private boundContextMenu = (e: Event) => e.preventDefault();

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
    document.addEventListener('contextmenu', this.boundContextMenu);

    // Window events
    window.addEventListener('blur', this.boundBlur);

    // Pointer lock (still on document as per spec)
    document.addEventListener(
      'pointerlockchange',
      this.boundPointerLockChange
    );
  }

  private onKeyDown(event: KeyboardEvent): void {
    const code = event.code;
    const key = event.key;

    // We track both code and key for maximum compatibility
    // code is better for physical layout (WASD), key is a fallback
    const codesToTrack = this.getNormalizedCodes(code, key);
    
    codesToTrack.forEach(c => {
      if (!this.keysPressed.has(c)) {
        this.keysJustPressed.add(c);
      }
      this.keysPressed.add(c);
    });

    // Prevent default for game keys to avoid scrolling/browser shortcuts
    if (this.isGameKey(code) || (key && this.isGameKey(key))) {
      // Don't prevent F12 or other system shortcuts
      if (!event.ctrlKey && !event.altKey && !event.metaKey) {
        event.preventDefault();
      }
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    const code = event.code;
    const key = event.key;

    const codesToTrack = this.getNormalizedCodes(code, key);
    
    codesToTrack.forEach(c => {
      this.keysPressed.delete(c);
      this.keysJustReleased.add(c);
    });
  }

  private getNormalizedCodes(code: string | undefined, key: string | undefined): string[] {
    const results: string[] = [];
    if (code) results.push(code);
    
    if (key) {
      // Map common keys to standard codes as fallbacks
      const keyMap: Record<string, string> = {
        'w': 'KeyW', 'W': 'KeyW',
        'a': 'KeyA', 'A': 'KeyA',
        's': 'KeyS', 'S': 'KeyS',
        'd': 'KeyD', 'D': 'KeyD',
        'r': 'KeyR', 'R': 'KeyR',
        ' ': 'Space',
        '1': 'Digit1',
        '2': 'Digit2',
        '3': 'Digit3',
        'Escape': 'Escape',
        'ArrowUp': 'ArrowUp',
        'ArrowDown': 'ArrowDown',
        'ArrowLeft': 'ArrowLeft',
        'ArrowRight': 'ArrowRight',
        'Shift': 'ShiftLeft',
      };
      
      if (keyMap[key]) {
        results.push(keyMap[key]);
      }
      // Also track the literal key as a direct match
      results.push(key);
    }
    
    return results;
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

  private onBlur(): void {
    // Clear all inputs when window loses focus to prevent "stuck" keys
    this.keysPressed.clear();
    this.mouseButtons.clear();
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
  }

  private onPointerLockChange(): void {
    this._isPointerLocked = document.pointerLockElement !== null;
    this.pointerLockCallbacks.forEach((callback) =>
      callback(this._isPointerLocked)
    );
  }

  private isGameKey(codeOrKey: string): boolean {
    if (!codeOrKey) return false;
    for (const keys of Object.values(this.bindings)) {
      if (keys.includes(codeOrKey)) {
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
      try {
        const promise = canvas.requestPointerLock() as any;
        if (promise && promise.catch) {
          promise.catch((error: Error) => {
            if (error.name !== 'SecurityError') {
              console.error('Pointer lock failed:', error);
            }
          });
        }
      } catch (err) {
        console.warn('Pointer lock request failed', err);
      }
    }
  }

  public exitPointerLock(): void {
    // Check if exitPointerLock exists on document (it might not in all test environments)
    if (typeof document.exitPointerLock === 'function') {
      document.exitPointerLock();
    }
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
    document.removeEventListener('contextmenu', this.boundContextMenu);
    window.removeEventListener('blur', this.boundBlur);
    document.removeEventListener(
      'pointerlockchange',
      this.boundPointerLockChange
    );
  }
}
