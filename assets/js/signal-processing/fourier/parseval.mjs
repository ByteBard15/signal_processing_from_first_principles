import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { linspace } from '../math/numeric.mjs';
import { harmonicPower, reconstruct } from '../transforms/fourier-series.mjs';
export default function ParsevalEnergyExplorer(root) {
  const f = figure(root, 'parseval'); f.slider('harmonics', 'Highest harmonic N', 1, 101);
  const signal = f.canvas('Square-wave partial sum'), bars = f.canvas('Power by harmonic and cumulative captured power');
  f.start(() => {
    const n = Array.from({ length: f.state.harmonics }, (_, i) => i + 1), energy = n.map((i) => harmonicPower('square', i));
    let total = 0; const cumulative = energy.map((v) => (total += v)); const t = linspace(0, 1);
    plot(signal, [{ x: t, y: t.map((v) => reconstruct('square', f.state.harmonics, v)), label: 'Partial sum' }],
    { xDomain: [0, 1], yDomain: [-1.4, 1.4], xLabel: 'Time (s)', yLabel: 'Amplitude' });
    plot(bars, [{ x: n, y: energy, label: 'b_n² / 2', stems: true }, { x: n, y: cumulative, label: 'Cumulative power' }],
    { xDomain: [0, Math.max(2, f.state.harmonics)], yDomain: [0, 1.1], xLabel: 'Harmonic index n', yLabel: 'Mean-square amplitude' });
    f.observation.textContent = `Captured power = ${total.toFixed(5)} of total power 1. Mean-square residual = ${(1 - total).toFixed(5)}. What to notice: the remaining energy tends to zero even though the discontinuity retains an overshoot.`;
  });
}
