import { integrate, positive } from '../math/numeric.mjs';
import { complex } from '../math/complex.mjs';

// h(t) has unit area; responseTime is in seconds.
export function exponentialResponse(t, responseTime) {
  positive(responseTime, 'response time');
  return t < 0 ? 0 : Math.exp(-t / responseTime) / responseTime;
}
export function exponentialTransform(omega, responseTime) {
  positive(responseTime, 'response time');
  const a = omega * responseTime;
  return complex(1 / (1 + a * a), -a / (1 + a * a));
}
// Analytic output for a unit-height pulse beginning at zero.
export function pulseResponse(t, width, responseTime) {
  positive(width, 'pulse width'); positive(responseTime, 'response time');
  if (t <= 0) return 0;
  const rise = -Math.expm1(-Math.min(t, width) / responseTime);
  return t <= width ? rise : rise * Math.exp(-(t - width) / responseTime);
}
// Finite-domain quadrature: callers specify a justified integration interval.
export function continuousConvolutionAt(x, h, time, start, end, count = 1024) {
  return integrate((inputTime) => x(inputTime) * h(time - inputTime), start, end, count);
}
