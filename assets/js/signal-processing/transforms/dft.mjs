import { complex, asComplex, add, multiply, exp } from '../math/complex.mjs';
import { TAU, integer, positive } from '../math/numeric.mjs';
export function directDFT(input, inverse = false) {
  integer(input.length);
  const x = input.map(asComplex), N = x.length;
  return Array.from({ length: N }, (_, k) => {
    let sum = complex();
    for (let n = 0; n < N; n++) sum = add(sum, multiply(x[n], exp((inverse ? 1 : -1) * TAU * k * n / N)));
    return inverse ? complex(sum.re / N, sum.im / N) : sum;
  });
}
export const inverseDFT = (input) => directDFT(input, true);
export function frequencyBins(count, sampleRate) {
  integer(count); positive(sampleRate);
  return Array.from({ length: count }, (_, k) => k * sampleRate / count);
}
export function dtft(input, omega) {
  return input.reduce((sum, v, n) => add(sum, multiply(asComplex(v), exp(-omega * n))), complex());
}
