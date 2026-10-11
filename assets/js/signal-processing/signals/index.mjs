import { TAU, positive, integer } from '../math/numeric.mjs';
export const oscillator = ({ frequency = 1, amplitude = 1, phase = 0, kind = 'cosine' } = {}) =>
  (t) => amplitude * (kind === 'sine' ? Math.sin : Math.cos)(TAU * frequency * t + phase);
export const compose = (components) => (t) => components.reduce((sum, c) => sum + oscillator(c)(t), 0);
export const pulse = (t, width = 1) => Math.abs(t) < width / 2 ? 1 : Math.abs(t) === width / 2 ? 0.5 : 0;
export const gaussian = (t, sigma = 0.4) => Math.exp(-t * t / (2 * sigma * sigma));
export const chirp = (t, f0 = 5, rate = 10) => Math.sin(TAU * (f0 * t + rate * t * t / 2));
export function waveform(type, t, period = 1) {
  const u = ((t / period) % 1 + 1) % 1;
  if (type === 'triangle') return 2 / Math.PI * Math.asin(Math.sin(TAU * u));
  if (type === 'sawtooth') return 2 * (((u + 0.5) % 1)) - 1;
  return Math.abs(Math.sin(TAU * u)) < 1e-12 ? 0 : (u < 0.5 ? 1 : -1);
}
// Uniform, zero-mean noise with requested RMS, reproducible across renders.
export function noise(seed, count, rms = 1) {
  integer(count); let state = seed >>> 0;
  return Array.from({ length: count }, () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return (state / 4294967296 - 0.5) * Math.sqrt(12) * rms;
  });
}
export function sampledSignal(fn, sampleRate, count, startTime = 0, metadata = {}) {
  positive(sampleRate, 'sample rate'); integer(count);
  return { samples: Array.from({ length: count }, (_, n) => fn(startTime + n / sampleRate)), sampleRate, startTime, metadata };
}
