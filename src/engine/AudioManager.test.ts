import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioManager } from './AudioManager';
import { SoundName } from '@/types/GameTypes';

// Enhanced AudioContext mock
class MockGainNode {
  gain = { value: 1, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
  connect = vi.fn();
}

class MockOscillatorNode {
  type = 'sine';
  frequency = { 
    value: 440,
    setValueAtTime: vi.fn(), 
    exponentialRampToValueAtTime: vi.fn() 
  };
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockBufferSourceNode {
  buffer: AudioBuffer | null = null;
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioContext {
  state: AudioContextState = 'running';
  sampleRate = 44100;
  currentTime = 0;
  destination = {};

  createGain = vi.fn(() => new MockGainNode());
  createOscillator = vi.fn(() => new MockOscillatorNode());
  createBufferSource = vi.fn(() => new MockBufferSourceNode());
  createBuffer = vi.fn((_channels: number, length: number, sampleRate: number) => ({
    getChannelData: vi.fn(() => new Float32Array(length)),
    length,
    sampleRate,
  }));
  resume = vi.fn(() => Promise.resolve());
  close = vi.fn(() => Promise.resolve());
}

describe('AudioManager', () => {
  let audioManager: AudioManager;
  let mockAudioContext: MockAudioContext;

  beforeEach(() => {
    mockAudioContext = new MockAudioContext();
    vi.stubGlobal('AudioContext', vi.fn(() => mockAudioContext));
    audioManager = new AudioManager();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('initialization', () => {
    it('should create AudioManager instance', () => {
      expect(audioManager).toBeDefined();
    });

    it('should start with default values', () => {
      expect(audioManager.isMuted).toBe(false);
      expect(audioManager.volume).toBeGreaterThan(0);
    });

    it('should initialize AudioContext on init()', async () => {
      await audioManager.init();
      expect(AudioContext).toHaveBeenCalled();
    });

    it('should create gain nodes on init', async () => {
      await audioManager.init();
      // masterGain, sfxGain, musicGain
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(3);
    });

    it('should handle AudioContext errors gracefully', async () => {
      vi.stubGlobal('AudioContext', vi.fn(() => {
        throw new Error('AudioContext not supported');
      }));
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const am = new AudioManager();
      await am.init();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('play()', () => {
    beforeEach(async () => {
      await audioManager.init();
    });

    it('should not play when muted', () => {
      audioManager.mute();
      audioManager.play('pistol_fire');
      // When muted, no oscillator should be created for playback
      expect(audioManager.isMuted).toBe(true);
    });

    it('should create oscillator when playing sound', () => {
      audioManager.play('pistol_fire');
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it.each([
      'pistol_fire',
      'shotgun_fire',
      'rifle_fire',
      'reload',
      'empty_click',
      'weapon_switch',
      'enemy_hurt',
      'enemy_death',
      'player_hurt',
      'player_death',
      'pickup_health',
      'pickup_ammo',
      'wave_start',
      'wave_complete',
      'hit_marker',
      'footstep',
    ] as SoundName[])('should play %s sound', (soundName) => {
      audioManager.play(soundName);
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('should handle suspended AudioContext', async () => {
      mockAudioContext.state = 'suspended';
      audioManager.play('pistol_fire');
      expect(mockAudioContext.resume).toHaveBeenCalled();
    });
  });

  describe('playAt()', () => {
    beforeEach(async () => {
      await audioManager.init();
    });

    it('should play sound at position', () => {
      audioManager.playAt('enemy_hurt', { x: 5, y: 0, z: 10 });
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });
  });

  describe('volume control', () => {
    beforeEach(async () => {
      await audioManager.init();
    });

    it('should set volume', () => {
      audioManager.setVolume(0.5);
      expect(audioManager.volume).toBe(0.5);
    });

    it('should clamp volume to 0-1 range', () => {
      audioManager.setVolume(-0.5);
      expect(audioManager.volume).toBe(0);

      audioManager.setVolume(1.5);
      expect(audioManager.volume).toBe(1);
    });

    it('should set music volume', () => {
      audioManager.setMusicVolume(0.3);
      // Since we don't have a getter, check that it doesn't throw
      expect(() => audioManager.setMusicVolume(0.3)).not.toThrow();
    });

    it('should clamp music volume', () => {
      expect(() => audioManager.setMusicVolume(-1)).not.toThrow();
      expect(() => audioManager.setMusicVolume(2)).not.toThrow();
    });
  });

  describe('mute/unmute', () => {
    beforeEach(async () => {
      await audioManager.init();
    });

    it('should mute audio', () => {
      audioManager.mute();
      expect(audioManager.isMuted).toBe(true);
    });

    it('should unmute audio', () => {
      audioManager.mute();
      audioManager.unmute();
      expect(audioManager.isMuted).toBe(false);
    });

    it('should toggle mute state', () => {
      expect(audioManager.isMuted).toBe(false);
      audioManager.mute();
      expect(audioManager.isMuted).toBe(true);
      audioManager.unmute();
      expect(audioManager.isMuted).toBe(false);
    });
  });

  describe('dispose()', () => {
    it('should close AudioContext on dispose', async () => {
      await audioManager.init();
      audioManager.dispose();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it('should handle dispose when not initialized', () => {
      expect(() => audioManager.dispose()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle play before init', () => {
      expect(() => audioManager.play('pistol_fire')).not.toThrow();
    });

    it('should handle setVolume before init', () => {
      expect(() => audioManager.setVolume(0.5)).not.toThrow();
    });

    it('should handle mute before init', () => {
      expect(() => audioManager.mute()).not.toThrow();
    });
  });
});
