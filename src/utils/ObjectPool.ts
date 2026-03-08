export class ObjectPool<T> {
  private available: T[] = [];
  private active: Set<T> = new Set();
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize: number = 0
  ) {
    this.factory = factory;
    this.reset = reset;

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }
  }

  acquire(): T {
    let obj: T;
    if (this.available.length > 0) {
      obj = this.available.pop()!;
    } else {
      obj = this.factory();
    }
    this.active.add(obj);
    return obj;
  }

  release(obj: T): void {
    if (this.active.has(obj)) {
      this.active.delete(obj);
      this.reset(obj);
      this.available.push(obj);
    }
  }

  releaseAll(): void {
    this.active.forEach((obj) => {
      this.reset(obj);
      this.available.push(obj);
    });
    this.active.clear();
  }

  getActiveCount(): number {
    return this.active.size;
  }

  getAvailableCount(): number {
    return this.available.length;
  }

  forEach(callback: (obj: T) => void): void {
    this.active.forEach(callback);
  }

  filter(predicate: (obj: T) => boolean): T[] {
    const result: T[] = [];
    this.active.forEach((obj) => {
      if (predicate(obj)) {
        result.push(obj);
      }
    });
    return result;
  }
}
