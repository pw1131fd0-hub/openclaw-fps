import * as THREE from 'three';
import { Physics } from '@/engine/Physics';
import { COLORS, ARENA_MAP } from '@/data/Config';
import { Vector3 } from '@/types/GameTypes';

export interface ArenaObject {
  mesh: THREE.Mesh;
  bodyId: number;
}

export class Arena {
  private objects: ArenaObject[] = [];
  private pickupSpawnPoints: Vector3[] = [];

  constructor(
    private scene: THREE.Scene,
    private physics: Physics
  ) {}

  public build(): void {
    this.createGround();
    this.createWalls();
    this.createObstacles();
    this.createPlatforms();
    this.pickupSpawnPoints = [...ARENA_MAP.pickupSpawns];
  }

  private createGround(): void {
    // Visual ground
    const groundGeometry = new THREE.PlaneGeometry(60, 60, 20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.surface,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Add grid lines for sci-fi look
    const gridHelper = new THREE.GridHelper(60, 30, COLORS.primary, 0x1a1f2e);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);

    // Physics ground
    const groundBody = this.physics.createGroundPlane();
    this.physics.addBody(groundBody);
  }

  private createWalls(): void {
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.surface,
      roughness: 0.6,
      metalness: 0.4,
    });

    const wallHeight = 8;
    const arenaSize = 30;
    const wallThickness = 1;

    const walls = [
      { pos: { x: 0, y: wallHeight / 2, z: arenaSize }, size: { w: arenaSize * 2 + wallThickness, h: wallHeight, d: wallThickness } },
      { pos: { x: 0, y: wallHeight / 2, z: -arenaSize }, size: { w: arenaSize * 2 + wallThickness, h: wallHeight, d: wallThickness } },
      { pos: { x: arenaSize, y: wallHeight / 2, z: 0 }, size: { w: wallThickness, h: wallHeight, d: arenaSize * 2 + wallThickness } },
      { pos: { x: -arenaSize, y: wallHeight / 2, z: 0 }, size: { w: wallThickness, h: wallHeight, d: arenaSize * 2 + wallThickness } },
    ];

    walls.forEach((wall) => {
      const geometry = new THREE.BoxGeometry(wall.size.w, wall.size.h, wall.size.d);
      const mesh = new THREE.Mesh(geometry, wallMaterial);
      mesh.position.set(wall.pos.x, wall.pos.y, wall.pos.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      const body = this.physics.createStaticBox(wall.pos, {
        width: wall.size.w,
        height: wall.size.h,
        depth: wall.size.d,
      });
      const bodyId = this.physics.addBody(body);
      this.objects.push({ mesh, bodyId });

      // Add glowing edge at top
      this.addGlowingEdge(mesh, wall.size.w, wall.size.d);
    });
  }

  private addGlowingEdge(parent: THREE.Mesh, width: number, depth: number): void {
    const edgeGeometry = new THREE.BoxGeometry(width + 0.1, 0.1, depth + 0.1);
    const edgeMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.primary,
      transparent: true,
      opacity: 0.8,
    });
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    const boxGeometry = parent.geometry as THREE.BoxGeometry;
    edge.position.y = boxGeometry.parameters.height / 2;
    parent.add(edge);
  }

  private createObstacles(): void {
    const obstacleMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a3040,
      roughness: 0.5,
      metalness: 0.6,
    });

    // Cover boxes around the arena
    const covers = [
      { pos: { x: 10, y: 1.5, z: 10 }, size: { w: 3, h: 3, d: 3 } },
      { pos: { x: -10, y: 1.5, z: 10 }, size: { w: 3, h: 3, d: 3 } },
      { pos: { x: 10, y: 1.5, z: -10 }, size: { w: 3, h: 3, d: 3 } },
      { pos: { x: -10, y: 1.5, z: -10 }, size: { w: 3, h: 3, d: 3 } },
      { pos: { x: 0, y: 1, z: 15 }, size: { w: 6, h: 2, d: 1.5 } },
      { pos: { x: 0, y: 1, z: -15 }, size: { w: 6, h: 2, d: 1.5 } },
      { pos: { x: 15, y: 1, z: 0 }, size: { w: 1.5, h: 2, d: 6 } },
      { pos: { x: -15, y: 1, z: 0 }, size: { w: 1.5, h: 2, d: 6 } },
      // Central pillars
      { pos: { x: 5, y: 2, z: 0 }, size: { w: 2, h: 4, d: 2 } },
      { pos: { x: -5, y: 2, z: 0 }, size: { w: 2, h: 4, d: 2 } },
      { pos: { x: 0, y: 2, z: 5 }, size: { w: 2, h: 4, d: 2 } },
      { pos: { x: 0, y: 2, z: -5 }, size: { w: 2, h: 4, d: 2 } },
    ];

    covers.forEach((cover) => {
      const geometry = new THREE.BoxGeometry(cover.size.w, cover.size.h, cover.size.d);
      const mesh = new THREE.Mesh(geometry, obstacleMaterial);
      mesh.position.set(cover.pos.x, cover.pos.y, cover.pos.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      const body = this.physics.createStaticBox(cover.pos, {
        width: cover.size.w,
        height: cover.size.h,
        depth: cover.size.d,
      });
      const bodyId = this.physics.addBody(body);
      this.objects.push({ mesh, bodyId });
    });
  }

  private createPlatforms(): void {
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a4050,
      roughness: 0.4,
      metalness: 0.7,
    });

    // Elevated platforms with ramps
    const platforms = [
      { pos: { x: 20, y: 2, z: 0 }, size: { w: 8, h: 0.5, d: 8 } },
      { pos: { x: -20, y: 2, z: 0 }, size: { w: 8, h: 0.5, d: 8 } },
      { pos: { x: 0, y: 3, z: 20 }, size: { w: 10, h: 0.5, d: 6 } },
      { pos: { x: 0, y: 3, z: -20 }, size: { w: 10, h: 0.5, d: 6 } },
    ];

    platforms.forEach((platform) => {
      const geometry = new THREE.BoxGeometry(
        platform.size.w,
        platform.size.h,
        platform.size.d
      );
      const mesh = new THREE.Mesh(geometry, platformMaterial);
      mesh.position.set(platform.pos.x, platform.pos.y, platform.pos.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      const body = this.physics.createStaticBox(platform.pos, {
        width: platform.size.w,
        height: platform.size.h,
        depth: platform.size.d,
      });
      const bodyId = this.physics.addBody(body);
      this.objects.push({ mesh, bodyId });

      // Add glowing edge
      const edgeGeometry = new THREE.BoxGeometry(
        platform.size.w + 0.1,
        0.05,
        platform.size.d + 0.1
      );
      const edgeMaterial = new THREE.MeshBasicMaterial({
        color: COLORS.accent,
        transparent: true,
        opacity: 0.6,
      });
      const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
      edge.position.y = platform.size.h / 2;
      mesh.add(edge);
    });
  }

  public getPickupSpawnPoints(): Vector3[] {
    return this.pickupSpawnPoints;
  }

  public getEnemySpawnPoints(): Vector3[] {
    return ARENA_MAP.enemySpawns.map((spawn) => spawn.position);
  }

  public getPlayerSpawnPoint(): Vector3 {
    return ARENA_MAP.playerSpawn.position;
  }

  public dispose(): void {
    this.objects.forEach((obj) => {
      this.scene.remove(obj.mesh);
      obj.mesh.geometry.dispose();
      if (obj.mesh.material instanceof THREE.Material) {
        obj.mesh.material.dispose();
      }
    });
    this.objects = [];
  }
}
