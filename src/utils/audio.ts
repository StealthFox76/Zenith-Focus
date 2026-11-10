// Web Audio API synthesized sound generator for zero-latency, reliable audio

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play gentle completion chime
 */
export function playAlertSound(type: 'singingBowl' | 'chime' | 'marimba' | 'digital' | 'none', masterVolume: number = 0.8) {
  if (type === 'none' || masterVolume <= 0) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const vol = Math.max(0.01, Math.min(masterVolume, 1));

    if (type === 'singingBowl') {
      // Singing bowl: rich harmonic overtone decay (432Hz fundamental)
      const fundamental = 432;
      const harmonics = [1, 2.76, 5.4, 8.93];
      const gains = [0.6, 0.3, 0.15, 0.08];

      harmonics.forEach((h, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(fundamental * h, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(gains[i] * vol * 0.5, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 3.6);
      });
    } else if (type === 'chime') {
      // Gentle meditation bell / three ascending notes
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = now + index * 0.18;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(0.35 * vol, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 1.9);
      });
    } else if (type === 'marimba') {
      // Organic wooden marimba pluck
      const freqs = [440, 554.37, 659.25, 880];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteTime = now + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.4 * vol, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.65);
      });
    } else if (type === 'digital') {
      // Crisp subtle dual electronic beep
      [880, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteTime = now + idx * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.25 * vol, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.12);
      });
    }
  } catch (err) {
    console.warn('Audio playback not allowed or failed:', err);
  }
}

// Ambient Noise Generator
class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private sourceNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private currentType: string = 'none';

  public play(type: 'none' | 'rain' | 'whitenoise' | 'forest' | 'waves', volume: number = 0.3) {
    if (type === 'none' || volume <= 0) {
      this.stop();
      return;
    }

    if (this.currentType === type && this.gainNode) {
      this.gainNode.gain.setValueAtTime(Math.min(volume, 1) * 0.4, this.ctx!.currentTime);
      return;
    }

    this.stop();
    this.ctx = getAudioContext();
    this.currentType = type;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    // Generate noise buffer
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'rain' || type === 'forest') {
        // Pink noise filter approximation
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else {
        // White / Gentle noise
        output[i] = white * 0.15;
      }
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;

    // Filter node
    const filter = this.ctx.createBiquadFilter();
    if (type === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, this.ctx.currentTime);
    } else if (type === 'forest') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      filter.Q.setValueAtTime(0.8, this.ctx.currentTime);
    } else if (type === 'waves') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    } else {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, this.ctx.currentTime);
    }

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(Math.min(volume, 1) * 0.3, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start();
    this.sourceNode = whiteNoise;
    this.gainNode = gain;
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.min(volume, 1) * 0.3, this.ctx.currentTime);
    }
  }

  public stop() {
    if (this.sourceNode) {
      try {
        (this.sourceNode as AudioBufferSourceNode).stop();
        this.sourceNode.disconnect();
      } catch {
        // ignore
      }
      this.sourceNode = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this.currentType = 'none';
  }
}

export const ambientEngine = new AmbientSoundEngine();
