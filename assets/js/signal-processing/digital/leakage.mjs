import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { windowValues } from '../windows/index.mjs';
import { dtft } from '../transforms/dft.mjs';
import { magnitude } from '../math/complex.mjs';
import { linspace, TAU } from '../math/numeric.mjs';
export default function WindowLeakageExplorer(root) {
  const f = figure(root, 'leakage'); f.slider('frequency', 'Tone frequency', 45, 55, 0.1, 'Hz');
  f.select('count', 'Number of samples', ['64', '128', '256', '512']); f.select('window', 'Window', ['rectangular', 'hann', 'hamming']);
  f.select('padding', 'Zero-padding for displayed DFT', [['1', 'None (N points)'], ['2', '2N points'], ['4', '4N points'], ['8', '8N points']]);
  const windowCanvas = f.canvas('Observation window'), signal = f.canvas('Windowed tone'), spectrum = f.canvas('Tone spectrum'), response = f.canvas('Window transform: main lobe and sidelobes');
  f.start(() => {
    const N = Number(f.state.count), fs = 512, factor = Number(f.state.padding), w = windowValues(f.state.window, N), n = w.map((_, i) => i), samples = n.map((i) => Math.sin(TAU * f.state.frequency * i / fs));
    plot(windowCanvas, [{ x: n, y: w, label: f.state.window }], { xDomain: [0, N - 1], yDomain: [0, 1.1], xLabel: 'Sample index n', yLabel: 'Weight' });
    plot(signal, [{ x: n, y: samples.map((v, i) => v * w[i]), label: 'Window × input' }], { xDomain: [0, N - 1], yDomain: [-1.1, 1.1], xLabel: 'Sample index n', yLabel: 'Amplitude' });
    const gain = w.reduce((a, b) => a + b, 0), weighted = samples.map((v, i) => v * w[i]);
    const denseF = linspace(20, 85, 650), denseDb = denseF.map((hz) => 20 * Math.log10(Math.max(1e-6, 2 * magnitude(dtft(weighted, TAU * hz / fs)) / gain)));
    const M = N * factor, sampledF = Array.from({ length: M }, (_, k) => k * fs / M).filter((hz) => hz >= 20 && hz <= 85);
    const sampledDb = sampledF.map((hz) => 20 * Math.log10(Math.max(1e-6, 2 * magnitude(dtft(weighted, TAU * hz / fs)) / gain)));
    plot(spectrum, [
      { x: denseF, y: denseDb, label: 'same finite-record DTFT' },
      { x: sampledF, y: sampledDb, label: `${M}-point DFT samples`, markers: true, stems: true },
    ], { xDomain: [20, 85], yDomain: [-100, 6], xLabel: 'Frequency (Hz)', yLabel: 'Amplitude (dB re 1)' });
    const offset = linspace(-8, 8, 400), y = offset.map((v) => 20 * Math.log10(Math.max(1e-6, magnitude(dtft(w, TAU * v / N)) / gain)));
    plot(response, [{ x: offset, y, label: '|W| / sum(w)' }], { xDomain: [-8, 8], yDomain: [-100, 2], xLabel: 'Frequency offset (DFT bin widths)', yLabel: 'Window magnitude (dB)' });
    f.observation.textContent = `Measured duration = ${(N / fs).toFixed(3)} s; natural spacing = ${(fs / N).toFixed(2)} Hz; displayed ${M}-point spacing = ${(fs / M).toFixed(2)} Hz. Approximate null-to-null main-lobe width: ${f.state.window === 'rectangular' ? '2' : '4'} natural bins. Padding adds DFT markers along the same curve; it does not narrow that curve or add observations. Hann/Hamming lower sidelobes but broaden the central lobe.`;
  });
}
