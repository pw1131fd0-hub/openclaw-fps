import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';

// Mock THREE.js WebGLRenderer
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three');
  
  const MockWebGLRenderer = vi.fn().mockImplementation(() => ({
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
    domElement: document.createElement('canvas'),
    shadowMap: { enabled: false, type: 0 },
    outputColorSpace: '',
    toneMapping: 0,
    toneMappingExposure: 1,
    info: {
      render: {
        calls: 100,
        triangles: 5000,
      }
    }
  }));
  
  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
  };
});

// Import after mocking
import { Renderer } from './Renderer';

describe('Renderer', () => {
  let renderer: Renderer;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
    Object.defineProperty(window, 'devicePixelRatio', { value: 2, writable: true });
    
    renderer = new Renderer(canvas);
  });

  afterEach(() => {
    renderer.dispose();
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create Renderer instance', () => {
      expect(renderer).toBeDefined();
    });

    it('should create scene', () => {
      expect(renderer.scene).toBeDefined();
      expect(renderer.scene).toBeInstanceOf(THREE.Scene);
    });

    it('should create perspective camera', () => {
      expect(renderer.camera).toBeDefined();
      expect(renderer.camera).toBeInstanceOf(THREE.PerspectiveCamera);
    });

    it('should store canvas as domElement', () => {
      expect(renderer.domElement).toBe(canvas);
    });

    it('should set initial camera position', () => {
      expect(renderer.camera.position.y).toBeGreaterThan(0);
    });

    it('should set scene background color', () => {
      expect(renderer.scene.background).toBeDefined();
    });

    it('should add fog to scene', () => {
      expect(renderer.scene.fog).toBeDefined();
    });
  });

  describe('render()', () => {
    it('should not throw when rendering', () => {
      expect(() => renderer.render()).not.toThrow();
    });

    it('should track FPS', () => {
      // Initial FPS
      const fps = renderer.getFPS();
      expect(typeof fps).toBe('number');
    });
  });

  describe('addObject() / removeObject()', () => {
    it('should add object to scene', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      );
      const initialCount = renderer.scene.children.length;
      
      renderer.addObject(mesh);
      
      expect(renderer.scene.children.length).toBe(initialCount + 1);
    });

    it('should remove object from scene', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      );
      renderer.addObject(mesh);
      const countAfterAdd = renderer.scene.children.length;
      
      renderer.removeObject(mesh);
      
      expect(renderer.scene.children.length).toBe(countAfterAdd - 1);
    });
  });

  describe('getDrawCalls()', () => {
    it('should return number of draw calls', () => {
      const drawCalls = renderer.getDrawCalls();
      expect(typeof drawCalls).toBe('number');
    });
  });

  describe('getTriangles()', () => {
    it('should return number of triangles', () => {
      const triangles = renderer.getTriangles();
      expect(typeof triangles).toBe('number');
    });
  });

  describe('getFPS()', () => {
    it('should return FPS as number', () => {
      const fps = renderer.getFPS();
      expect(typeof fps).toBe('number');
      expect(fps).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getDelta()', () => {
    it('should return delta time', () => {
      const delta = renderer.getDelta();
      expect(typeof delta).toBe('number');
    });
  });

  describe('getElapsedTime()', () => {
    it('should return elapsed time', () => {
      const time = renderer.getElapsedTime();
      expect(typeof time).toBe('number');
      expect(time).toBeGreaterThanOrEqual(0);
    });
  });

  describe('resize handling', () => {
    it('should update camera aspect on resize', () => {
      const initialAspect = renderer.camera.aspect;
      
      Object.defineProperty(window, 'innerWidth', { value: 800 });
      Object.defineProperty(window, 'innerHeight', { value: 600 });
      
      window.dispatchEvent(new Event('resize'));
      
      expect(renderer.camera.aspect).toBe(800 / 600);
    });
  });

  describe('dispose()', () => {
    it('should not throw when disposing', () => {
      expect(() => renderer.dispose()).not.toThrow();
    });
  });
});

describe('Renderer lighting', () => {
  let renderer: Renderer;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    renderer = new Renderer(canvas);
  });

  afterEach(() => {
    renderer.dispose();
    document.body.innerHTML = '';
  });

  it('should have ambient light in scene', () => {
    const ambientLight = renderer.scene.children.find(
      child => child instanceof THREE.AmbientLight
    );
    expect(ambientLight).toBeDefined();
  });

  it('should have directional light in scene', () => {
    const directionalLight = renderer.scene.children.find(
      child => child instanceof THREE.DirectionalLight
    );
    expect(directionalLight).toBeDefined();
  });

  it('should have hemisphere light in scene', () => {
    const hemisphereLight = renderer.scene.children.find(
      child => child instanceof THREE.HemisphereLight
    );
    expect(hemisphereLight).toBeDefined();
  });

  it('should have point lights for atmosphere', () => {
    const pointLights = renderer.scene.children.filter(
      child => child instanceof THREE.PointLight
    );
    expect(pointLights.length).toBeGreaterThanOrEqual(2);
  });
});
