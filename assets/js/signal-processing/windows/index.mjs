import { TAU, integer } from '../math/numeric.mjs';
export function windowValues(type, count) {
  integer(count);
  return Array.from({ length: count }, (_, n) => {
    if (count === 1 || type === 'rectangular') return 1;
    const angle = TAU * n / (count - 1);
    if (type === 'hann') return 0.5 - 0.5 * Math.cos(angle);
    if (type === 'hamming') return 0.54 - 0.46 * Math.cos(angle);
    if (type === 'blackman') return 0.42 - 0.5 * Math.cos(angle) + 0.08 * Math.cos(2 * angle);
    throw new RangeError(`Unknown window: ${type}`);
  });
}
