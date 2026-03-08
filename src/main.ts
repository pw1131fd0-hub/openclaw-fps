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
function showError(): void {
  const loadingScreen = document.getElementById('loading-screen');
  const errorScreen = document.getElementById('error-screen');
  
  if (loadingScreen) loadingScreen.style.display = 'none';
  if (errorScreen) errorScreen.style.display = 'flex';
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
    console.error('Required DOM elements not found');
    showError();
    return;
  }

  // Create and initialize game
  try {
    const game = new Game(canvas, uiContainer);
    await game.init();

    // Expose game instance for debugging (development only)
    // @ts-ignore - import.meta.env is Vite-specific
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
    console.error('Failed to initialize game:', error);
    showError();
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
