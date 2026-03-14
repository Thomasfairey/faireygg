"use client";

import { useSettingsStore } from "../store/settingsStore";

class AudioManager {
  private ctx: AudioContext | null = null;
  private initialized = false;

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.initialized = true;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.15) {
    if (!useSettingsStore.getState().soundEnabled) return;
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

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
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(g);
    g.connect(this.ctx.destination);
    source.start();
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
