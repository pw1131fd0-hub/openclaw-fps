import { colorToCSS, COLORS } from '@/data/Config';

export class TouchControls {
  private container: HTMLElement;

  // Joystick state
  private movementJoystick: {
    element: HTMLElement;
    knob: HTMLElement;
    active: boolean;
    startX: number;
    startY: number;
    deltaX: number;
    deltaY: number;
    touchId: number | null;
  } | null = null;

  // Look state
  private lookArea: {
    element: HTMLElement;
    active: boolean;
    lastX: number;
    lastY: number;
    deltaX: number;
    deltaY: number;
    touchId: number | null;
  } | null = null;

  // Buttons
  private fireButton: HTMLElement | null = null;
  private jumpButton: HTMLElement | null = null;
  private reloadButton: HTMLElement | null = null;
  private weaponButtons: HTMLElement[] = [];

  private _isFirePressed: boolean = false;
  private _isJumpPressed: boolean = false;
  private _isReloadPressed: boolean = false;

  private onWeaponSwitchCallback?: (index: number) => void;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'touch-controls';
    this.container.innerHTML = this.getTemplate();
    this.applyStyles();
  }

  private getTemplate(): string {
    return `
      <div class="touch-joystick left" id="movement-joystick">
        <div class="joystick-base">
          <div class="joystick-knob"></div>
        </div>
      </div>
      
      <div class="touch-look-area" id="look-area"></div>
      
      <div class="touch-buttons">
        <button class="touch-button fire" id="fire-button">🔫</button>
        <button class="touch-button jump" id="jump-button">⬆️</button>
        <button class="touch-button reload" id="reload-button">🔄</button>
      </div>
      
      <div class="weapon-buttons">
        <button class="weapon-button" data-weapon="1">1</button>
        <button class="weapon-button" data-weapon="2">2</button>
        <button class="weapon-button" data-weapon="3">3</button>
      </div>
    `;
  }

  private applyStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      #touch-controls {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 150;
        pointer-events: none;
        display: none;
      }
      
      #touch-controls.visible {
        display: block;
      }
      
      .touch-joystick {
        position: absolute;
        bottom: 30px;
        pointer-events: auto;
      }
      
      .touch-joystick.left {
        left: 30px;
      }
      
      .joystick-base {
        width: 120px;
        height: 120px;
        background: rgba(26, 31, 46, 0.6);
        border: 3px solid ${colorToCSS(COLORS.primary)};
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      .joystick-knob {
        width: 50px;
        height: 50px;
        background: ${colorToCSS(COLORS.primary)};
        border-radius: 50%;
        transition: transform 0.05s;
      }
      
      .touch-look-area {
        position: absolute;
        top: 0;
        right: 0;
        width: 50%;
        height: 60%;
        pointer-events: auto;
      }
      
      .touch-buttons {
        position: absolute;
        bottom: 30px;
        right: 30px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        pointer-events: auto;
      }
      
      .touch-button {
        width: 70px;
        height: 70px;
        background: rgba(26, 31, 46, 0.6);
        border: 3px solid ${colorToCSS(COLORS.primary)};
        border-radius: 50%;
        font-size: 24px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
      }
      
      .touch-button:active,
      .touch-button.active {
        background: ${colorToCSS(COLORS.primary)};
      }
      
      .touch-button.fire {
        width: 90px;
        height: 90px;
        border-color: ${colorToCSS(COLORS.danger)};
      }
      
      .touch-button.fire:active,
      .touch-button.fire.active {
        background: ${colorToCSS(COLORS.danger)};
      }
      
      .weapon-buttons {
        position: absolute;
        bottom: 200px;
        right: 120px;
        display: flex;
        gap: 10px;
        pointer-events: auto;
      }
      
      .weapon-button {
        width: 45px;
        height: 45px;
        background: rgba(26, 31, 46, 0.6);
        border: 2px solid ${colorToCSS(COLORS.primary)};
        border-radius: 8px;
        color: ${colorToCSS(COLORS.textPrimary)};
        font-family: 'Orbitron', sans-serif;
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      
      .weapon-button:active {
        background: ${colorToCSS(COLORS.primary)};
        color: ${colorToCSS(COLORS.background)};
      }
      
      @media (min-width: 1024px) {
        #touch-controls {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  public init(container: HTMLElement): void {
    container.appendChild(this.container);

    // Setup joystick
    const joystickEl = document.getElementById('movement-joystick');
    if (joystickEl) {
      const knob = joystickEl.querySelector('.joystick-knob') as HTMLElement;
      this.movementJoystick = {
        element: joystickEl,
        knob,
        active: false,
        startX: 0,
        startY: 0,
        deltaX: 0,
        deltaY: 0,
        touchId: null,
      };

      joystickEl.addEventListener('touchstart', this.onJoystickTouchStart.bind(this));
      joystickEl.addEventListener('touchmove', this.onJoystickTouchMove.bind(this));
      joystickEl.addEventListener('touchend', this.onJoystickTouchEnd.bind(this));
    }

    // Setup look area
    const lookEl = document.getElementById('look-area');
    if (lookEl) {
      this.lookArea = {
        element: lookEl,
        active: false,
        lastX: 0,
        lastY: 0,
        deltaX: 0,
        deltaY: 0,
        touchId: null,
      };

      lookEl.addEventListener('touchstart', this.onLookTouchStart.bind(this));
      lookEl.addEventListener('touchmove', this.onLookTouchMove.bind(this));
      lookEl.addEventListener('touchend', this.onLookTouchEnd.bind(this));
    }

    // Setup buttons
    this.fireButton = document.getElementById('fire-button');
    this.jumpButton = document.getElementById('jump-button');
    this.reloadButton = document.getElementById('reload-button');

    this.setupButton(this.fireButton, (pressed) => {
      this._isFirePressed = pressed;
    });

    this.setupButton(this.jumpButton, (pressed) => {
      this._isJumpPressed = pressed;
    });

    this.setupButton(this.reloadButton, (pressed) => {
      this._isReloadPressed = pressed;
    });

    // Weapon buttons
    const weaponBtns = this.container.querySelectorAll('.weapon-button');
    weaponBtns.forEach((btn) => {
      this.weaponButtons.push(btn as HTMLElement);
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const index = parseInt((btn as HTMLElement).dataset.weapon || '1');
        if (this.onWeaponSwitchCallback) {
          this.onWeaponSwitchCallback(index);
        }
      });
    });
  }

  private setupButton(
    button: HTMLElement | null,
    callback: (pressed: boolean) => void
  ): void {
    if (!button) return;

    button.addEventListener('touchstart', (e) => {
      e.preventDefault();
      button.classList.add('active');
      callback(true);
    });

    button.addEventListener('touchend', () => {
      button.classList.remove('active');
      callback(false);
    });

    button.addEventListener('touchcancel', () => {
      button.classList.remove('active');
      callback(false);
    });
  }

  private onJoystickTouchStart(e: TouchEvent): void {
    if (!this.movementJoystick || this.movementJoystick.active) return;

    const touch = e.changedTouches[0];
    const rect = this.movementJoystick.element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    this.movementJoystick.active = true;
    this.movementJoystick.touchId = touch.identifier;
    this.movementJoystick.startX = centerX;
    this.movementJoystick.startY = centerY;
  }

  private onJoystickTouchMove(e: TouchEvent): void {
    if (!this.movementJoystick || !this.movementJoystick.active) return;

    const touch = Array.from(e.changedTouches).find(
      (t) => t.identifier === this.movementJoystick!.touchId
    );
    if (!touch) return;

    const maxRadius = 35;
    let deltaX = touch.clientX - this.movementJoystick.startX;
    let deltaY = touch.clientY - this.movementJoystick.startY;

    // Clamp to max radius
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > maxRadius) {
      deltaX = (deltaX / distance) * maxRadius;
      deltaY = (deltaY / distance) * maxRadius;
    }

    this.movementJoystick.deltaX = deltaX / maxRadius;
    this.movementJoystick.deltaY = deltaY / maxRadius;

    // Move knob
    this.movementJoystick.knob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  }

  private onJoystickTouchEnd(e: TouchEvent): void {
    if (!this.movementJoystick) return;

    const touch = Array.from(e.changedTouches).find(
      (t) => t.identifier === this.movementJoystick!.touchId
    );
    if (!touch) return;

    this.movementJoystick.active = false;
    this.movementJoystick.touchId = null;
    this.movementJoystick.deltaX = 0;
    this.movementJoystick.deltaY = 0;
    this.movementJoystick.knob.style.transform = 'translate(0, 0)';
  }

  private onLookTouchStart(e: TouchEvent): void {
    if (!this.lookArea || this.lookArea.active) return;

    const touch = e.changedTouches[0];
    this.lookArea.active = true;
    this.lookArea.touchId = touch.identifier;
    this.lookArea.lastX = touch.clientX;
    this.lookArea.lastY = touch.clientY;
  }

  private onLookTouchMove(e: TouchEvent): void {
    if (!this.lookArea || !this.lookArea.active) return;

    const touch = Array.from(e.changedTouches).find(
      (t) => t.identifier === this.lookArea!.touchId
    );
    if (!touch) return;

    this.lookArea.deltaX = touch.clientX - this.lookArea.lastX;
    this.lookArea.deltaY = touch.clientY - this.lookArea.lastY;
    this.lookArea.lastX = touch.clientX;
    this.lookArea.lastY = touch.clientY;
  }

  private onLookTouchEnd(e: TouchEvent): void {
    if (!this.lookArea) return;

    const touch = Array.from(e.changedTouches).find(
      (t) => t.identifier === this.lookArea!.touchId
    );
    if (!touch) return;

    this.lookArea.active = false;
    this.lookArea.touchId = null;
    this.lookArea.deltaX = 0;
    this.lookArea.deltaY = 0;
  }

  public show(): void {
    this.container.classList.add('visible');
  }

  public hide(): void {
    this.container.classList.remove('visible');
  }

  public getMovementVector(): { x: number; y: number } {
    if (!this.movementJoystick) return { x: 0, y: 0 };
    return {
      x: this.movementJoystick.deltaX,
      y: -this.movementJoystick.deltaY, // Invert Y for forward/backward
    };
  }

  public getLookDelta(): { x: number; y: number } {
    if (!this.lookArea) return { x: 0, y: 0 };

    const sensitivity = 0.005;
    return {
      x: this.lookArea.deltaX * sensitivity,
      y: this.lookArea.deltaY * sensitivity,
    };
  }

  public isFirePressed(): boolean {
    return this._isFirePressed;
  }

  public isJumpPressed(): boolean {
    return this._isJumpPressed;
  }

  public isReloadPressed(): boolean {
    return this._isReloadPressed;
  }

  public onWeaponSwitch(callback: (index: number) => void): void {
    this.onWeaponSwitchCallback = callback;
  }

  public update(): void {
    // Clear look delta after reading
    if (this.lookArea) {
      this.lookArea.deltaX = 0;
      this.lookArea.deltaY = 0;
    }

    // Clear single-press states
    this._isJumpPressed = false;
    this._isReloadPressed = false;
  }

  public dispose(): void {
    this.container.remove();
  }
}
