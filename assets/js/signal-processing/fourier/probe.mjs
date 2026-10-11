import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { linspace, TAU, accumulated } from '../math/numeric.mjs';
export default function FrequencyProbe(root) {
  const f = figure(root, 'probe'); f.slider('frequency', 'Probe frequency', 0, 8, 0.05, 'Hz');
  f.slider('duration', 'Integration interval', 1, 3, 0.25, 's');
  const a = f.canvas('Signal and cosine probe'), b = f.canvas('Pointwise product'), c = f.canvas('Running inner product');
  f.start(() => {
    const t = linspace(0, f.state.duration, 768), signal = t.map((v) => Math.cos(TAU * 3 * v) + 0.5 * Math.sin(TAU * 5 * v));
    const probe = t.map((v) => Math.cos(TAU * f.state.frequency * v)), product = signal.map((v, i) => v * probe[i]);
    const running = accumulated(product, t[1] - t[0]);
    const options = { xDomain: [0, f.state.duration], yDomain: [-1.6, 1.6], xLabel: 'Time (s)', yLabel: 'Amplitude' };
    plot(a, [{ x: t, y: signal, label: 'Signal' }, { x: t, y: probe, label: 'Cosine probe' }], options);
    plot(b, [{ x: t, y: product, label: 'Signal × probe' }], options);
    plot(c, [{ x: t, y: running, label: 'Accumulated integral' }], { ...options, yLabel: 'Integral (amplitude·s)', yDomain: [-0.2, f.state.duration] });
    f.observation.textContent = `Final integral: ${running.at(-1).toFixed(4)} amplitude·s. What to notice: 3 Hz gives a positive accumulation; a 5 Hz cosine misses the sine's quadrature. Integer frequencies cancel over an integer number of seconds; a noninteger probe or interval need not be orthogonal.`;
  });
}
