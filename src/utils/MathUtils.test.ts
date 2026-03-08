import { describe, it, expect } from 'vitest';
import {
  clamp,
  lerp,
  lerpVector3,
  distance,
  distanceSquared,
  distance2D,
  normalize,
  magnitude,
  add,
  subtract,
  multiply,
  dot,
  cross,
  randomRange,
  randomInt,
  angleBetween,
  directionTo,
  rotateY,
  smoothDamp,
  generateUUID,
  shuffleArray,
  randomElement,
  PI,
  TWO_PI,
  HALF_PI,
  DEG_TO_RAD,
  RAD_TO_DEG,
} from '@/utils/MathUtils';
import { Vector3 } from '@/types/GameTypes';

describe('MathUtils', () => {
  describe('Constants', () => {
    it('should have correct PI value', () => {
      expect(PI).toBeCloseTo(Math.PI);
    });

    it('should have correct TWO_PI value', () => {
      expect(TWO_PI).toBeCloseTo(Math.PI * 2);
    });

    it('should have correct HALF_PI value', () => {
      expect(HALF_PI).toBeCloseTo(Math.PI / 2);
    });

    it('should have correct DEG_TO_RAD value', () => {
      expect(DEG_TO_RAD).toBeCloseTo(Math.PI / 180);
      expect(90 * DEG_TO_RAD).toBeCloseTo(Math.PI / 2);
    });

    it('should have correct RAD_TO_DEG value', () => {
      expect(RAD_TO_DEG).toBeCloseTo(180 / Math.PI);
      expect(Math.PI * RAD_TO_DEG).toBeCloseTo(180);
    });
  });

  describe('clamp', () => {
    it('should return value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('should return min when value is below range', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should return max when value is above range', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle equal min and max', () => {
      expect(clamp(5, 3, 3)).toBe(3);
    });
  });

  describe('lerp', () => {
    it('should return a when t is 0', () => {
      expect(lerp(0, 10, 0)).toBe(0);
    });

    it('should return b when t is 1', () => {
      expect(lerp(0, 10, 1)).toBe(10);
    });

    it('should return midpoint when t is 0.5', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
    });

    it('should handle negative values', () => {
      expect(lerp(-10, 10, 0.5)).toBe(0);
    });
  });

  describe('lerpVector3', () => {
    it('should interpolate all components', () => {
      const a: Vector3 = { x: 0, y: 0, z: 0 };
      const b: Vector3 = { x: 10, y: 20, z: 30 };
      const result = lerpVector3(a, b, 0.5);
      expect(result.x).toBe(5);
      expect(result.y).toBe(10);
      expect(result.z).toBe(15);
    });

    it('should return a when t is 0', () => {
      const a: Vector3 = { x: 1, y: 2, z: 3 };
      const b: Vector3 = { x: 10, y: 20, z: 30 };
      const result = lerpVector3(a, b, 0);
      expect(result).toEqual(a);
    });
  });

  describe('distance', () => {
    it('should calculate distance between two points', () => {
      const a: Vector3 = { x: 0, y: 0, z: 0 };
      const b: Vector3 = { x: 3, y: 4, z: 0 };
      expect(distance(a, b)).toBe(5);
    });

    it('should return 0 for same point', () => {
      const a: Vector3 = { x: 5, y: 5, z: 5 };
      expect(distance(a, a)).toBe(0);
    });

    it('should work with 3D points', () => {
      const a: Vector3 = { x: 0, y: 0, z: 0 };
      const b: Vector3 = { x: 1, y: 2, z: 2 };
      expect(distance(a, b)).toBe(3);
    });
  });

  describe('distanceSquared', () => {
    it('should return squared distance', () => {
      const a: Vector3 = { x: 0, y: 0, z: 0 };
      const b: Vector3 = { x: 3, y: 4, z: 0 };
      expect(distanceSquared(a, b)).toBe(25);
    });
  });

  describe('distance2D', () => {
    it('should ignore y component', () => {
      const a: Vector3 = { x: 0, y: 100, z: 0 };
      const b: Vector3 = { x: 3, y: 0, z: 4 };
      expect(distance2D(a, b)).toBe(5);
    });
  });

  describe('normalize', () => {
    it('should normalize a vector to unit length', () => {
      const v: Vector3 = { x: 3, y: 0, z: 4 };
      const result = normalize(v);
      expect(result.x).toBeCloseTo(0.6);
      expect(result.y).toBe(0);
      expect(result.z).toBeCloseTo(0.8);
      expect(magnitude(result)).toBeCloseTo(1);
    });

    it('should handle zero vector', () => {
      const v: Vector3 = { x: 0, y: 0, z: 0 };
      const result = normalize(v);
      expect(result).toEqual({ x: 0, y: 0, z: 0 });
    });
  });

  describe('magnitude', () => {
    it('should calculate vector length', () => {
      const v: Vector3 = { x: 3, y: 4, z: 0 };
      expect(magnitude(v)).toBe(5);
    });

    it('should return 0 for zero vector', () => {
      const v: Vector3 = { x: 0, y: 0, z: 0 };
      expect(magnitude(v)).toBe(0);
    });
  });

  describe('add', () => {
    it('should add two vectors', () => {
      const a: Vector3 = { x: 1, y: 2, z: 3 };
      const b: Vector3 = { x: 4, y: 5, z: 6 };
      const result = add(a, b);
      expect(result).toEqual({ x: 5, y: 7, z: 9 });
    });
  });

  describe('subtract', () => {
    it('should subtract two vectors', () => {
      const a: Vector3 = { x: 5, y: 7, z: 9 };
      const b: Vector3 = { x: 4, y: 5, z: 6 };
      const result = subtract(a, b);
      expect(result).toEqual({ x: 1, y: 2, z: 3 });
    });
  });

  describe('multiply', () => {
    it('should multiply vector by scalar', () => {
      const v: Vector3 = { x: 1, y: 2, z: 3 };
      const result = multiply(v, 2);
      expect(result).toEqual({ x: 2, y: 4, z: 6 });
    });

    it('should handle zero scalar', () => {
      const v: Vector3 = { x: 1, y: 2, z: 3 };
      const result = multiply(v, 0);
      expect(result).toEqual({ x: 0, y: 0, z: 0 });
    });
  });

  describe('dot', () => {
    it('should calculate dot product', () => {
      const a: Vector3 = { x: 1, y: 2, z: 3 };
      const b: Vector3 = { x: 4, y: 5, z: 6 };
      expect(dot(a, b)).toBe(32);
    });

    it('should return 0 for perpendicular vectors', () => {
      const a: Vector3 = { x: 1, y: 0, z: 0 };
      const b: Vector3 = { x: 0, y: 1, z: 0 };
      expect(dot(a, b)).toBe(0);
    });
  });

  describe('cross', () => {
    it('should calculate cross product', () => {
      const a: Vector3 = { x: 1, y: 0, z: 0 };
      const b: Vector3 = { x: 0, y: 1, z: 0 };
      const result = cross(a, b);
      expect(result).toEqual({ x: 0, y: 0, z: 1 });
    });

    it('should return zero for parallel vectors', () => {
      const a: Vector3 = { x: 1, y: 0, z: 0 };
      const b: Vector3 = { x: 2, y: 0, z: 0 };
      const result = cross(a, b);
      expect(result).toEqual({ x: 0, y: 0, z: 0 });
    });
  });

  describe('randomRange', () => {
    it('should return value within range', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomRange(5, 10);
        expect(result).toBeGreaterThanOrEqual(5);
        expect(result).toBeLessThan(10);
      }
    });

    it('should return min when min equals max', () => {
      const result = randomRange(5, 5);
      expect(result).toBe(5);
    });
  });

  describe('randomInt', () => {
    it('should return integer within range', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomInt(1, 10);
        expect(Number.isInteger(result)).toBe(true);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('randomElement', () => {
    it('should return an element from the array', () => {
      const arr = [1, 2, 3, 4, 5];
      for (let i = 0; i < 50; i++) {
        const result = randomElement(arr);
        expect(arr).toContain(result);
      }
    });
  });

  describe('shuffleArray', () => {
    it('should return array with same elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(arr);
      expect(shuffled.length).toBe(arr.length);
      expect(shuffled.sort()).toEqual(arr.sort());
    });

    it('should not modify original array', () => {
      const arr = [1, 2, 3, 4, 5];
      const original = [...arr];
      shuffleArray(arr);
      expect(arr).toEqual(original);
    });
  });

  describe('angleBetween', () => {
    it('should return 0 for parallel vectors', () => {
      const a: Vector3 = { x: 1, y: 0, z: 0 };
      const b: Vector3 = { x: 2, y: 0, z: 0 };
      expect(angleBetween(a, b)).toBeCloseTo(0);
    });

    it('should return PI/2 for perpendicular vectors', () => {
      const a: Vector3 = { x: 1, y: 0, z: 0 };
      const b: Vector3 = { x: 0, y: 1, z: 0 };
      expect(angleBetween(a, b)).toBeCloseTo(Math.PI / 2);
    });

    it('should return PI for opposite vectors', () => {
      const a: Vector3 = { x: 1, y: 0, z: 0 };
      const b: Vector3 = { x: -1, y: 0, z: 0 };
      expect(angleBetween(a, b)).toBeCloseTo(Math.PI);
    });
  });

  describe('directionTo', () => {
    it('should return normalized direction vector', () => {
      const from: Vector3 = { x: 0, y: 0, z: 0 };
      const to: Vector3 = { x: 3, y: 0, z: 4 };
      const result = directionTo(from, to);
      expect(result.x).toBeCloseTo(0.6);
      expect(result.y).toBe(0);
      expect(result.z).toBeCloseTo(0.8);
    });
  });

  describe('rotateY', () => {
    it('should rotate vector around Y axis', () => {
      const v: Vector3 = { x: 1, y: 0, z: 0 };
      const result = rotateY(v, Math.PI / 2);
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBe(0);
      expect(result.z).toBeCloseTo(1);
    });

    it('should not change Y component', () => {
      const v: Vector3 = { x: 1, y: 5, z: 0 };
      const result = rotateY(v, Math.PI / 4);
      expect(result.y).toBe(5);
    });
  });

  describe('smoothDamp', () => {
    it('should move towards target', () => {
      const velocity = { value: 0 };
      const result = smoothDamp(0, 10, velocity, 0.3, 0.016);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(10);
    });

    it('should converge to target over time', () => {
      let current = 0;
      const velocity = { value: 0 };
      for (let i = 0; i < 100; i++) {
        current = smoothDamp(current, 10, velocity, 0.3, 0.016);
      }
      expect(current).toBeCloseTo(10, 1);
    });
  });

  describe('generateUUID', () => {
    it('should return a valid UUID format', () => {
      const uuid = generateUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const uuids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUUID());
      }
      expect(uuids.size).toBe(100);
    });
  });
});
