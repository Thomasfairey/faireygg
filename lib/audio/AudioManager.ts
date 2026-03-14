import { useSettingsStore } from "../store/settingsStore";

class AudioManager {
  private ctx: AudioContext | null = null;
  private initialized = false;
  private noiseBuffer: AudioBuffer | null = null;
  private ambientNodes: { stop: () => void } | null = null;

  init() {
    if (this.initialized) return;
    if (typeof window === "undefined") return;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.initialized = true;
      this.preGenerateNoise();
    } catch { /* AudioContext not available */ }
  }

  private preGenerateNoise() {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  }

  private ensureResumed() {
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
  }

  private osc(freq: number, type: OscillatorType, duration: number, gain: number, delay = 0, filterFreq?: number, filterQ?: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.005);
    g.gain.setValueAtTime(gain, t + duration * 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);

    if (filterFreq && this.ctx) {
      const f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = filterFreq;
      if (filterQ) f.Q.value = filterQ;
      o.connect(f);
      f.connect(g);
    } else {
      o.connect(g);
    }
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + duration);
  }

  private noise(duration: number, gain: number, delay = 0) {
    if (!this.ctx || !this.noiseBuffer) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 1200;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.connect(f);
    f.connect(g);
    g.connect(this.ctx.destination);
    src.start(t, 0, duration);
  }

  private isEnabled() {
    return useSettingsStore.getState().soundEnabled;
  }

  // --- Game Sounds ---

  tapSuccess() {
    if (!this.isEnabled() || !this.ctx) return;
    this.ensureResumed();
    // Bass thud
    this.osc(220, "sine", 0.1, 0.1, 0, 1800);
    // Mid chime
    this.osc(660, "sine", 0.12, 0.07, 0.01);
    // High sparkle
    this.osc(1320, "triangle", 0.08, 0.04, 0.02);
    // Transient click
    this.noise(0.02, 0.04);
  }

  tapFail() {
    if (!this.isEnabled() || !this.ctx) return;
    this.ensureResumed();
    // Dissonant buzz — two detuned sawtooths
    this.osc(150, "sawtooth", 0.25, 0.06, 0, 800);
    this.osc(157, "sawtooth", 0.25, 0.06, 0, 800);
    // Noise burst
    this.noise(0.08, 0.05);
  }

  countdownTick() {
    if (!this.isEnabled() || !this.ctx) return;
    this.ensureResumed();
    // Weighted tick
    this.osc(330, "square", 0.06, 0.06, 0, 2000, 5);
    this.noise(0.02, 0.03);
  }

  countdownGo() {
    if (!this.isEnabled() || !this.ctx) return;
    this.ensureResumed();
    // Power-up chord
    this.osc(440, "sine", 0.2, 0.08);
    this.osc(554, "triangle", 0.2, 0.05, 0.02);
    this.osc(660, "sine", 0.2, 0.05, 0.04);
    // Rising sweep
    if (this.ctx) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(440, this.ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.15);
      g.gain.setValueAtTime(0.06, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start();
      o.stop(this.ctx.currentTime + 0.25);
    }
  }

  newRecord() {
    if (!this.isEnabled() || !this.ctx) return;
    this.ensureResumed();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      this.osc(freq, "sine", 0.25, 0.08, i * 0.1);
      this.osc(freq / 2, "triangle", 0.25, 0.04, i * 0.1); // sub-octave
      // Echo
      this.osc(freq, "sine", 0.2, 0.03, i * 0.1 + 0.06);
    });
  }

  rankUp() {
    if (!this.isEnabled() || !this.ctx) return;
    this.ensureResumed();
    const notes = [440, 554, 659, 880, 1047, 1319];
    notes.forEach((freq, i) => {
      this.osc(freq, "sawtooth", 0.35, 0.06, i * 0.1, 500 + i * 600);
      this.osc(freq, "sine", 0.35, 0.06, i * 0.1);
    });
  }

  sequenceTone(index: number) {
    if (!this.isEnabled() || !this.ctx) return;
    this.ensureResumed();
    const freqs = [262, 330, 392, 523, 659, 784, 880, 988, 1047];
    const freq = freqs[index % freqs.length];
    this.osc(freq, "sine", 0.3, 0.1);
    this.osc(freq * 2, "triangle", 0.15, 0.03, 0.02);
  }

  uiClick() {
    if (!this.isEnabled() || !this.ctx) return;
    this.ensureResumed();
    this.osc(600, "sine", 0.04, 0.04);
  }

  // --- Classic tension (rising hum during wait) ---
  classicTension(): () => void {
    if (!this.isEnabled() || !this.ctx) return () => {};
    this.ensureResumed();
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(80, ctx.currentTime);
    o.frequency.linearRampToValueAtTime(300, ctx.currentTime + 5);
    g.gain.setValueAtTime(0.005, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 5);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    return () => {
      try {
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        o.stop(ctx.currentTime + 0.1);
      } catch { /* already stopped */ }
    };
  }

  // --- Inhibition mode sounds ---
  inhibitionCorrect() {
    if (!this.isEnabled() || !this.ctx) return;
    this.ensureResumed();
    this.osc(880, "sine", 0.08, 0.1);
    this.osc(1320, "triangle", 0.06, 0.05, 0.03);
  }

  inhibitionWrong() {
    if (!this.isEnabled() || !this.ctx) return;
    this.ensureResumed();
    this.osc(120, "sawtooth", 0.3, 0.08, 0, 600);
    this.osc(127, "sawtooth", 0.3, 0.08, 0, 600);
    this.noise(0.1, 0.06);
  }

  inhibitionResist() {
    if (!this.isEnabled() || !this.ctx) return;
    this.ensureResumed();
    // Subtle positive confirmation for successfully not tapping
    this.osc(440, "sine", 0.1, 0.03);
    this.osc(554, "sine", 0.1, 0.02, 0.04);
  }

  // --- Zen mode sounds ---
  zenTap() {
    if (!this.isEnabled() || !this.ctx) return;
    this.ensureResumed();
    // Soft resonant chime with long decay
    this.osc(396, "sine", 0.8, 0.06);
    this.osc(528, "sine", 0.6, 0.03, 0.1);
    this.osc(198, "sine", 0.9, 0.02, 0.05);
  }

  zenAmbient(): () => void {
    if (!this.isEnabled() || !this.ctx) return () => {};
    this.ensureResumed();
    const ctx = this.ctx;
    const nodes: (OscillatorNode | GainNode)[] = [];

    // Layered drone
    [55, 82.5, 110].forEach((freq) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.value = 0.012;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      nodes.push(o, g);
    });

    // LFO on gain
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "triangle";
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 0.005;
    lfo.connect(lfoGain);
    lfoGain.connect((nodes[1] as GainNode).gain);
    lfo.start();
    nodes.push(lfo, lfoGain);

    return () => {
      nodes.forEach((n) => {
        try {
          if (n instanceof OscillatorNode) n.stop();
        } catch { /* already stopped */ }
      });
    };
  }

  // --- Menu ambient ---
  menuAmbient(): () => void {
    if (!this.isEnabled() || !this.ctx) return () => {};
    this.ensureResumed();
    const ctx = this.ctx;
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    o1.type = "sine";
    o1.frequency.value = 55;
    o2.type = "sine";
    o2.frequency.value = 82.5;
    g.gain.value = 0.008;
    o1.connect(g);
    o2.connect(g);
    g.connect(ctx.destination);
    o1.start();
    o2.start();
    return () => {
      try { o1.stop(); o2.stop(); } catch { /* */ }
    };
  }
}

export const audioManager = new AudioManager();
