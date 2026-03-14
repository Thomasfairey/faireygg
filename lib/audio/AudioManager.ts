import { useSettingsStore } from "../store/settingsStore";

class AudioManager {
  private ctx: AudioContext | null = null;
  private initialized = false;
  private noiseBuffer: AudioBuffer | null = null;

  init() {
    if (this.initialized) return;
    if (typeof window === "undefined") return;

    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.initialized = true;
      this.preGenerateNoise();
    } catch {
      // AudioContext not available
    }
  }

  private preGenerateNoise() {
    if (!this.ctx) return;
    const duration = 0.25;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  private async ensureResumed() {
    if (!this.ctx) return false;
    if (this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
      } catch {
        return false;
      }
    }
    return this.ctx.state === "running";
  }

  private playTone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.15) {
    if (!useSettingsStore.getState().soundEnabled) return;
    if (!this.ctx) return;

    this.ensureResumed();

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  private playNoise(duration: number, gain = 0.08) {
    if (!useSettingsStore.getState().soundEnabled) return;
    if (!this.ctx || !this.noiseBuffer) return;

    this.ensureResumed();

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(g);
    g.connect(this.ctx.destination);
    source.start(0, 0, duration);
  }

  tapSuccess() {
    this.playTone(880, 0.12, "sine", 0.12);
    setTimeout(() => this.playTone(1320, 0.1, "sine", 0.08), 60);
  }

  tapFail() {
    this.playTone(200, 0.25, "sawtooth", 0.1);
    this.playNoise(0.1, 0.06);
  }

  countdownTick() {
    this.playTone(440, 0.08, "square", 0.06);
  }

  countdownGo() {
    this.playTone(880, 0.15, "square", 0.1);
    setTimeout(() => this.playTone(1760, 0.2, "sine", 0.08), 80);
  }

  newRecord() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, "sine", 0.1), i * 100);
    });
  }

  rankUp() {
    const notes = [440, 554, 659, 880, 1047, 1319];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, "sine", 0.12), i * 120);
    });
  }

  sequenceTone(index: number) {
    const freqs = [262, 330, 392, 523, 659, 784, 880, 988, 1047];
    this.playTone(freqs[index % freqs.length], 0.25, "sine", 0.12);
  }

  uiClick() {
    this.playTone(600, 0.04, "sine", 0.05);
  }
}

export const audioManager = new AudioManager();
