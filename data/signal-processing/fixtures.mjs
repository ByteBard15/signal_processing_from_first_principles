export const impulse = (N = 8) => Array.from({ length: N }, (_, n) => n === 0 ? 1 : 0);
export const constant = (N = 8) => Array(N).fill(1);
export const binTone = (N = 8, k = 1) => Array.from({ length: N }, (_, n) => Math.cos(2 * Math.PI * k * n / N));
export const twoTone = (N = 128, sampleRate = 512) => Array.from({ length: N }, (_, n) => Math.sin(2 * Math.PI * 50 * n / sampleRate) + 0.4 * Math.sin(2 * Math.PI * 120 * n / sampleRate));
