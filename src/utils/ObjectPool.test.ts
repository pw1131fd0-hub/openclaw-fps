import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectPool } from '@/utils/ObjectPool';

interface TestObject {
  id: number;
  value: string;
  active: boolean;
}

describe('ObjectPool', () => {
  let factory: () => TestObject;
  let reset: (obj: TestObject) => void;
  let idCounter: number;

  beforeEach(() => {
    idCounter = 0;
    factory = vi.fn(() => ({
      id: ++idCounter,
      value: '',
      active: false,
    }));
    reset = vi.fn((obj: TestObject) => {
      obj.value = '';
      obj.active = false;
    });
  });

  describe('constructor', () => {
    it('should create pool with initial size', () => {
      const pool = new ObjectPool(factory, reset, 5);
      expect(factory).toHaveBeenCalledTimes(5);
      expect(pool.getAvailableCount()).toBe(5);
      expect(pool.getActiveCount()).toBe(0);
    });

    it('should create empty pool when no initial size', () => {
      const pool = new ObjectPool(factory, reset);
      expect(factory).not.toHaveBeenCalled();
      expect(pool.getAvailableCount()).toBe(0);
    });
  });

  describe('acquire', () => {
    it('should return object from pool', () => {
      const pool = new ObjectPool(factory, reset, 2);
      const obj = pool.acquire();
      expect(obj).toBeDefined();
      expect(obj.id).toBe(2); // Last pre-created object
      expect(pool.getAvailableCount()).toBe(1);
      expect(pool.getActiveCount()).toBe(1);
    });

    it('should create new object when pool is empty', () => {
      const pool = new ObjectPool(factory, reset);
      const obj = pool.acquire();
      expect(factory).toHaveBeenCalledTimes(1);
      expect(obj.id).toBe(1);
    });

    it('should track multiple acquired objects', () => {
      const pool = new ObjectPool(factory, reset);
      pool.acquire();
      pool.acquire();
      pool.acquire();
      expect(pool.getActiveCount()).toBe(3);
    });
  });

  describe('release', () => {
    it('should return object to pool', () => {
      const pool = new ObjectPool(factory, reset);
      const obj = pool.acquire();
      pool.release(obj);
      expect(reset).toHaveBeenCalledWith(obj);
      expect(pool.getAvailableCount()).toBe(1);
      expect(pool.getActiveCount()).toBe(0);
    });

    it('should not release object not in pool', () => {
      const pool = new ObjectPool(factory, reset);
      const foreignObj: TestObject = { id: 999, value: 'foreign', active: true };
      pool.release(foreignObj);
      expect(reset).not.toHaveBeenCalled();
      expect(pool.getAvailableCount()).toBe(0);
    });

    it('should reuse released objects', () => {
      const pool = new ObjectPool(factory, reset);
      const obj1 = pool.acquire();
      obj1.value = 'modified';
      pool.release(obj1);
      
      const obj2 = pool.acquire();
      expect(obj2).toBe(obj1);
      expect(obj2.value).toBe(''); // Reset was called
    });
  });

  describe('releaseAll', () => {
    it('should release all active objects', () => {
      const pool = new ObjectPool(factory, reset);
      const obj1 = pool.acquire();
      const obj2 = pool.acquire();
      const obj3 = pool.acquire();
      
      pool.releaseAll();
      
      expect(reset).toHaveBeenCalledTimes(3);
      expect(pool.getActiveCount()).toBe(0);
      expect(pool.getAvailableCount()).toBe(3);
    });
  });

  describe('forEach', () => {
    it('should iterate over active objects', () => {
      const pool = new ObjectPool(factory, reset);
      pool.acquire();
      pool.acquire();
      pool.acquire();
      
      const callback = vi.fn();
      pool.forEach(callback);
      
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should not iterate over released objects', () => {
      const pool = new ObjectPool(factory, reset);
      const obj1 = pool.acquire();
      pool.acquire();
      pool.release(obj1);
      
      const callback = vi.fn();
      pool.forEach(callback);
      
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('filter', () => {
    it('should filter active objects', () => {
      const pool = new ObjectPool(factory, reset);
      const obj1 = pool.acquire();
      const obj2 = pool.acquire();
      const obj3 = pool.acquire();
      
      obj1.active = true;
      obj3.active = true;
      
      const result = pool.filter((obj) => obj.active);
      expect(result.length).toBe(2);
      expect(result).toContain(obj1);
      expect(result).toContain(obj3);
      expect(result).not.toContain(obj2);
    });
  });
});
