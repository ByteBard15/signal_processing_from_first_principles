import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { movingAverage, discreteConvolution } from '../filters/index.mjs';
import { dtft } from '../transforms/dft.mjs';
import { magnitude, multiply } from '../math/complex.mjs';
import { linspace, TAU } from '../math/numeric.mjs';
export default function FilterSpectrumExplorer(root) {
  const f = figure(root, 'filter'); f.slider('length', 'Moving-average length', 1, 15, 2);
  const canvases = ['Input x[n]', 'Kernel h[n]', 'Full linear convolution y[n]', 'Input spectrum |X|', 'Filter response |H|', 'Output spectrum |Y| = |XH|'].map((v) => f.canvas(v, 220));
  const x = Array.from({ length: 48 }, (_, n) => Math.sin(TAU * 0.06 * n) + 0.5 * Math.sin(TAU * 0.35 * n));
  f.start(() => {
    const h = movingAverage(f.state.length), y = discreteConvolution(x, h), w = linspace(0, Math.PI, 200);
    [x, h, y].forEach((values, i) => plot(canvases[i], [{ x: values.map((_, n) => n), y: values, label: ['x', 'h', 'y'][i], markers: true }],
    { xDomain: [0, y.length - 1], yDomain: i === 1 ? [0, 1.1] : [-1.6, 1.6], xLabel: 'Sample index n', yLabel: 'Amplitude' }));
    const X = w.map((v) => dtft(x, v)), H = w.map((v) => dtft(h, v)), Y = w.map((v) => dtft(y, v));
    [X, H, Y].forEach((values, i) => plot(canvases[i + 3], [{ x: w, y: values.map(magnitude), label: ['|X|', '|H|', '|Y|'][i] }],
    { xDomain: [0, Math.PI], yDomain: [0, i === 1 ? 1.1 : 26], xLabel: 'Normalized frequency (rad/sample)', yLabel: 'Magnitude' }));
    const error = Math.max(...Y.map((v, i) => { const predicted = multiply(X[i], H[i]); return Math.hypot(v.re - predicted.re, v.im - predicted.im); }));
    f.observation.textContent = `Maximum complex |Y−XH| on the displayed grid: ${error.toExponential(2)}. What to notice: a longer average narrows the low-frequency pass region. Full output length ${y.length} avoids confusing linear convolution with an unpadded circular DFT convolution.`;
  });
}
