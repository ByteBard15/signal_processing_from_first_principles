import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { linspace, sinc } from '../math/numeric.mjs';
import { sampleSignal, spectralReplicas } from '../sampling/index.mjs';
export default function SamplingExplorer(root) {
  const f = figure(root, 'sampling'); f.slider('bandwidth', 'Band limit B', 2, 12, 0.5, 'Hz'); f.slider('sampleRate', 'Sampling rate f_s', 8, 50, 1, 'samples/s');
  const time = f.canvas('Bandlimited sinc pulse and samples'), original = f.canvas('Original rectangular spectrum'), copies = f.canvas('Replicas at integer multiples of f_s');
  f.start(() => {
    const { bandwidth: B, sampleRate: fs } = f.state, fn = (t) => sinc(2 * B * t), t = linspace(-0.5, 0.5);
    const s = sampleSignal(fn, fs, Math.floor(fs) + 1, -0.5), timestamps = s.samples.map((_, n) => -0.5 + n / fs);
    plot(time, [{ x: t, y: t.map(fn), label: 'sinc(2Bt)' }, { x: timestamps, y: s.samples, label: 'Sample values (impulse weights)', stems: true, markers: true }],
    { xDomain: [-0.5, 0.5], yDomain: [-0.35, 1.2], xLabel: 'Time (s)', yLabel: 'Amplitude' });
    const freq = linspace(-100, 100, 1200), X = (v) => Math.abs(v) < B ? 1 / (2 * B) : 0;
    plot(original, [{ x: freq, y: freq.map(X), label: 'X(2πf)' }], { xDomain: [-100, 100], yDomain: [0, 0.3], xLabel: 'Frequency (Hz)', yLabel: 'Transform (amplitude·s)' });
    plot(copies, [{ x: freq, y: freq.map((v) => spectralReplicas(X, v, fs, 16)), label: 'X_s(2πf)/f_s', }].map((c) => ({ ...c, y: c.y.map((v) => v / fs) })),
    { xDomain: [-100, 100], yDomain: [0, 0.6], xLabel: 'Frequency (Hz)', yLabel: 'X_s/f_s (amplitude·s)' });
    f.observation.textContent = `f_s ${fs > 2 * B ? '>' : '≤'} 2B = ${2 * B} samples/s. What to notice: replicas ${fs > 2 * B ? 'are separated' : 'touch or overlap'}. The sampled spectrum is divided by f_s here to compare shapes; sampling also multiplies its scale by f_s.`;
  });
}
