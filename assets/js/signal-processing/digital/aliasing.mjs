import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { linspace } from '../math/numeric.mjs';
import { oscillator } from '../signals/index.mjs';
import { aliasFrequency, sampleSignal } from '../sampling/index.mjs';
export default function AliasingExplorer(root) {
  const f = figure(root, 'aliasing'); f.slider('frequency', 'True frequency', 1, 60, 0.5, 'Hz'); f.slider('sampleRate', 'Sampling rate', 8, 60, 1, 'samples/s');
  const canvas = f.canvas('Different continuous sinusoids, identical sample values');
  f.start(() => {
    const fs = f.state.sampleRate, alias = aliasFrequency(f.state.frequency, fs);
    const fn = oscillator({ kind: 'sine', frequency: f.state.frequency }), apparent = oscillator({ kind: 'sine', frequency: alias });
    const t = linspace(0, 1, 1200), signal = sampleSignal(fn, fs, Math.floor(fs) + 1);
    plot(canvas, [{ x: t, y: t.map(fn), label: `True ${f.state.frequency} Hz` },
      { x: t, y: t.map(apparent), label: `Signed alias ${alias.toFixed(2)} Hz` },
      { x: signal.samples.map((_, n) => n / fs), y: signal.samples, label: 'Samples', stems: true, markers: true }],
    { xDomain: [0, 1], yDomain: [-1.2, 1.2], xLabel: 'Time (s)', yLabel: 'Amplitude' });
    f.observation.textContent = `Baseband magnitude: ${Math.abs(alias).toFixed(2)} Hz; signed alias: ${alias.toFixed(2)} Hz. What to notice: both curves pass through the same sample points. A negative signed alias reverses sine phase; taking the absolute frequency without correcting phase would give the wrong samples.`;
  });
}
