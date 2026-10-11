import test from 'node:test';
import assert from 'node:assert/strict';
import { directDFT, inverseDFT, frequencyBins, dtft } from '../../assets/js/signal-processing/transforms/dft.mjs';
import { radix2FFT, inverseFFT, fftStages } from '../../assets/js/signal-processing/transforms/fft.mjs';
import { magnitude, multiply, exp, conjugate } from '../../assets/js/signal-processing/math/complex.mjs';
import { integrate, TAU, sinc } from '../../assets/js/signal-processing/math/numeric.mjs';
import { windowValues } from '../../assets/js/signal-processing/windows/index.mjs';
import { noise, waveform } from '../../assets/js/signal-processing/signals/index.mjs';
import { sampleSignal, aliasFrequency, reconstructSinc } from '../../assets/js/signal-processing/sampling/index.mjs';
import { discreteConvolution } from '../../assets/js/signal-processing/filters/index.mjs';
import { periodogram, welch, stft, magnitudeSpectrum } from '../../assets/js/signal-processing/spectral/index.mjs';
import { reconstruct, harmonicPower, rectangleTransform, gaussianTransform } from '../../assets/js/signal-processing/transforms/fourier-series.mjs';
import { impulse, constant, binTone } from '../../data/signal-processing/fixtures.mjs';
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);
const complexNear = (a, b) => { near(a.re, b.re); near(a.im, b.im); };

test('orthogonal harmonics and quadrature; self-inner-product = T/2', () => {
  near(integrate((t) => Math.sin(TAU * 3 * t) * Math.sin(TAU * 5 * t), 0, 1), 0);
  near(integrate((t) => Math.sin(TAU * 3 * t) * Math.cos(TAU * 3 * t), 0, 1), 0);
  near(integrate((t) => Math.sin(TAU * 3 * t) ** 2, 0, 1), 0.5);
});
test('known DFTs: impulse, constant, bin-aligned cosine', () => {
  directDFT(impulse()).forEach((v) => complexNear(v, { re: 1, im: 0 }));
  directDFT(constant()).forEach((v, k) => near(magnitude(v), k ? 0 : 8));
  directDFT(binTone()).forEach((v, k) => near(magnitude(v), k === 1 || k === 7 ? 4 : 0));
});
test('FFT agrees with direct DFT for complex inputs, every stage and inverses', () => {
  for (const N of [1, 2, 4, 8, 32, 128]) {
    const re = noise(42, N), im = noise(93, N), x = re.map((v, n) => ({ re: v, im: im[n] }));
    const fast = radix2FFT(x); directDFT(x).forEach((v, k) => complexNear(v, fast[k]));
    inverseDFT(fast).forEach((v, n) => complexNear(v, x[n]));
    inverseFFT(fast).forEach((v, n) => complexNear(v, x[n]));
    const { stages, ordering } = fftStages(x); assert.equal(stages.length, Math.log2(N) + 1);
    stages[0].values.forEach((v, n) => complexNear(v, x[ordering[n]]));
  }
  assert.throws(() => radix2FFT([1, 2, 3]), /power-of-two/);
});
test('DFT Parseval and real conjugate symmetry', () => {
  const x = noise(10, 64), X = radix2FFT(x);
  near(x.reduce((s, v) => s + v * v, 0), X.reduce((s, v) => s + magnitude(v) ** 2, 0) / x.length);
  X.slice(1).forEach((v, i) => complexNear(X[x.length - i - 1], conjugate(v)));
});
test('DTFT periodicity holds for arbitrary frequency', () => {
  const x = [1, 0.5, -0.1, 2]; complexNear(dtft(x, 0.71), dtft(x, 0.71 + TAU));
});
test('linear convolution and its DTFT theorem include full tail', () => {
  const x = [1, 2, 3], h = [0.5, 0.5], y = discreteConvolution(x, h);
  assert.deepEqual(y, [0.5, 1.5, 2.5, 1.5]);
  for (const w of [0, 0.3, 1, 2, Math.PI]) complexNear(dtft(y, w), multiply(dtft(x, w), dtft(h, w)));
});
test('sample timestamps and signed aliases preserve sine values', () => {
  const s = sampleSignal((t) => t, 20, 4, -0.1); s.samples.forEach((v, n) => near(v, -0.1 + n / 20));
  near(aliasFrequency(25, 30), -5);
  for (const f of [-75, -5, 5, 25, 55, 75]) for (let n = 0; n < 30; n++) near(Math.sin(TAU * f * n / 30), Math.sin(TAU * aliasFrequency(f, 30) * n / 30));
  assert.throws(() => sampleSignal(Math.sin, 0, 10));
});
test('sinc sum interpolates every retained sample exactly', () => {
  const s = sampleSignal(Math.sin, 12, 20, -0.5);
  s.samples.forEach((v, n) => near(reconstructSinc(s, s.startTime + n / s.sampleRate), v)); near(sinc(0), 1);
});
test('windows have expected symmetric endpoints and size', () => {
  for (const name of ['rectangular', 'hann', 'hamming', 'blackman']) {
    const w = windowValues(name, 33); assert.equal(w.length, 33);
    near(w[0], name === 'rectangular' ? 1 : name === 'hamming' ? 0.08 : 0);
    w.forEach((v, n) => near(v, w[32 - n])); near(w[16], 1);
  }
});
test('frequency bins and one-sided amplitude endpoints', () => {
  assert.deepEqual(frequencyBins(4, 100), [0, 25, 50, 75]);
  near(magnitudeSpectrum(binTone(64, 5), 64).values[5], 1);
  near(magnitudeSpectrum(constant(64), 64).values[0], 1);
  near(magnitudeSpectrum(Array.from({ length: 64 }, (_, n) => (-1) ** n), 64).values[32], 1);
});
test('periodogram integrates to mean square; odd length has doubled last positive bin', () => {
  for (const N of [63, 64, 128]) {
    const x = noise(31, N), p = periodogram(x, 256, 'rectangular');
    near(p.values.reduce((a, b) => a + b, 0) * 256 / N, x.reduce((a, v) => a + v * v, 0) / N);
  }
});
test('windowed PSD Parseval, Welch average and STFT timestamps', () => {
  const x = noise(11, 256), w = windowValues('hann', 256), p = periodogram(x, 256);
  near(p.values.reduce((a, b) => a + b, 0), x.reduce((s, v, n) => s + (v * w[n]) ** 2, 0) / w.reduce((s, v) => s + v * v, 0));
  const result = stft(x, 256, 64, 0.5), average = welch(x, 256, 64, 0.5);
  assert.equal(result.frames.length, 7); near(result.frames[0].time, 31.5 / 256); assert.equal(result.hop, 32);
  average.values.forEach((v, k) => near(v, result.frames.reduce((s, f) => s + f.values[k], 0) / 7));
  assert.throws(() => stft(x, 256, 512)); assert.throws(() => stft(x, 256, 64, 1));
});
test('Fourier series energy identity, triangle alignment and transform pairs', () => {
  const count = 31, energy = Array.from({ length: count }, (_, n) => harmonicPower('square', n + 1)).reduce((a, b) => a + b, 0);
  near(integrate((t) => reconstruct('square', count, t) ** 2, 0, 1, 4096), energy);
  near(waveform('triangle', 0.25), 1); near(waveform('triangle', 0.75), -1);
  near(reconstruct('triangle', 101, 0.2), waveform('triangle', 0.2), 0.001);
  near(rectangleTransform(0, 2), 2); near(rectangleTransform(Math.PI, 2), 0);
  near(gaussianTransform(0, 0.5), Math.sqrt(2 * Math.PI) * 0.5);
  assert.ok(Math.max(...Array.from({ length: 1000 }, (_, i) => reconstruct('square', 101, i / 1000 / 10))) > 1.16);
});
test('seeded noise is deterministic and finite', () => {
  assert.deepEqual(noise(42, 128), noise(42, 128)); assert.notDeepEqual(noise(41, 128), noise(42, 128));
  noise(42, 2048).forEach((v) => assert.ok(Number.isFinite(v)));
  complexNear(multiply(exp(0.7), exp(-0.7)), { re: 1, im: 0 });
});
