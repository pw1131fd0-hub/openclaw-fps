import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from '@/utils/EventEmitter';

interface TestEvents {
  testEvent: string;
  numericEvent: number;
  objectEvent: { value: number };
}

describe('EventEmitter', () => {
  let emitter: EventEmitter<TestEvents>;

  beforeEach(() => {
    emitter = new EventEmitter<TestEvents>();
  });

  describe('on', () => {
    it('should register a listener', () => {
      const callback = vi.fn();
      emitter.on('testEvent', callback);
      emitter.emit('testEvent', 'test');
      expect(callback).toHaveBeenCalledWith('test');
    });

    it('should allow multiple listeners for same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      emitter.on('testEvent', callback1);
      emitter.on('testEvent', callback2);
      emitter.emit('testEvent', 'test');
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('should remove a listener', () => {
      const callback = vi.fn();
      emitter.on('testEvent', callback);
      emitter.off('testEvent', callback);
      emitter.emit('testEvent', 'test');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not affect other listeners', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      emitter.on('testEvent', callback1);
      emitter.on('testEvent', callback2);
      emitter.off('testEvent', callback1);
      emitter.emit('testEvent', 'test');
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should handle removing non-existent listener', () => {
      const callback = vi.fn();
      expect(() => emitter.off('testEvent', callback)).not.toThrow();
    });
  });

  describe('emit', () => {
    it('should pass data to listeners', () => {
      const callback = vi.fn();
      emitter.on('numericEvent', callback);
      emitter.emit('numericEvent', 42);
      expect(callback).toHaveBeenCalledWith(42);
    });

    it('should pass object data correctly', () => {
      const callback = vi.fn();
      emitter.on('objectEvent', callback);
      emitter.emit('objectEvent', { value: 123 });
      expect(callback).toHaveBeenCalledWith({ value: 123 });
    });

    it('should not throw if no listeners', () => {
      expect(() => emitter.emit('testEvent', 'test')).not.toThrow();
    });

    it('should catch errors in listeners', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      emitter.on('testEvent', errorCallback);
      emitter.on('testEvent', normalCallback);
      
      expect(() => emitter.emit('testEvent', 'test')).not.toThrow();
      expect(normalCallback).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('once', () => {
    it('should only fire listener once', () => {
      const callback = vi.fn();
      emitter.once('testEvent', callback);
      emitter.emit('testEvent', 'first');
      emitter.emit('testEvent', 'second');
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('first');
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for a specific event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      emitter.on('testEvent', callback1);
      emitter.on('testEvent', callback2);
      emitter.removeAllListeners('testEvent');
      emitter.emit('testEvent', 'test');
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('should remove all listeners when no event specified', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      emitter.on('testEvent', callback1);
      emitter.on('numericEvent', callback2);
      emitter.removeAllListeners();
      emitter.emit('testEvent', 'test');
      emitter.emit('numericEvent', 42);
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });
});
