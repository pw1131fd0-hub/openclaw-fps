import { Game } from '@/game/Game';

// Check WebGL support
function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl !== null;
  } catch {
    return false;
  }
}

// Show error screen
function showError(title?: string, message?: string): void {
  const loadingScreen = document.getElementById('loading-screen');
  const errorScreen = document.getElementById('error-screen');
  
  if (errorScreen) {
    if (title) {
      const h1 = errorScreen.querySelector('h1');
      if (h1) h1.textContent = title;
    }
    if (message) {
      const p = errorScreen.querySelector('p');
      if (p) p.textContent = message;
    }
    errorScreen.style.display = 'flex';
  }
  if (loadingScreen) loadingScreen.style.display = 'none';
}

// Main initialization
async function main(): Promise<void> {
  // Check WebGL support
  if (!checkWebGLSupport()) {
    showError();
    return;
  }

  // Get DOM elements
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const uiContainer = document.getElementById('ui-container') as HTMLElement;

  if (!canvas || !uiContainer) {
    const errorMsg = '找不到必要的 DOM 元素 (game-canvas 或 ui-container)';
    console.error(errorMsg);
    showError('系統錯誤', errorMsg);
    return;
  }

  // Create and initialize game
  try {
    const game = new Game(canvas, uiContainer);
    await game.init();

    // Expose game instance for debugging (development only)
    if (typeof import.meta.env !== 'undefined' && import.meta.env.DEV) {
      (window as unknown as { game: Game }).game = game;
    }

    // Handle visibility change (pause when tab is hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && game.state === 'playing') {
        game.pause();
      }
    });

    // Handle beforeunload
    window.addEventListener('beforeunload', () => {
      game.dispose();
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Failed to initialize game:', error);
    showError('初始化失敗', `遊戲初始化過程中發生錯誤: ${errorMsg}`);
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
