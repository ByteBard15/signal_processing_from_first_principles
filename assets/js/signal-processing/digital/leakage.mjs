import { figure } from '../shared/figure.mjs';
import { plot, spectrumPlot } from '../shared/plot.mjs';
import { windowValues } from '../windows/index.mjs';
import { magnitudeSpectrum } from '../spectral/index.mjs';
import { dtft } from '../transforms/dft.mjs';
import { magnitude } from '../math/complex.mjs';
import { linspace, TAU } from '../math/numeric.mjs';
export default function WindowLeakageExplorer(root) {
  const f = figure(root, 'leakage'); f.slider('frequency', 'Tone frequency', 45, 55, 0.1, 'Hz');
  f.select('count', 'Number of samples', ['64', '128', '256', '512']); f.select('window', 'Window', ['rectangular', 'hann', 'hamming']);
  const windowCanvas = f.canvas('Observation window'), signal = f.canvas('Windowed tone'), spectrum = f.canvas('Tone spectrum'), response = f.canvas('Window transform: main lobe and sidelobes');
  f.start(() => {
    const N = Number(f.state.count), fs = 512, w = windowValues(f.state.window, N), n = w.map((_, i) => i), samples = n.map((i) => Math.sin(TAU * f.state.frequency * i / fs));
    plot(windowCanvas, [{ x: n, y: w, label: f.state.window }], { xDomain: [0, N - 1], yDomain: [0, 1.1], xLabel: 'Sample index n', yLabel: 'Weight' });
    plot(signal, [{ x: n, y: samples.map((v, i) => v * w[i]), label: 'Window × input' }], { xDomain: [0, N - 1], yDomain: [-1.1, 1.1], xLabel: 'Sample index n', yLabel: 'Amplitude' });
    spectrumPlot(spectrum, magnitudeSpectrum(samples, fs, f.state.window), { logarithmic: true, xDomain: [20, 85], label: 'Coherent-gain corrected amplitude' });
    const offset = linspace(-8, 8, 400), gain = w.reduce((a, b) => a + b, 0), y = offset.map((v) => 20 * Math.log10(Math.max(1e-6, magnitude(dtft(w, TAU * v / N)) / gain)));
    plot(response, [{ x: offset, y, label: '|W| / sum(w)' }], { xDomain: [-8, 8], yDomain: [-100, 2], xLabel: 'Frequency offset (DFT bin widths)', yLabel: 'Window magnitude (dB)' });
    f.observation.textContent = `Δf = ${(fs / N).toFixed(2)} Hz. Approximate null-to-null main-lobe width: ${f.state.window === 'rectangular' ? '2' : '4'} bins for large N. What to notice: Hann/Hamming lower sidelobes but broaden the central lobe. The displayed window uses the symmetric N−1 convention; dB curves are floored at −120 dB.`;
  });
}
