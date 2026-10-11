import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { linspace, TAU } from '../math/numeric.mjs';
import { pulse } from '../signals/index.mjs';
import { rectangleTransform } from '../transforms/fourier-series.mjs';
export default function FourierLimitExplorer(root) {
  const f = figure(root, 'limit'); f.slider('period', 'Period T', 2, 30, 0.25, 's');
  f.select('envelope', 'Limiting transform envelope', [['show', 'Show'], ['hide', 'Hide']]);
  const time = f.canvas('Periodic copies of a unit-width pulse'), spectrum = f.canvas('C_k T samples the continuous transform');
  f.start(() => {
    const T = f.state.period, t = linspace(-20, 20, 1400);
    plot(time, [{ x: t, y: t.map((v) => pulse(v - Math.round(v / T) * T)), label: 'Periodic pulse train' }],
    { xDomain: [-20, 20], yDomain: [-0.1, 1.2], xLabel: 'Time (s)', yLabel: 'Amplitude' });
    const spacing = TAU / T, indices = Array.from({ length: 2 * Math.floor(20 / spacing) + 1 }, (_, i) => i - Math.floor(20 / spacing));
    const w = indices.map((k) => k * spacing), curves = [{ x: w, y: w.map((v) => rectangleTransform(v)), label: 'T C_k = X(kΔω)', stems: true }];
    if (f.state.envelope === 'show') { const dense = linspace(-20, 20); curves.push({ x: dense, y: dense.map((v) => rectangleTransform(v)), label: 'Continuous X(ω)' }); }
    plot(spectrum, curves, { xDomain: [-20, 20], yDomain: [-0.3, 1.15], xLabel: 'Angular frequency (rad/s)', yLabel: 'Scaled coefficient T C_k (s)' });
    f.observation.textContent = `Δω = 2π/T = ${spacing.toFixed(3)} rad/s. What to notice: the plot uses T C_k, not C_k. Actual coefficients shrink as 1/T while the reconstruction weights C_k = X(kΔω)Δω/(2π) form a Riemann sum.`;
  });
}
