import type { Volume } from '../settings/settings';
import type { SoundId } from './soundForEvent';

// Synthesized in the browser so the app ships no audio files. Every sound is a few
// short oscillator or noise envelopes, kept quiet enough to sit under the UI.

interface Tone {
  readonly freq: number;
  readonly at: number;
  readonly dur: number;
  readonly type: OscillatorType;
  readonly level: number;
}

const TONES: Readonly<Record<Exclude<SoundId, 'dice'>, readonly Tone[]>> = {
  step: [{ freq: 660, at: 0, dur: 0.07, type: 'sine', level: 0.6 }],
  capture: [
    { freq: 170, at: 0, dur: 0.25, type: 'triangle', level: 1 },
    { freq: 90, at: 0.04, dur: 0.22, type: 'sine', level: 0.8 },
  ],
  home: [
    { freq: 523, at: 0, dur: 0.14, type: 'triangle', level: 0.7 },
    { freq: 659, at: 0.09, dur: 0.14, type: 'triangle', level: 0.7 },
    { freq: 784, at: 0.18, dur: 0.2, type: 'triangle', level: 0.8 },
  ],
  finish: [
    { freq: 523, at: 0, dur: 0.16, type: 'square', level: 0.35 },
    { freq: 659, at: 0.1, dur: 0.16, type: 'square', level: 0.35 },
    { freq: 784, at: 0.2, dur: 0.16, type: 'square', level: 0.35 },
    { freq: 1047, at: 0.3, dur: 0.3, type: 'square', level: 0.4 },
  ],
  win: [
    { freq: 523, at: 0, dur: 0.14, type: 'square', level: 0.35 },
    { freq: 659, at: 0.12, dur: 0.14, type: 'square', level: 0.35 },
    { freq: 784, at: 0.24, dur: 0.14, type: 'square', level: 0.35 },
    { freq: 1047, at: 0.36, dur: 0.35, type: 'square', level: 0.4 },
    { freq: 784, at: 0.36, dur: 0.35, type: 'triangle', level: 0.3 },
    { freq: 523, at: 0.36, dur: 0.35, type: 'triangle', level: 0.3 },
  ],
  reaction: [
    { freq: 880, at: 0, dur: 0.09, type: 'sine', level: 0.6 },
    { freq: 1175, at: 0.07, dur: 0.12, type: 'sine', level: 0.6 },
  ],
};

// Peak gain per volume step. Kept low: a square-wave fanfare is loud at full scale.
const PEAK: Readonly<Record<Volume, number>> = { low: 0.06, medium: 0.12, high: 0.22 };

export function gainFor(volume: Volume): number {
  return PEAK[volume];
}

let context: AudioContext | null = null;

function ensureContext(): AudioContext | null {
  if (context !== null) return context;
  const Ctor: typeof AudioContext | undefined =
    globalThis.AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (Ctor === undefined) return null;
  context = new Ctor();
  return context;
}

// Browsers keep audio suspended until a user gesture. Called from the first pointer or key event.
export function unlockAudio(): void {
  const ctx = ensureContext();
  if (ctx !== null && ctx.state === 'suspended') void ctx.resume();
}

export function playSound(id: SoundId, gain: number): void {
  const ctx = ensureContext();
  if (ctx === null) return;
  const start = ctx.currentTime;
  if (id === 'dice') {
    playNoise(ctx, start, gain);
    return;
  }
  for (const tone of TONES[id]) playTone(ctx, start, tone, gain);
}

function playTone(ctx: AudioContext, start: number, tone: Tone, gain: number): void {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  const t0 = start + tone.at;
  osc.type = tone.type;
  osc.frequency.setValueAtTime(tone.freq, t0);
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(Math.max(gain * tone.level, 0.0002), t0 + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.dur);
  osc.connect(env);
  env.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + tone.dur + 0.02);
}

// The dice rattle is a short burst of noise, not a tone, so it reads as a throw.
function playNoise(ctx: AudioContext, start: number, gain: number): void {
  const dur = 0.14;
  const frames = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = ctx.createBufferSource();
  const env = ctx.createGain();
  src.buffer = buffer;
  env.gain.setValueAtTime(gain * 0.5, start);
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(env);
  env.connect(ctx.destination);
  src.start(start);
}
