import { figure, element } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { noise } from '../signals/index.mjs';
import { movingAverage, discreteConvolution } from '../filters/index.mjs';
export default function ConvolutionExplorer(root) {
  const f = figure(root, 'convolution'); f.slider('length', 'Moving-average kernel length', 1, 9, 2); f.slider('position', 'Output sample index n', 8, 39);
  const canvas = f.canvas('Sliding weighted sum with highlighted input samples'), table = element('table'); f.plots.append(table);
  const random = noise(17, 40, 0.2), x = random.map((v, n) => Math.sin(n * 0.3) + v), indices = x.map((_, n) => n);
  f.start(() => {
    const h = movingAverage(f.state.length), y = discreteConvolution(x, h), n = f.state.position;
    const active = h.map((_, k) => n - k);
    plot(canvas, [{ x: indices, y: x, label: 'Input', markers: true }, { x: indices, y: y.slice(0, x.length), label: 'Causal average' },
      { x: active, y: active.map((k) => x[k]), label: 'Currently weighted samples', stems: true, markers: true }],
    { xDomain: [0, 39], yDomain: [-1.6, 1.6], xLabel: 'Sample index', yLabel: 'Amplitude' });
    table.replaceChildren(); const header = element('tr'); ['k', 'x[n−k]', 'h[k]', 'Product'].forEach((v) => header.append(element('th', v, { scope: 'col' }))); table.append(header);
    h.forEach((weight, k) => { const row = element('tr'); [k, x[n - k].toFixed(3), weight.toFixed(3), (x[n - k] * weight).toFixed(3)].forEach((v) => row.append(element('td', v))); table.append(row); });
    f.observation.textContent = `y[${n}] = ${y[n].toFixed(4)}. What to notice: each row contributes to the same output sample. A causal average uses current and previous inputs, which also delays features.`;
  });
}
