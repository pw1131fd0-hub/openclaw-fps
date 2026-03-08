// Test setup file for vitest

// Mock localStorage for Storage tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock performance.now() if not available
if (typeof performance === 'undefined') {
  (global as unknown as { performance: { now: () => number } }).performance = {
    now: () => Date.now(),
  };
}

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return window.setTimeout(() => callback(performance.now()), 16);
};

global.cancelAnimationFrame = (id: number) => {
  window.clearTimeout(id);
};

// Mock AudioContext
class MockAudioContext {
  createGain() {
    return {
      connect: () => {},
      gain: { value: 1 },
    };
  }
  createBufferSource() {
    return {
      connect: () => {},
      start: () => {},
      stop: () => {},
      buffer: null,
    };
  }
  decodeAudioData() {
    return Promise.resolve(null);
  }
  get destination() {
    return {};
  }
}

(global as unknown as { AudioContext: typeof MockAudioContext }).AudioContext = MockAudioContext;
(window as unknown as { AudioContext: typeof MockAudioContext }).AudioContext = MockAudioContext;
