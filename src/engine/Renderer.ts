import * as THREE from 'three';
import { COLORS } from '@/data/Config';

export class Renderer {
  public readonly scene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly domElement: HTMLCanvasElement;

  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private frameCount: number = 0;
  private lastFPSUpdate: number = 0;
  private currentFPS: number = 60;
  private mainLight: THREE.DirectionalLight | null = null;
  private boundOnResize: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.domElement = canvas;
    this.clock = new THREE.Clock();
    this.boundOnResize = this.onResize.bind(this);

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.background);
    this.scene.fog = new THREE.Fog(COLORS.background, 10, 80);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1.8, 0);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.domElement,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Setup lighting
    this.setupLighting();

    // Handle resize
    window.addEventListener('resize', this.boundOnResize);
  }

  public setQuality(quality: 'low' | 'medium' | 'high'): void {
    if (!this.mainLight) return;

    switch (quality) {
      case 'low':
        this.renderer.shadowMap.enabled = false;
        this.renderer.setPixelRatio(1);
        this.mainLight.castShadow = false;
        break;
      case 'medium':
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.mainLight.castShadow = true;
        this.mainLight.shadow.mapSize.set(1024, 1024);
        if (this.mainLight.shadow.map) {
          this.mainLight.shadow.map.dispose();
          // @ts-ignore - internal Three.js property
          this.mainLight.shadow.map = null;
        }
        break;
      case 'high':
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.mainLight.castShadow = true;
        this.mainLight.shadow.mapSize.set(2048, 2048);
        if (this.mainLight.shadow.map) {
          this.mainLight.shadow.map.dispose();
          // @ts-ignore - internal Three.js property
          this.mainLight.shadow.map = null;
        }
        break;
    }
    this.renderer.shadowMap.needsUpdate = true;
  }

  private setupLighting(): void {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x404050, 0.5);
    this.scene.add(ambient);

    // Main directional light (sun-like)
    const directional = new THREE.DirectionalLight(0xffffff, 1.0);
    directional.position.set(20, 30, 10);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    directional.shadow.camera.near = 0.5;
    directional.shadow.camera.far = 100;
    directional.shadow.camera.left = -40;
    directional.shadow.camera.right = 40;
    directional.shadow.camera.top = 40;
    directional.shadow.camera.bottom = -40;
    this.scene.add(directional);
    this.mainLight = directional;

    // Hemisphere light for more natural ambient
    const hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x444444, 0.3);
    this.scene.add(hemisphere);

    // Add some colored point lights for atmosphere
    const pointLight1 = new THREE.PointLight(COLORS.primary, 0.5, 30);
    pointLight1.position.set(15, 5, 15);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(COLORS.secondary, 0.5, 30);
    pointLight2.position.set(-15, 5, -15);
    this.scene.add(pointLight2);
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
    this.updateFPS();
  }

  private updateFPS(): void {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFPSUpdate >= 1000) {
      this.currentFPS = this.frameCount;
      this.frameCount = 0;
      this.lastFPSUpdate = now;
    }
  }

  private onResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public addObject(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  public removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  public getDrawCalls(): number {
    return this.renderer.info.render.calls;
  }

  public getTriangles(): number {
    return this.renderer.info.render.triangles;
  }

  public getFPS(): number {
    return this.currentFPS;
  }

  public getDelta(): number {
    return this.clock.getDelta();
  }

  public getElapsedTime(): number {
    return this.clock.getElapsedTime();
  }

  public dispose(): void {
    window.removeEventListener('resize', this.boundOnResize);
    this.renderer.dispose();
  }
}
