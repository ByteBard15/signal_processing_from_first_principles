import { asComplex, add, subtract, multiply, exp, complex } from '../math/complex.mjs';
import { TAU, integer } from '../math/numeric.mjs';
export function fftStages(input, inverse = false) {
  const N = input.length;
  integer(N);
  if ((N & (N - 1)) !== 0) throw new RangeError('Radix-2 FFT requires a power-of-two length');
  const bits = Math.log2(N), ordering = Array.from({ length: N }, (_, n) => {
    let reversed = 0;
    for (let i = 0; i < bits; i++) reversed = (reversed << 1) | ((n >> i) & 1);
    return reversed;
  });
  let values = ordering.map((i) => asComplex(input[i]));
  const stages = [{ size: 1, values: values.map(asComplex), butterflies: [], ordering }];
  for (let size = 2; size <= N; size *= 2) {
    const butterflies = [];
    for (let start = 0; start < N; start += size) {
      for (let j = 0; j < size / 2; j++) {
        const a = start + j, b = a + size / 2;
        const twiddle = exp((inverse ? 1 : -1) * TAU * j / size);
        const u = values[a], v = multiply(twiddle, values[b]);
        values[a] = add(u, v); values[b] = subtract(u, v);
        butterflies.push({ a, b, j, size, twiddle, u, v });
      }
    }
    stages.push({ size, values: values.map(asComplex), butterflies });
  }
  if (inverse) values = values.map((v) => complex(v.re / N, v.im / N));
  return { values, stages, ordering };
}
export const radix2FFT = (input) => fftStages(input).values;
export const inverseFFT = (input) => fftStages(input, true).values;
