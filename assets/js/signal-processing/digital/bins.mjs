import { figure } from '../shared/figure.mjs';
import { plot, spectrumPlot } from '../shared/plot.mjs';
import { sampleSignal } from '../sampling/index.mjs';
import { oscillator } from '../signals/index.mjs';
import { magnitudeSpectrum } from '../spectral/index.mjs';
export default function DFTBinExplorer(root) {
  const f = figure(root, 'bins'); f.slider('frequency', 'Input frequency', 5, 180, 0.5, 'Hz'); f.slider('sampleRate', 'Sampling rate', 256, 1024, 32, 'samples/s');
  f.select('count', 'Number of samples', [['64', '64'], ['128', '128'], ['256', '256'], ['512', '512']]);
  const signal = f.canvas('Observed samples'), spectrum = f.canvas('DFT coefficients at discrete frequency bins');
  f.start(() => {
    const N = Number(f.state.count), fs = f.state.sampleRate, x = sampleSignal(oscillator({ kind: 'sine', frequency: f.state.frequency }), fs, N);
    plot(signal, [{ x: x.samples.map((_, n) => n / fs), y: x.samples, label: 'Samples', markers: true }],
    { xDomain: [0, N / fs], yDomain: [-1.2, 1.2], xLabel: 'Time (s)', yLabel: 'Amplitude' });
    spectrumPlot(spectrum, magnitudeSpectrum(x.samples, fs), { label: 'One-sided amplitude' });
    const k = f.state.frequency * N / fs;
    f.observation.textContent = `Δf = f_s/N = ${(fs / N).toFixed(3)} Hz; observation = ${(N / fs).toFixed(3)} s; input bin coordinate = ${k.toFixed(3)}. What to notice: integer k aligns with a basis sinusoid. ${f.state.frequency >= fs / 2 ? 'This setting is at or above Nyquist and may alias.' : 'Between-bin tones spread across bins even without noise.'}`;
  });
}
