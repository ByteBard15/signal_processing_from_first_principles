import { integer } from '../math/numeric.mjs';
export function discreteConvolution(x, h) {
  if (!x.length || !h.length) return [];
  const output = Array(x.length + h.length - 1).fill(0);
  x.forEach((v, n) => h.forEach((weight, k) => { output[n + k] += v * weight; }));
  return output;
}
export function movingAverage(count) {
  integer(count);
  return Array(count).fill(1 / count);
}
