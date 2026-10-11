import { figure } from '../shared/figure.mjs';
import { plot, spectrumPlot, spectrogram } from '../shared/plot.mjs';
import { TAU } from '../math/numeric.mjs';
import { stft, magnitudeSpectrum } from '../spectral/index.mjs';
export default function STFTExplorer(root) {
  const f = figure(root, 'stft'); f.select('length', 'STFT window length', ['32', '64', '128', '256']); f.slider('overlap', 'Window overlap fraction', 0, 0.875, 0.125);
  const signal = f.canvas('20 Hz before two seconds; 60 Hz afterward'), spectrum = f.canvas('Whole-record FFT cannot locate the change'), heat = f.canvas('Spectrogram: shorter windows localize the switch', 340);
  const fs = 256, t = Array.from({ length: 1024 }, (_, n) => n / fs), x = t.map((v) => Math.sin(TAU * (v < 2 ? 20 : 60) * v));
  f.start(() => {
    plot(signal, [{ x: t, y: x, label: 'Two successive tones' }], { xDomain: [0, 4], yDomain: [-1.2, 1.2], xLabel: 'Time (s)', yLabel: 'Amplitude' });
    spectrumPlot(spectrum, magnitudeSpectrum(x, fs), { label: 'Whole-record FFT' });
    const result = stft(x, fs, Number(f.state.length), f.state.overlap); spectrogram(heat, result, [0, 4]);
    f.observation.textContent = `Window duration ${(Number(f.state.length) / fs).toFixed(3)} s; frequency spacing ${(fs / Number(f.state.length)).toFixed(2)} Hz; hop ${(result.hop / fs).toFixed(3)} s. Power color scale: dark blue −70 dB to bright amber 0 dB re 1 amplitude²/Hz. What to notice: long windows mix both tones around the switch. Overlap gives denser time sampling, not narrower intrinsic time or frequency blur. Only complete windows are plotted; boundary gaps are intentional.`;
  });
}
