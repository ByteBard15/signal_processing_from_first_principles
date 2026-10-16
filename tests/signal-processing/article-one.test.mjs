import test from 'node:test';
import assert from 'node:assert/strict';
import { integrate, TAU } from '../../assets/js/signal-processing/math/numeric.mjs';
import { coefficient, reconstruct, squareWavePeak } from '../../assets/js/signal-processing/transforms/fourier-series.mjs';
import { waveform } from '../../assets/js/signal-processing/signals/index.mjs';
import { exponentialResponse, exponentialTransform, pulseResponse, continuousConvolutionAt } from '../../assets/js/signal-processing/filters/continuous.mjs';
const near = (a, b, tolerance = 1e-7) => assert.ok(Math.abs(a - b) < tolerance, `${a} ≠ ${b}`);

test('worked cosine/sine probes recover both quadratures and reject others', () => {
  const x = (t) => Math.cos(TAU * 3 * t) + 0.5 * Math.sin(TAU * 5 * t);
  near(integrate((t) => x(t) * Math.cos(TAU * 3 * t), 0, 1), 0.5);
  near(integrate((t) => x(t) * Math.sin(TAU * 5 * t), 0, 1), 0.25);
  near(integrate((t) => x(t) * Math.cos(TAU * 5 * t), 0, 1), 0);
  near(integrate((t) => x(t) * Math.cos(TAU * 4 * t), 0, 1), 0);
});
test('triangle and ramp analytic coefficients match projection integrals', () => {
  for (const type of ['triangle', 'sawtooth']) for (const n of [1, 2, 3, 4, 5, 9]) {
    // Split at waveform corners; integrate each smooth piece separately.
    const breaks = type === 'triangle' ? [-0.5, -0.25, 0, 0.25, 0.5] : [-0.5, 0, 0.5];
    let projection = 0;
    for (let i = 1; i < breaks.length; i++) {
      const fn = (t) => (type === 'sawtooth' ? 2 * t : waveform(type, t)) * Math.sin(TAU * n * t);
      projection += 2 * integrate(fn, breaks[i - 1], breaks[i], 8192);
    }
    near(projection, coefficient(type, n));
  }
});
test('Gibbs first peak uses odd-term count, not a conflicting N convention', () => {
  for (const N of [1, 2, 5, 6, 25, 26, 101, 151]) {
    const { distance, oddTerms, width } = squareWavePeak(N);
    assert.equal(oddTerms, Math.ceil(N / 2)); near(width, 2 * distance);
    const value = reconstruct('square', N, distance), step = distance / 100;
    assert.ok(value > reconstruct('square', N, distance - step));
    assert.ok(value > reconstruct('square', N, distance + step));
  }
  const sineIntegral = integrate((z) => z === 0 ? 1 : Math.sin(z) / z, 0, Math.PI, 4096);
  const limit = 2 / Math.PI * sineIntegral;
  near(limit, 1.17897974447, 1e-7);
  near(reconstruct('square', 1001, squareWavePeak(1001).distance), limit, 1e-6);
});
test('square-wave complex coefficients reconstruct the same finite sum', () => {
  for (const t of [0, 0.03, 0.2, 0.7]) {
    let real = 0, imaginary = 0;
    for (let k = -25; k <= 25; k++) {
      if (k === 0 || k % 2 === 0) continue;
      const im = -2 / (Math.PI * k);
      real += -im * Math.sin(TAU * k * t);
      imaginary += im * Math.cos(TAU * k * t);
    }
    near(real, reconstruct('square', 25, t)); near(imaginary, 0);
  }
});
test('pulse response equals its continuous convolution integral', () => {
  for (const responseTime of [0.1, 0.3, 1]) for (const t of [0.1, 0.5, 1, 1.5, 3]) {
    const h = (u) => exponentialResponse(u, responseTime);
    const numerical = continuousConvolutionAt(() => 1, h, t, 0, Math.min(t, 1), 4096);
    near(numerical, pulseResponse(t, 1, responseTime), 6e-7);
  }
  near(pulseResponse(-1, 1, 0.3), 0); near(pulseResponse(0, 1, 0.3), 0);
});
test('response transform matches direct real/imaginary quadrature', () => {
  for (const omega of [0, 1, 4, 10]) {
    const r = 0.3, h = (t) => exponentialResponse(t, r), H = exponentialTransform(omega, r);
    near(integrate((t) => h(t) * Math.cos(omega * t), 0, 30 * r, 32768), H.re, 1e-7);
    near(-integrate((t) => h(t) * Math.sin(omega * t), 0, 30 * r, 32768), H.im, 3e-7);
  }
  near(exponentialTransform(0, 0.3).re, 1);
  assert.throws(() => exponentialResponse(0, 0));
});
