import { sinc, positive, integer } from '../math/numeric.mjs';
export { sampledSignal as sampleSignal } from '../signals/index.mjs';
// Signed baseband frequency preserves the sine's sign/phase at sample instants.
export function aliasFrequency(frequency, sampleRate) {
  positive(sampleRate);
  return ((frequency + sampleRate / 2) % sampleRate + sampleRate) % sampleRate - sampleRate / 2;
}
export function reconstructSinc(signal, t) {
  return signal.samples.reduce((sum, value, n) => sum + value * sinc((t - signal.startTime) * signal.sampleRate - n), 0);
}
export function spectralReplicas(transform, f, sampleRate, copies = 4) {
  positive(sampleRate); integer(copies, 0);
  let value = 0;
  for (let m = -copies; m <= copies; m++) value += sampleRate * transform(f - m * sampleRate);
  return value;
}
