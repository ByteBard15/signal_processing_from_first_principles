import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { linspace } from '../math/numeric.mjs';
import { oscillator } from '../signals/index.mjs';
import { sampleSignal, reconstructSinc, aliasFrequency } from '../sampling/index.mjs';
export default function SincReconstructionExplorer(root) {
  const f = figure(root, 'sinc'); f.slider('frequency', 'True sinusoid frequency', 1, 30, 0.5, 'Hz'); f.slider('sampleRate', 'Sampling rate', 8, 60, 1, 'samples/s');
  f.slider('count', 'Number of retained samples', 15, 121, 2);
  const canvas = f.canvas('Finite sinc reconstruction: interior accuracy and edge truncation');
  f.start(() => {
    const fs = f.state.sampleRate, fn = oscillator({ kind: 'sine', frequency: f.state.frequency }), start = -(f.state.count - 1) / (2 * fs);
    const s = sampleSignal(fn, fs, f.state.count, start), end = -start, t = linspace(start, end, 700);
    plot(canvas, [{ x: t, y: t.map(fn), label: 'Original' }, { x: t, y: t.map((v) => reconstructSinc(s, v)), label: 'Finite sinc sum' },
      { x: s.samples.map((_, n) => start + n / fs), y: s.samples, label: 'Samples', markers: true, stems: true }],
    { xDomain: [start, end], yDomain: [-1.5, 1.5], xLabel: 'Time (s)', yLabel: 'Amplitude' });
    f.observation.textContent = `Signed baseband alias = ${aliasFrequency(f.state.frequency, fs).toFixed(2)} Hz. What to notice: this is a finite truncation of an infinite formula, so edges remain imperfect even above Nyquist. Below Nyquist, adding samples converges toward the aliased waveform, not the true source.`;
  });
}
