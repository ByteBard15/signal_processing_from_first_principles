import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { noise } from '../signals/index.mjs';
import { TAU } from '../math/numeric.mjs';
import { periodogram, welch } from '../spectral/index.mjs';
export default function WelchExplorer(root) {
  const f = figure(root, 'welch'); f.select('length', 'Welch segment length', ['64', '128', '256', '512']); f.slider('noise', 'Noise RMS amplitude', 0.2, 1, 0.05); f.slider('seed', 'Noise realization seed', 1, 100);
  const canvas = f.canvas('One raw periodogram versus averaged segments');
  f.start(() => {
    const fs = 256, x = noise(f.state.seed, 2048, f.state.noise).map((v, n) => v + 0.5 * Math.sin(TAU * 30 * n / fs));
    const raw = periodogram(x, fs), average = welch(x, fs, Number(f.state.length), 0.5), db = (v) => 10 * Math.log10(Math.max(1e-10, v));
    plot(canvas, [{ x: raw.frequencies, y: raw.values.map(db), label: 'Full-record periodogram' }, { x: average.frequencies, y: average.values.map(db), label: 'Welch (Hann, 50% overlap)' }],
    { xDomain: [0, fs / 2], yDomain: [-65, 0], xLabel: 'Frequency (Hz)', yLabel: 'PSD (dB re 1 amplitude²/Hz)' });
    f.observation.textContent = `${average.segments} complete segments averaged; Welch spacing ${(fs / Number(f.state.length)).toFixed(2)} Hz, raw spacing ${(fs / x.length).toFixed(3)} Hz. What to notice: change the seed to compare realizations. Welch reduces random variability at the cost of a shorter effective observation and a broader tone peak; overlapping estimates are correlated.`;
  });
}
