import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
export default function PeriodicExtensionExplorer(root) {
  const f = figure(root, 'periodic'); f.select('repeat', 'How to display the record', [['single', 'Stored data only'], ['periodic', 'DFT mathematical interpretation']]);
  const canvas = f.canvas('Eight measured values or their mathematical periodic extension');
  const x = [0.2, 0.6, 1, 0.7, 0.3, -0.1, -0.5, -0.8];
  f.start(() => {
    const indices = f.state.repeat === 'single' ? x.map((_, n) => n) : Array.from({ length: 40 }, (_, n) => n - 16);
    plot(canvas, [{ x: indices, y: indices.map((n) => x[((n % 8) + 8) % 8]), label: f.state.repeat === 'single' ? 'Stored samples' : 'Repeated basis interpretation', markers: true, stems: true }],
    { xDomain: [-16, 23], yDomain: [-1.2, 1.2], xLabel: 'Sample index n', yLabel: 'Amplitude' });
    f.observation.textContent = 'What to notice: the end-to-start boundary has a jump. The DFT basis repeats every eight samples; switching this view generates no new measurements. The boundary helps explain leakage in an off-bin record.';
  });
}
