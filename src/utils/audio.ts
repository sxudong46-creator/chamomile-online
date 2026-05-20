// Web Audio API Synthesizer for Procedural Rain, Wind, and Wind Chimes

class AudioEngine {
  private ctx: AudioContext | null = null;
  private rainNoiseNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  
  private windNoiseNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windLFO: OscillatorNode | null = null;
  private windLFOGain: GainNode | null = null;

  private masterGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private effectsGain: GainNode | null = null;

  private isRunning: boolean = false;
  private volume: number = 0.5; // 0 to 1

  constructor() {
    // Audio Context is initialized lazily upon first user interaction due to browser autoplay policies
  }

  private init() {
    if (this.ctx) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Rain Gain
      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.rainGain.connect(this.masterGain);

      // Wind Gain
      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.windGain.connect(this.masterGain);

      // Effects Gain (Drips, Wind Chimes)
      this.effectsGain = this.ctx.createGain();
      this.effectsGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.effectsGain.connect(this.masterGain);

      this.setupRainSynth();
      this.setupWindSynth();
    } catch (e) {
      console.warn("Failed to initialize Web Audio API: ", e);
    }
  }

  // Pure Noise generator via ScriptProcessor (safely supported across modern browsers)
  private createNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error("No context");
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }

  private setupRainSynth() {
    if (!this.ctx || !this.rainGain) return;

    try {
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = this.createNoiseBuffer();
      noiseSource.loop = true;

      this.rainFilter = this.ctx.createBiquadFilter();
      this.rainFilter.type = "lowpass";
      this.rainFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
      this.rainFilter.Q.setValueAtTime(1, this.ctx.currentTime);

      const highpass = this.ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.setValueAtTime(250, this.ctx.currentTime);

      noiseSource.connect(highpass);
      highpass.connect(this.rainFilter);
      this.rainFilter.connect(this.rainGain);

      noiseSource.start(0);
    } catch (e) {
      console.error("Rain synth failed: ", e);
    }
  }

  private setupWindSynth() {
    if (!this.ctx || !this.windGain) return;

    try {
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = this.createNoiseBuffer();
      noiseSource.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = "bandpass";
      this.windFilter.frequency.setValueAtTime(300, this.ctx.currentTime);
      this.windFilter.Q.setValueAtTime(5, this.ctx.currentTime);

      // Create an LFO to modulate the wind speed/pitch dynamically
      this.windLFO = this.ctx.createOscillator();
      this.windLFO.type = "sine";
      this.windLFO.frequency.setValueAtTime(0.08, this.ctx.currentTime); // very slow

      this.windLFOGain = this.ctx.createGain();
      this.windLFOGain.gain.setValueAtTime(150, this.ctx.currentTime); // range of pitch movement

      this.windLFO.connect(this.windLFOGain);
      if (this.windFilter.frequency) {
        this.windLFOGain.connect(this.windFilter.frequency);
      }

      noiseSource.connect(this.windFilter);
      this.windFilter.connect(this.windGain);

      this.windLFO.start(0);
      noiseSource.start(0);
    } catch (e) {
      console.error("Wind synth failed: ", e);
    }
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(100, volume)) / 100;
    if (this.ctx && this.masterGain) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(this.volume, t);
    }
  }

  public updateParameters(rainIntensity: number, windStrength: number, enabled: boolean) {
    if (!enabled) {
      this.mute();
      return;
    }

    this.init();
    if (!this.ctx) return;

    // Resume context if suspended
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;

    // Map intensity to rain loudness
    if (this.rainGain && this.rainFilter) {
      const targetRainGain = (rainIntensity / 100) * 0.45;
      this.rainGain.gain.setTargetAtTime(targetRainGain, t, 0.5);
      
      // Make rain sound brighter and harsher when it's stronger
      const cutoff = 600 + (rainIntensity / 100) * 1200;
      this.rainFilter.frequency.setTargetAtTime(cutoff, t, 0.4);
    }

    // Map wind strength to wind loudness
    if (this.windGain && this.windFilter && this.windLFO) {
      const targetWindGain = (windStrength / 100) * 0.4;
      this.windGain.gain.setTargetAtTime(targetWindGain, t, 0.8);
      
      // Speed up wind fluctuations when wind is stronger
      const lfoSpeed = 0.05 + (windStrength / 100) * 0.15;
      this.windLFO.frequency.setTargetAtTime(lfoSpeed, t, 1.0);
    }
  }

  // Synthesize a droplet impact water drip
  public playDrip(intensity: number = 0.5) {
    if (!this.ctx || this.volume === 0 || !this.effectsGain) return;
    if (this.ctx.state === "suspended") return;

    try {
      const t = this.ctx.currentTime;

      // Drop envelope: rapid sweep frequency sine wave
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = "sine";
      
      // Pitch sweeps down to simulate bubble/drip resonance
      const startFreq = 1200 + Math.random() * 400;
      const endFreq = 200 + Math.random() * 100;
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.08);

      gainNode.gain.setValueAtTime(0, t);
      // Fast attack
      gainNode.gain.linearRampToValueAtTime(0.12 * intensity, t + 0.005);
      // Gentle decay
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gainNode);
      gainNode.connect(this.effectsGain);

      osc.start(t);
      osc.stop(t + 0.15);
    } catch (e) {
      // Audio node failure ignored silently
    }
  }

  // Synthesize a beautiful soft wind chime sound (pentatonic)
  // Triggered when rain hits a chamomile flower or cursor swipes over it
  private lastChimeTime = 0;
  public tryPlayWindChime() {
    if (!this.ctx || this.volume === 0 || !this.effectsGain) return;
    if (this.ctx.state === "suspended") return;

    const now = Date.now();
    // Throttle wind chimes to prevent chaotic overlay
    if (now - this.lastChimeTime < 400) return;
    this.lastChimeTime = now;

    try {
      const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // C5, D5, E5, G5, A5, C6
      const randomFreq = pentatonic[Math.floor(Math.random() * pentatonic.length)];
      
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(randomFreq, t);
      
      // Custom metal-like ringing harmonics using brief overdrive or double tune
      const harmonic = this.ctx.createOscillator();
      const harmonicGain = this.ctx.createGain();
      harmonic.type = "sine";
      // Chime resonance ratio
      harmonic.frequency.setValueAtTime(randomFreq * 2.76, t); 
      
      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.05, t + 0.01); // sharp attack
      gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 1.8); // long resonance
      
      harmonicGain.gain.setValueAtTime(0, t);
      harmonicGain.gain.linearRampToValueAtTime(0.015, t + 0.005);
      harmonicGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); // harmonic decays faster
      
      osc.connect(gainNode);
      harmonic.connect(harmonicGain);
      
      gainNode.connect(this.effectsGain);
      harmonicGain.connect(this.effectsGain);
      
      osc.start(t);
      harmonic.start(t);
      
      osc.stop(t + 2.0);
      harmonic.stop(t + 1.0);
    } catch (e) {
      // Audio failure ignored
    }
  }

  public mute() {
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    if (this.windGain && this.ctx) {
      this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }
}

// Export a singleton instance
export const audioInstance = new AudioEngine();
