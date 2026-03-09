import { SoundName, Vector3 } from '@/types/GameTypes';
import { DEFAULT_SETTINGS } from '@/data/Config';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private _isMuted: boolean = false;
  private _volume: number = DEFAULT_SETTINGS.sfxVolume;
  private _musicVolume: number = DEFAULT_SETTINGS.musicVolume;

  public get isMuted(): boolean {
    return this._isMuted;
  }

  public get volume(): number {
    return this._volume;
  }

  public async init(): Promise<boolean> {
    try {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);

      this.sfxGain.gain.value = this._volume;
      this.musicGain.gain.value = this._musicVolume;
      return true;
    } catch (error) {
      console.warn('AudioContext not available:', error);
      return false;
    }
  }

  private ensureContext(): boolean {
    if (!this.audioContext) return false;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return true;
  }

  public play(sound: SoundName): void {
    if (!this.ensureContext() || this._isMuted) return;
    this.playGeneratedSound(sound);
  }

  public playAt(_sound: SoundName, _position: Vector3): void {
    // For now, play without spatial audio
    this.play(_sound);
  }

  private playGeneratedSound(sound: SoundName): void {
    if (!this.audioContext || !this.sfxGain) return;

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);

    const now = ctx.currentTime;

    switch (sound) {
      case 'pistol_fire':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, now);
        oscillator.frequency.exponentialRampToValueAtTime(30, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        // Add noise burst
        this.playNoiseBurst(0.05, 0.08);
        break;

      case 'shotgun_fire':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(80, now);
        oscillator.frequency.exponentialRampToValueAtTime(20, now + 0.2);
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        this.playNoiseBurst(0.1, 0.15);
        break;

      case 'rifle_fire':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.05);
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
        this.playNoiseBurst(0.03, 0.04);
        break;

      case 'reload':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.setValueAtTime(600, now + 0.1);
        oscillator.frequency.setValueAtTime(500, now + 0.2);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;

      case 'empty_click':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.05);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
        break;

      case 'weapon_switch':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.setValueAtTime(500, now + 0.05);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        break;

      case 'enemy_hurt':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        break;

      case 'enemy_death':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;

      case 'player_hurt':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(150, now);
        oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        oscillator.start(now);
        oscillator.stop(now + 0.15);
        break;

      case 'player_death':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(30, now + 0.5);
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;

      case 'pickup_health':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.setValueAtTime(600, now + 0.1);
        oscillator.frequency.setValueAtTime(800, now + 0.2);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;

      case 'pickup_ammo':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(500, now);
        oscillator.frequency.setValueAtTime(700, now + 0.05);
        oscillator.frequency.setValueAtTime(600, now + 0.1);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        oscillator.start(now);
        oscillator.stop(now + 0.15);
        break;

      case 'wave_start':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.setValueAtTime(400, now + 0.2);
        oscillator.frequency.setValueAtTime(600, now + 0.4);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        oscillator.start(now);
        oscillator.stop(now + 0.6);
        break;

      case 'wave_complete':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.setValueAtTime(600, now + 0.15);
        oscillator.frequency.setValueAtTime(800, now + 0.3);
        oscillator.frequency.setValueAtTime(1000, now + 0.45);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        oscillator.start(now);
        oscillator.stop(now + 0.6);
        break;

      case 'hit_marker':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1000, now);
        oscillator.frequency.setValueAtTime(800, now + 0.03);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
        break;

      case 'footstep':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(80, now);
        oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.05);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
        break;

      default:
        oscillator.stop(now);
        return;
    }
  }

  private playNoiseBurst(volume: number, duration: number): void {
    if (!this.audioContext || !this.sfxGain) return;

    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(
      1,
      bufferSize,
      this.audioContext.sampleRate
    );
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.sfxGain);
    source.start();
  }

  public setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this._volume;
    }
  }

  public setMusicVolume(volume: number): void {
    this._musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain) {
      this.musicGain.gain.value = this._musicVolume;
    }
  }

  public mute(): void {
    this._isMuted = true;
    if (this.masterGain) {
      this.masterGain.gain.value = 0;
    }
  }

  public unmute(): void {
    this._isMuted = false;
    if (this.masterGain) {
      this.masterGain.gain.value = 1;
    }
  }

  public dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
