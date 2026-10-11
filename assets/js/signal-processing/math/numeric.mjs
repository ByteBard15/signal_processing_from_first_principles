export const TAU = 2 * Math.PI;
export function positive(value, name = 'value') {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be positive`);
}
export function integer(value, minimum = 1, name = 'count') {
  if (!Number.isInteger(value) || value < minimum) throw new RangeError(`${name} must be an integer ≥ ${minimum}`);
}
export const linspace = (a, b, n = 512) => Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));
export const sinc = (u) => Math.abs(u) < 1e-12 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u);
export function integrate(fn, a, b, count = 2048) {
  integer(count);
  const dt = (b - a) / count;
  let sum = (fn(a) + fn(b)) / 2;
  for (let i = 1; i < count; i++) sum += fn(a + i * dt);
  return sum * dt;
}
export function accumulated(values, step) {
  let total = 0;
  return values.map((v, i) => {
    if (i) total += (values[i - 1] + v) * step / 2;
    return total;
  });
}
