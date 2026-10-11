import { radix2FFT } from '../transforms/fft.mjs';
import { directDFT, frequencyBins } from '../transforms/dft.mjs';
import { windowValues } from '../windows/index.mjs';
import { magnitude } from '../math/complex.mjs';
import { positive, integer } from '../math/numeric.mjs';
export const transform = (x) => x.length && (x.length & (x.length - 1)) === 0 ? radix2FFT(x) : directDFT(x);
export function magnitudeSpectrum(samples, sampleRate, window = 'rectangular') {
  positive(sampleRate); integer(samples.length);
  const weights = windowValues(window, samples.length), gain = weights.reduce((a, b) => a + b, 0);
  if (gain <= 1e-12) throw new RangeError('Window has zero coherent gain');
  const X = transform(samples.map((v, i) => v * weights[i]));
  const end = Math.floor(samples.length / 2) + 1;
  return { frequencies: frequencyBins(samples.length, sampleRate).slice(0, end),
    values: X.slice(0, end).map((v, k) => magnitude(v) / gain * (k === 0 || (samples.length % 2 === 0 && k === samples.length / 2) ? 1 : 2)) };
}
export function periodogram(samples, sampleRate, window = 'hann') {
  positive(sampleRate); integer(samples.length);
  const weights = windowValues(window, samples.length);
  const normalization = sampleRate * weights.reduce((a, v) => a + v * v, 0);
  if (normalization <= 1e-12) throw new RangeError('Window has zero energy');
  const X = transform(samples.map((v, i) => v * weights[i]));
  const end = Math.floor(samples.length / 2) + 1;
  return { frequencies: frequencyBins(samples.length, sampleRate).slice(0, end),
    values: X.slice(0, end).map((v, k) => magnitude(v) ** 2 / normalization * (k === 0 || (samples.length % 2 === 0 && k === samples.length / 2) ? 1 : 2)) };
}
export function stft(samples, sampleRate, length = 128, overlap = 0.5, window = 'hann') {
  integer(length, 3); positive(sampleRate);
  if (length > samples.length || overlap < 0 || overlap >= 1) throw new RangeError('Invalid STFT segment/overlap');
  const hop = Math.max(1, Math.round(length * (1 - overlap))), frames = [];
  for (let start = 0; start + length <= samples.length; start += hop) {
    frames.push({ time: (start + (length - 1) / 2) / sampleRate, start, ...periodogram(samples.slice(start, start + length), sampleRate, window) });
  }
  return { frames, hop, length, sampleRate };
}
export function welch(samples, sampleRate, length = 128, overlap = 0.5, window = 'hann') {
  const { frames } = stft(samples, sampleRate, length, overlap, window);
  return { frequencies: frames[0].frequencies, segments: frames.length,
    values: frames[0].values.map((_, k) => frames.reduce((sum, frame) => sum + frame.values[k], 0) / frames.length) };
}
