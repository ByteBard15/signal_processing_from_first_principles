import { TAU, sinc, integer, positive } from '../math/numeric.mjs';
export function coefficient(type, n) {
  if (type === 'triangle') return n % 2 ? 8 * (-1) ** ((n - 1) / 2) / (Math.PI ** 2 * n * n) : 0;
  if (type === 'sawtooth') return 2 * (-1) ** (n + 1) / (Math.PI * n);
  return n % 2 ? 4 / (Math.PI * n) : 0;
}
export function reconstruct(type, count, t, period = 1) {
  let sum = 0;
  for (let n = 1; n <= count; n++) sum += coefficient(type, n) * Math.sin(TAU * n * t / period);
  return sum;
}
export const harmonicPower = (type, n) => coefficient(type, n) ** 2 / 2;
export const rectangleTransform = (omega, width = 1) => width * sinc(omega * width / TAU);
export const gaussianTransform = (omega, sigma = 0.4) => Math.sqrt(TAU) * sigma * Math.exp(-sigma * sigma * omega * omega / 2);
// N is the highest harmonic index, including zero even coefficients.
export function squareWavePeak(harmonics, period = 1) {
  integer(harmonics); positive(period, 'period');
  const oddTerms = Math.ceil(harmonics / 2);
  return { oddTerms, distance: period / (4 * oddTerms), width: period / (2 * oddTerms) };
}
