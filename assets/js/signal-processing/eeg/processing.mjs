import { periodogram, welch } from '../spectral/index.mjs';

export function demean(values) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.map((value) => value - mean);
}

export function detrend(values) {
  const N = values.length, center = (N - 1) / 2;
  const mean = values.reduce((sum, value) => sum + value, 0) / N;
  const denominator = values.reduce((sum, _, n) => sum + (n - center) ** 2, 0);
  const slope = values.reduce((sum, value, n) => sum + (n - center) * (value - mean), 0) / denominator;
  return values.map((value, n) => value - mean - slope * (n - center));
}

function biquad(type, cutoff, sampleRate, q = Math.SQRT1_2) {
  const omega = 2 * Math.PI * cutoff / sampleRate, cosine = Math.cos(omega), sine = Math.sin(omega), alpha = sine / (2 * q);
  let b0, b1, b2;
  if (type === 'lowpass') { b0 = (1 - cosine) / 2; b1 = 1 - cosine; b2 = b0; }
  else if (type === 'highpass') { b0 = (1 + cosine) / 2; b1 = -(1 + cosine); b2 = b0; }
  else if (type === 'notch') { b0 = 1; b1 = -2 * cosine; b2 = 1; }
  else throw new RangeError(`Unknown filter ${type}`);
  const a0 = 1 + alpha, a1 = -2 * cosine, a2 = 1 - alpha;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

function apply(values, coefficients) {
  const { b0, b1, b2, a1, a2 } = coefficients, output = [];
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (const x0 of values) {
    const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    output.push(y0); x2 = x1; x1 = x0; y2 = y1; y1 = y0;
  }
  return output;
}
const zeroPhase = (values, coefficients) => apply(apply(values, coefficients).reverse(), coefficients).reverse();

export function condition(values, sampleRate, { highpass = 1, lowpass = 40, notch = false, line = 60 } = {}) {
  let output = detrend(values);
  if (highpass > 0) output = zeroPhase(output, biquad('highpass', highpass, sampleRate));
  if (lowpass > 0 && lowpass < sampleRate / 2) output = zeroPhase(output, biquad('lowpass', lowpass, sampleRate));
  if (notch && line < sampleRate / 2) output = zeroPhase(output, biquad('notch', line, sampleRate, 25));
  return output;
}

export function response(frequencies, sampleRate, options) {
  const filters = [];
  if (options.highpass > 0) filters.push(biquad('highpass', options.highpass, sampleRate));
  if (options.lowpass > 0 && options.lowpass < sampleRate / 2) filters.push(biquad('lowpass', options.lowpass, sampleRate));
  if (options.notch && options.line < sampleRate / 2) filters.push(biquad('notch', options.line, sampleRate, 25));
  return frequencies.map((frequency) => {
    const z1 = { re: Math.cos(-2 * Math.PI * frequency / sampleRate), im: Math.sin(-2 * Math.PI * frequency / sampleRate) };
    const z2 = { re: Math.cos(-4 * Math.PI * frequency / sampleRate), im: Math.sin(-4 * Math.PI * frequency / sampleRate) };
    return filters.reduce((gain, c) => {
      const nr = c.b0 + c.b1 * z1.re + c.b2 * z2.re, ni = c.b1 * z1.im + c.b2 * z2.im;
      const dr = 1 + c.a1 * z1.re + c.a2 * z2.re, di = c.a1 * z1.im + c.a2 * z2.im;
      return gain * (nr * nr + ni * ni) / (dr * dr + di * di);
    }, 1); // forward-backward filtering squares the single-pass magnitude
  });
}

export function integrateBand(spectrum, low, high) {
  let area = 0;
  for (let i = 1; i < spectrum.frequencies.length; i++) {
    const f0 = spectrum.frequencies[i - 1], f1 = spectrum.frequencies[i];
    if (f0 >= low && f1 <= high) area += (spectrum.values[i - 1] + spectrum.values[i]) * (f1 - f0) / 2;
  }
  return area;
}

export function epochSpectra(epochs, channel, sampleRate, options = {}) {
  const length = options.length || 512;
  return epochs.map((epoch) => periodogram(condition(epoch.channels[channel], sampleRate, options).slice(0, length), sampleRate, options.window || 'hann'));
}

export function meanSpectrum(spectra) {
  return { frequencies: spectra[0].frequencies, values: spectra[0].values.map((_, k) => spectra.reduce((sum, spectrum) => sum + spectrum.values[k], 0) / spectra.length),
    spread: spectra[0].values.map((_, k) => {
      const values = spectra.map((spectrum) => spectrum.values[k]).sort((a, b) => a - b);
      return [values[Math.floor(0.25 * (values.length - 1))], values[Math.ceil(0.75 * (values.length - 1))]];
    }) };
}

export function welchEpoch(epoch, channel, sampleRate, length, overlap, window, options = {}) {
  return welch(condition(epoch.channels[channel], sampleRate, options), sampleRate, length, overlap, window);
}

