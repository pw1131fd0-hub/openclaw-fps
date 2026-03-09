import * as CANNON from 'cannon-es';
import { Vector3 } from '@/types/GameTypes';
import { GAME_CONFIG, PLAYER_CONFIG } from '@/data/Config';

export interface RaycastResult {
  hit: boolean;
  body?: CANNON.Body;
  point?: Vector3;
  normal?: Vector3;
  distance?: number;
}

// Collision groups
export const COLLISION_GROUPS = {
  WORLD: 1,
  PLAYER: 2,
  ENEMY: 4,
  PROJECTILE: 8,
  PICKUP: 16,
};

export class Physics {
  public readonly world: CANNON.World;
  private bodies: Map<number, CANNON.Body> = new Map();
  private nextBodyId: number = 0;

  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, GAME_CONFIG.gravity, 0);
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = true;
    this.world.defaultContactMaterial.friction = 0.0;
    this.world.defaultContactMaterial.restitution = 0.0;
  }

  public step(delta: number): void {
    const fixedTimeStep = GAME_CONFIG.physicsStepSize;
    const maxSubSteps = 3;
    this.world.step(fixedTimeStep, delta, maxSubSteps);
  }

  public addBody(body: CANNON.Body): number {
    const id = this.nextBodyId++;
    body.id = id;
    this.bodies.set(id, body);
    this.world.addBody(body);
    return id;
  }

  public removeBody(body: CANNON.Body): void {
    this.bodies.delete(body.id);
    this.world.removeBody(body);
  }

  public getBody(id: number): CANNON.Body | undefined {
    return this.bodies.get(id);
  }

  public raycast(
    from: Vector3,
    to: Vector3,
    options: { collisionFilterMask?: number; skipBackfaces?: boolean } = {}
  ): RaycastResult {
    const rayFrom = new CANNON.Vec3(from.x, from.y, from.z);
    const rayTo = new CANNON.Vec3(to.x, to.y, to.z);

    const result = new CANNON.RaycastResult();
    const ray = new CANNON.Ray(rayFrom, rayTo);
    
    ray.intersectWorld(this.world, {
      mode: CANNON.Ray.CLOSEST,
      result: result,
      skipBackfaces: options.skipBackfaces !== undefined ? options.skipBackfaces : true,
      collisionFilterMask: options.collisionFilterMask !== undefined ? options.collisionFilterMask : -1,
    });

    if (result.hasHit) {
      return {
        hit: true,
        body: result.body!,
        point: {
          x: result.hitPointWorld.x,
          y: result.hitPointWorld.y,
          z: result.hitPointWorld.z,
        },
        normal: {
          x: result.hitNormalWorld.x,
          y: result.hitNormalWorld.y,
          z: result.hitNormalWorld.z,
        },
        distance: result.distance,
      };
    }

    return { hit: false };
  }

  public raycastAll(
    from: Vector3,
    to: Vector3,
    options: { collisionFilterMask?: number; skipBackfaces?: boolean } = {}
  ): RaycastResult[] {
    const rayFrom = new CANNON.Vec3(from.x, from.y, from.z);
    const rayTo = new CANNON.Vec3(to.x, to.y, to.z);
    const results: RaycastResult[] = [];

    const ray = new CANNON.Ray(rayFrom, rayTo);
    ray.intersectWorld(this.world, {
      mode: CANNON.Ray.ALL,
      skipBackfaces: options.skipBackfaces !== undefined ? options.skipBackfaces : true,
      collisionFilterMask: options.collisionFilterMask !== undefined ? options.collisionFilterMask : -1,
      callback: (result: CANNON.RaycastResult) => {
        results.push({
          hit: true,
          body: result.body!,
          point: {
            x: result.hitPointWorld.x,
            y: result.hitPointWorld.y,
            z: result.hitPointWorld.z,
          },
          normal: {
            x: result.hitNormalWorld.x,
            y: result.hitNormalWorld.y,
            z: result.hitNormalWorld.z,
          },
          distance: result.distance,
        });
      },
    });

    return results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  public createPlayerBody(position: Vector3): CANNON.Body {
    const shape = new CANNON.Cylinder(
      PLAYER_CONFIG.radius,
      PLAYER_CONFIG.radius,
      PLAYER_CONFIG.height,
      8
    );

    const body = new CANNON.Body({
      mass: 80,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      fixedRotation: true,
      linearDamping: 0.1,
      angularDamping: 1.0,
      allowSleep: false,
      collisionFilterGroup: COLLISION_GROUPS.PLAYER,
      collisionFilterMask: COLLISION_GROUPS.WORLD | COLLISION_GROUPS.ENEMY,
    });

    const quaternion = new CANNON.Quaternion();
    quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    body.addShape(shape, new CANNON.Vec3(0, 0, 0), quaternion);

    return body;
  }

  public createEnemyBody(position: Vector3, radius: number = 0.5, height: number = 1.8): CANNON.Body {
    const shape = new CANNON.Cylinder(radius, radius, height, 8);

    const body = new CANNON.Body({
      mass: 50,
      position: new CANNON.Vec3(position.x, position.y + height / 2, position.z),
      fixedRotation: true,
      linearDamping: 0.1,
      collisionFilterGroup: COLLISION_GROUPS.ENEMY,
      collisionFilterMask: COLLISION_GROUPS.WORLD | COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.ENEMY,
    });

    const quaternion = new CANNON.Quaternion();
    quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    body.addShape(shape, new CANNON.Vec3(0, 0, 0), quaternion);

    return body;
  }

  public createStaticBox(
    position: Vector3,
    size: { width: number; height: number; depth: number }
  ): CANNON.Body {
    const shape = new CANNON.Box(
      new CANNON.Vec3(size.width / 2, size.height / 2, size.depth / 2)
    );

    const body = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      shape: shape,
      collisionFilterGroup: COLLISION_GROUPS.WORLD,
      collisionFilterMask: COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.ENEMY,
    });

    return body;
  }

  public createGroundPlane(): CANNON.Body {
    const shape = new CANNON.Plane();
    const body = new CANNON.Body({
      mass: 0,
      shape: shape,
      collisionFilterGroup: COLLISION_GROUPS.WORLD,
      collisionFilterMask: COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.ENEMY,
    });
    body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    return body;
  }

  public dispose(): void {
    this.bodies.forEach((body) => {
      this.world.removeBody(body);
    });
    this.bodies.clear();
  }
}
