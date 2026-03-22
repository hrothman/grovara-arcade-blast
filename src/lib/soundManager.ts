import { zzfx, ZZFX } from 'zzfx';

export class SoundManager {
  private scene: Phaser.Scene | null = null;
  private musicVolume = 0.05;
  private sfxVolume = 0.8;
  private musicMuted = false;
  private sfxMuted = false;
  private audioUnlocked = false;

  // HTML5 Audio for background music — independent of Phaser lifecycle
  private bgAudio: HTMLAudioElement | null = null;
  private musicWanted = false;

  // HTML5 Audio pool for ouch sound (allows overlapping plays)
  private ouchAudioPool: HTMLAudioElement[] = [];
  private ouchPoolIndex = 0;

  // HTML5 Audio for victory fanfare
  private victoryAudio: HTMLAudioElement | null = null;

  // Web Audio API buffers — bypasses mobile HTMLAudioElement gesture restrictions
  private ouchBuffer: AudioBuffer | null = null;
  private victoryBuffer: AudioBuffer | null = null;
  private audioBuffersLoading = false;

  constructor() {
    this.loadSettings();
  }

  /**
   * Resume the ZzFX AudioContext after a user gesture.
   * Must be called from a click/touch handler to unlock audio on mobile.
   */
  unlockAudio() {
    if (this.audioUnlocked) return;
    try {
      const ctx = ZZFX.audioContext;
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().then(() => {
          this.audioUnlocked = true;
          this.loadAudioBuffers();
        });
      } else {
        this.audioUnlocked = true;
        this.loadAudioBuffers();
      }
    } catch (e) {
      console.warn('Failed to unlock audio context:', e);
    }
  }

  /**
   * Pre-fetch and decode audio files into AudioBuffers for Web Audio API playback.
   * This bypasses mobile HTMLAudioElement restrictions since the AudioContext
   * was already unlocked by a user gesture during gameplay.
   */
  private async loadAudioBuffers() {
    if (this.audioBuffersLoading || (this.ouchBuffer && this.victoryBuffer)) return;
    this.audioBuffersLoading = true;

    const ctx = ZZFX.audioContext;
    if (!ctx) return;

    try {
      const [ouchResp, victoryResp] = await Promise.all([
        fetch('/sounds/ouch.wav'),
        fetch('/sounds/victory-fanfare.mp3'),
      ]);
      const [ouchArr, victoryArr] = await Promise.all([
        ouchResp.arrayBuffer(),
        victoryResp.arrayBuffer(),
      ]);
      // decodeAudioData needs separate copies if called in parallel
      this.ouchBuffer = await ctx.decodeAudioData(ouchArr);
      this.victoryBuffer = await ctx.decodeAudioData(victoryArr);
      console.log('[SoundManager] Audio buffers decoded for Web Audio API');
    } catch (e) {
      console.warn('[SoundManager] Failed to load audio buffers:', e);
    }
  }

  /**
   * Play an AudioBuffer through the Web Audio API.
   * Returns true if played successfully, false if fallback is needed.
   */
  private playBuffer(buffer: AudioBuffer | null, volume: number, playbackRate = 1): boolean {
    const ctx = ZZFX.audioContext;
    if (!ctx || !buffer || ctx.state !== 'running') return false;

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = playbackRate;

      const gain = ctx.createGain();
      gain.gain.value = Math.min(1, volume);

      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);
      return true;
    } catch {
      return false;
    }
  }

  private loadSettings() {
    const savedMusicVolume = localStorage.getItem('musicVolume');
    const savedSfxVolume = localStorage.getItem('sfxVolume');
    const savedMusicEnabled = localStorage.getItem('musicEnabled');
    const savedSfxEnabled = localStorage.getItem('sfxEnabled');

    if (savedMusicVolume) this.musicVolume = Number(savedMusicVolume) / 100;
    if (savedSfxVolume) this.sfxVolume = Number(savedSfxVolume) / 100;
    if (savedMusicEnabled) this.musicMuted = savedMusicEnabled !== 'true';
    if (savedSfxEnabled) this.sfxMuted = savedSfxEnabled !== 'true';
  }

  // ZzFX sound effect definitions (arcade-style retro sounds)
  private zzfxSounds = {
    placeProduct: () => zzfx(this.sfxVolume, 0, 523, .01, .04, .05, 1, 1.7, 0, 0, 0, 0, 0, 0, 0, 0, 0, .5, .01), // Pop
    enemyHit: () => zzfx(this.sfxVolume * 2, 0, 180, .02, .1, .15, 3, 1.5, -5, 0, 0, 0, 0, .3, 0, 0, 0, .6, .02), // Warning buzzer (product sliced — loud!)
    enemyKill: () => zzfx(this.sfxVolume * 2, 0, 400, .04, .15, .25, 1, 1.8, 0, 8, -200, .08, .15, 0, 0, 0, 0, .7, .05), // Satisfying explosion (enemy sliced — loud!)
    ouch: () => this.playOuchAudio(), // Real voice "Ouch!" sound
    itemStolen: () => zzfx(this.sfxVolume, 0, 440, .02, .08, .2, 3, 1.4, -1, 0, 0, 0, 0, .5, 0, 0, 0, .5, .02), // Negative
    levelComplete: () => zzfx(this.sfxVolume, 0, 830, .04, .12, .3, 0, 2, 0, 0, 0, 0, 0, 0, 0, .1, 0, .7, .04), // Victory
    rareItem: () => zzfx(this.sfxVolume, 0, 1319, .03, .1, .3, 0, 2.5, 5, 0, 0, 0, 0, 0, 0, 0, 0, .6, .05), // Sparkle
    shelfComplete: () => zzfx(this.sfxVolume, 0, 659, .08, .15, .4, 0, 2.2, 0, 0, 0, 0, 0, 0, 0, .2, 0, .75, .08), // Triumphant
    gameComplete: () => this.playVictoryFanfare(), // 4-note ascending victory arpeggio
  };

  /**
   * Pre-create a pool of Audio elements for the ouch sound so
   * multiple "ouch" sounds can overlap without cutting each other off.
   */
  private ensureOuchPool() {
    if (this.ouchAudioPool.length > 0) return;
    for (let i = 0; i < 4; i++) {
      const audio = new Audio('/sounds/ouch.wav');
      audio.preload = 'auto';
      audio.volume = this.sfxVolume;
      this.ouchAudioPool.push(audio);
    }
  }

  private playOuchAudio() {
    if (this.sfxMuted) return;

    // Try Web Audio API first (works on mobile without gesture)
    if (this.playBuffer(this.ouchBuffer, this.sfxVolume, 1.6)) return;

    // Fallback to HTMLAudioElement
    this.ensureOuchPool();
    const audio = this.ouchAudioPool[this.ouchPoolIndex % this.ouchAudioPool.length];
    this.ouchPoolIndex++;
    audio.volume = this.sfxVolume;
    audio.playbackRate = 1.6; // Fast "ouch!"
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  private playVictoryFanfare() {
    if (this.sfxMuted) return;

    // Try Web Audio API first (works on mobile without gesture)
    if (this.playBuffer(this.victoryBuffer, Math.min(1, this.sfxVolume * 2.5), 0.85)) return;

    // Fallback to HTMLAudioElement
    if (!this.victoryAudio) {
      this.victoryAudio = new Audio('/sounds/victory-fanfare.mp3');
      this.victoryAudio.preload = 'auto';
    }
    this.victoryAudio.volume = Math.min(1, this.sfxVolume * 2.5); // Loud!
    this.victoryAudio.playbackRate = 0.85; // Slightly slower = longer & more epic
    this.victoryAudio.currentTime = 0;
    this.victoryAudio.play().catch(() => {});
  }

  init(scene: Phaser.Scene) {
    this.scene = scene;
  }

  preload(_scene: Phaser.Scene) {
    // Background music is now handled by HTML5 Audio, not Phaser loader
  }

  async preloadAsync(_scene: Phaser.Scene) {
    // Background music is now handled by HTML5 Audio, not Phaser loader
  }

  /**
   * Ensures the HTML5 Audio element exists and is loaded.
   * Safe to call multiple times — creates element only once.
   */
  private ensureBgAudio(): HTMLAudioElement {
    if (!this.bgAudio) {
      this.bgAudio = new Audio('/sounds/bonkers-for-arcades.mp3');
      this.bgAudio.loop = true;
      this.bgAudio.volume = this.musicVolume;
      this.bgAudio.preload = 'auto';
    }
    return this.bgAudio;
  }

  /**
   * Start background music. Works from any screen — no Phaser scene required.
   * If the audio hasn't loaded yet, it will start automatically once ready.
   */
  playBackgroundMusic() {
    if (this.musicMuted) return;

    this.musicWanted = true;
    const audio = this.ensureBgAudio();
    audio.volume = this.musicVolume;

    // Already playing — nothing to do
    if (!audio.paused) return;

    // Try to play immediately (requires prior user interaction)
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(() => {
        // Browser blocked autoplay — will retry on next user interaction
        console.warn('Audio autoplay blocked, will retry on interaction');
      });
    }
  }

  stopBackgroundMusic() {
    this.musicWanted = false;
    if (this.bgAudio) {
      this.bgAudio.pause();
      this.bgAudio.currentTime = 0;
    }
  }

  pauseBackgroundMusic() {
    if (this.bgAudio && !this.bgAudio.paused) {
      this.bgAudio.pause();
    }
  }

  resumeBackgroundMusic() {
    if (this.musicMuted || !this.musicWanted) return;
    if (this.bgAudio && this.bgAudio.paused) {
      this.bgAudio.play().catch(() => {});
    }
  }

  playSound(soundKey: string) {
    if (this.sfxMuted) return;

    // Ensure AudioContext is unlocked (mobile requires user gesture)
    this.unlockAudio();

    // ZzFX generated sounds — work without Phaser scene
    if (soundKey in this.zzfxSounds) {
      try {
        this.zzfxSounds[soundKey as keyof typeof this.zzfxSounds]();
      } catch (error) {
        console.warn(`Failed to play ZzFX sound ${soundKey}`, error);
      }
    } else if (this.scene) {
      // Fallback to Phaser audio for other loaded sounds
      try {
        this.scene.sound.play(soundKey, { volume: this.sfxVolume });
      } catch (error) {
        console.warn(`Sound ${soundKey} not found`, error);
      }
    }
  }

  /**
   * Set the music playback speed (1.0 = normal).
   * Level 1 = 0.88 (chill), Level 2 = 1.0 (normal), Level 3 = 1.15 (intense)
   */
  setMusicSpeed(rate: number) {
    if (this.bgAudio) {
      this.bgAudio.playbackRate = Math.max(0.5, Math.min(2.0, rate));
    }
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.bgAudio) {
      this.bgAudio.volume = this.musicVolume;
    }
  }

  setSFXVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    if (this.musicMuted) {
      this.pauseBackgroundMusic();
    } else if (this.musicWanted) {
      this.resumeBackgroundMusic();
    }
  }

  setSFXMuted(muted: boolean) {
    this.sfxMuted = muted;
  }

  isMusicMuted(): boolean {
    return this.musicMuted;
  }

  isSFXMuted(): boolean {
    return this.sfxMuted;
  }

  cleanup() {
    // Don't stop music on cleanup — it should persist across screens
    this.scene = null;
  }
}

export const soundManager = new SoundManager();
