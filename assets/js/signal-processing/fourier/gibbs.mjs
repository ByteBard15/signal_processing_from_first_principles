import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { linspace } from '../math/numeric.mjs';
import { waveform } from '../signals/index.mjs';
import { reconstruct } from '../transforms/fourier-series.mjs';
export default function GibbsExplorer(root) {
  const f = figure(root, 'gibbs'); f.slider('harmonics', 'Highest harmonic N', 3, 151, 2);
  f.slider('zoom', 'Half-width around the jump', 0.01, 0.25, 0.005, 's');
  const canvas = f.canvas('Jump at t = 0: shrinking ringing, persistent overshoot');
  f.start(() => {
    const t = linspace(-f.state.zoom, f.state.zoom, 1500), y = t.map((v) => reconstruct('square', f.state.harmonics, v));
    plot(canvas, [{ x: t, y: t.map((v) => waveform('square', v)), label: 'Square wave' }, { x: t, y, label: 'Partial sum' }],
    { xDomain: [-f.state.zoom, f.state.zoom], yDomain: [-1.3, 1.3], xLabel: 'Time from discontinuity (s)', yLabel: 'Amplitude' });
    f.observation.textContent = `Visible-grid peak: ${Math.max(...y).toFixed(4)}; overshoot ${(Math.max(0, Math.max(...y) - 1) / 2 * 100).toFixed(2)}% of the jump of 2. What to notice: the limiting peak is about 1.179, not 1. The numerical peak is restricted to this zoom window.`;
  });
}
