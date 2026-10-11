import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { linspace } from '../math/numeric.mjs';
import { waveform } from '../signals/index.mjs';
import { reconstruct } from '../transforms/fourier-series.mjs';
export default function FourierSeriesReconstruction(root) {
  const f = figure(root, 'series'); f.slider('harmonics', 'Highest harmonic N', 1, 101, 1);
  f.select('waveform', 'Target waveform', ['square', 'triangle', 'sawtooth']);
  const canvas = f.canvas('Target and harmonic partial sum'); const t = linspace(-1, 1, 1000);
  f.start(() => {
    plot(canvas, [{ x: t, y: t.map((v) => waveform(f.state.waveform, v)), label: 'Target' },
      { x: t, y: t.map((v) => reconstruct(f.state.waveform, f.state.harmonics, v)), label: `S_${f.state.harmonics}` }],
    { xDomain: [-1, 1], yDomain: [-1.4, 1.4], xLabel: 'Time (s); period = 1 s', yLabel: 'Amplitude' });
    f.observation.textContent = `S_N(t) = sum from n=1 to ${f.state.harmonics} of b_n sin(2πnt). N is the highest included harmonic index, including zero coefficients. What to notice: smooth triangles converge faster because their coefficients decay as 1/n².`;
  });
}
