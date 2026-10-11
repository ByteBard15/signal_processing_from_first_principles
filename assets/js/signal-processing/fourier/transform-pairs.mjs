import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { linspace } from '../math/numeric.mjs';
import { pulse, gaussian } from '../signals/index.mjs';
import { rectangleTransform, gaussianTransform } from '../transforms/fourier-series.mjs';
export function RectangleTransformExplorer(root) {
  const f = figure(root, 'rectangle'); f.slider('width', 'Pulse width', 0.2, 2, 0.05, 's'); f.slider('shift', 'Time shift', -1, 1, 0.05, 's');
  const time = f.canvas('Shifted rectangular pulse'), spectrum = f.canvas('Real and imaginary transform: the shift changes phase');
  const t = linspace(-3, 3), w = linspace(-30, 30);
  f.start(() => {
    plot(time, [{ x: t, y: t.map((v) => pulse(v - f.state.shift, f.state.width)), label: 'Pulse' }], { xDomain: [-3, 3], yDomain: [-0.1, 1.2], xLabel: 'Time (s)', yLabel: 'Amplitude' });
    const X = w.map((v) => rectangleTransform(v, f.state.width));
    plot(spectrum, [{ x: w, y: X.map((v, i) => v * Math.cos(w[i] * f.state.shift)), label: 'Re X' },
      { x: w, y: X.map((v, i) => -v * Math.sin(w[i] * f.state.shift)), label: 'Im X' }, { x: w, y: X.map(Math.abs), label: '|X|' }],
    { xDomain: [-30, 30], yDomain: [-f.state.width * 1.1, f.state.width * 1.1], xLabel: 'Angular frequency (rad/s)', yLabel: 'Transform (amplitude·s)' });
    f.observation.textContent = 'What to notice: widening the pulse moves the sinc zeros inward. Moving it in time leaves |X| fixed and rotates the complex transform by −ωt₀. The jump edges produce a slow 1/|ω| envelope.';
  });
}
export function GaussianTransformExplorer(root) {
  const f = figure(root, 'gaussian'); f.slider('sigma', 'Gaussian time width σ', 0.15, 0.8, 0.01, 's');
  f.slider('modulation', 'Cosine modulation Ω', 0, 20, 0.5, 'rad/s');
  const time = f.canvas('Gaussian envelope with real modulation'), spectrum = f.canvas('Two shifted Gaussian transform copies');
  const t = linspace(-3, 3), w = linspace(-35, 35);
  f.start(() => {
    plot(time, [{ x: t, y: t.map((v) => gaussian(v, f.state.sigma) * Math.cos(f.state.modulation * v)), label: 'g(t) cos Ωt' }],
    { xDomain: [-3, 3], yDomain: [-1.1, 1.1], xLabel: 'Time (s)', yLabel: 'Amplitude' });
    plot(spectrum, [{ x: w, y: w.map((v) => (gaussianTransform(v - f.state.modulation, f.state.sigma) + gaussianTransform(v + f.state.modulation, f.state.sigma)) / 2), label: '[G(ω−Ω)+G(ω+Ω)]/2' }],
    { xDomain: [-35, 35], yDomain: [0, 2.1], xLabel: 'Angular frequency (rad/s)', yLabel: 'Transform (amplitude·s)' });
    f.observation.textContent = 'What to notice: a narrow pulse requires a broad spectrum. Real cosine modulation shifts half the envelope in each frequency direction; it does not create just one positive-frequency copy.';
  });
}
