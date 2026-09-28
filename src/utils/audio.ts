/**
 * Web Audio API synthesizer for realistic aerospace & mission control telemetry sounds.
 * Generates all audio procedurally without external audio assets.
 */

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private droneEngineOsc: OscillatorNode | null = null;
  private droneEngineGain: GainNode | null = null;
  private isEngineRunning: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.droneEngineGain) {
      this.droneEngineGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    } else if (!muted && this.droneEngineGain && this.isEngineRunning) {
      this.droneEngineGain.gain.setValueAtTime(0.04, this.ctx?.currentTime || 0);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  public playTelemetryBeep() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1800, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  /**
   * High-pitch double chirp when YOLO detects survivor
   */
  public playAiDetectionAlert() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // First chirp
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1760, now); // A6
    osc1.frequency.exponentialRampToValueAtTime(2349, now + 0.08); // D7
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.09);

    // Second affirmative chirp
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2637, now + 0.1); // E7
    osc2.frequency.exponentialRampToValueAtTime(3520, now + 0.22); // A7
    gain2.gain.setValueAtTime(0.15, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.24);
  }

  /**
   * Pulsing warning tone for GPS LOSS
   */
  public playGpsLossAlarm() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const startTime = now + i * 0.18;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, startTime);
      osc.frequency.linearRampToValueAtTime(450, startTime + 0.12);

      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);

      // Low pass to soften harshness
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, startTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.14);
    }
  }

  /**
   * Winch motorized mechanical servo sound
   */
  public playWinchSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(280, now + 0.35);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  /**
   * Background drone engine sound (subtle, non-annoying)
   */
  public startDroneEngine() {
    if (this.isEngineRunning) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      this.droneEngineOsc = this.ctx.createOscillator();
      this.droneEngineGain = this.ctx.createGain();

      this.droneEngineOsc.type = 'sawtooth';
      this.droneEngineOsc.frequency.setValueAtTime(110, this.ctx.currentTime); // 110Hz hum

      // Low pass filter to make it sound like electric rotors through air
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);

      this.droneEngineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.03, this.ctx.currentTime);

      this.droneEngineOsc.connect(filter);
      filter.connect(this.droneEngineGain);
      this.droneEngineGain.connect(this.ctx.destination);

      this.droneEngineOsc.start();
      this.isEngineRunning = true;
    } catch {
      // Audio autoplay policy
    }
  }

  public updateEnginePitch(speedRatio: number) {
    if (!this.droneEngineOsc || !this.ctx) return;
    const baseFreq = 100 + speedRatio * 80;
    this.droneEngineOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.2);
  }

  /**
   * Deep water surge / rushing flood roar
   */
  public playWaterSurgeSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; // Pink/white noise for water rush
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, this.ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(320, this.ctx.currentTime + 0.8);
      filter.frequency.linearRampToValueAtTime(140, this.ctx.currentTime + 1.5);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {}
  }

  /**
   * Rescue boat outboard motor sound
   */
  public playBoatMotorSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(75, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.4);
      osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 1.2);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.2);
    } catch {}
  }

  public stopDroneEngine() {
    if (!this.isEngineRunning) return;
    try {
      if (this.droneEngineGain && this.ctx) {
        this.droneEngineGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
      }
      setTimeout(() => {
        if (this.droneEngineOsc) {
          try {
            this.droneEngineOsc.stop();
            this.droneEngineOsc.disconnect();
          } catch {}
          this.droneEngineOsc = null;
        }
        this.isEngineRunning = false;
      }, 500);
    } catch {
      this.isEngineRunning = false;
    }
  }
}

export const soundManager = new SoundEffectsManager();
