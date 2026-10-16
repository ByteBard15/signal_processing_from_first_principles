import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { linspace, sinc } from '../math/numeric.mjs';
import { oscillator } from '../signals/index.mjs';
import { sampleSignal, reconstructSinc, aliasFrequency } from '../sampling/index.mjs';
export default function SincReconstructionExplorer(root) {
  const f = figure(root, 'sinc'); f.slider('frequency', 'True sinusoid frequency', 1, 30, 0.5, 'Hz'); f.slider('sampleRate', 'Sampling rate', 8, 60, 1, 'samples/s');
  f.slider('count', 'Number of retained samples', 15, 121, 2);
  f.slider('selected', 'Selected sample offset', -4, 4, 1, 'samples');
  const kernels = f.canvas('Convolution view: impulses and shifted sinc responses');
  const canvas = f.canvas('Finite sinc reconstruction: sum of every response');
  f.start(() => {
    const fs = f.state.sampleRate, fn = oscillator({ kind: 'sine', frequency: f.state.frequency }), start = -(f.state.count - 1) / (2 * fs);
    const s = sampleSignal(fn, fs, f.state.count, start), end = -start, t = linspace(start, end, 700);
    const centre = (f.state.count - 1) / 2;
    const selected = centre + f.state.selected;
    const sampleTimes = s.samples.map((_, n) => start + n / fs);
    const shown = [];
    for (let n = Math.max(0, selected - 3); n <= Math.min(s.samples.length - 1, selected + 3); n += 1) {
      shown.push({
        x: t,
        y: t.map((time) => s.samples[n] * sinc((time - sampleTimes[n]) * fs)),
        label: n === selected ? `Selected response x[${f.state.selected}] sinc(·)` : `Response ${n - centre}`,
      });
    }
    plot(kernels, [...shown,
      { x: sampleTimes, y: s.samples, label: 'Weighted impulses x[n]', markers: true, stems: true }],
    { xDomain: [Math.max(start, -5 / fs), Math.min(end, 5 / fs)], yDomain: [-1.5, 1.5], xLabel: 'Time (s)', yLabel: 'Contribution' });
    plot(canvas, [{ x: t, y: t.map(fn), label: 'Original' }, { x: t, y: t.map((v) => reconstructSinc(s, v)), label: 'Finite sinc sum' },
      { x: sampleTimes, y: s.samples, label: 'Samples', markers: true, stems: true }],
    { xDomain: [start, end], yDomain: [-1.5, 1.5], xLabel: 'Time (s)', yLabel: 'Amplitude' });
    f.observation.textContent = `At the selected sample time, its sinc response contributes x[${f.state.selected}] = ${s.samples[selected].toFixed(3)}; every other sinc is zero there. Their sum therefore passes through that sample exactly. Signed baseband alias = ${aliasFrequency(f.state.frequency, fs).toFixed(2)} Hz. The finite sum loses sinc tails near its edges; below Nyquist it approaches the alias rather than the true source.`;
  });
}
