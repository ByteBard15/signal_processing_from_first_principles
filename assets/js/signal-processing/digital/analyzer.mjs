import { figure } from '../shared/figure.mjs';
import { plot, spectrumPlot } from '../shared/plot.mjs';
import { noise } from '../signals/index.mjs';
import { TAU } from '../math/numeric.mjs';
import { magnitudeSpectrum } from '../spectral/index.mjs';
export default function SpectrumAnalyzer(root) {
  const f = figure(root, 'analyzer');
  f.slider('f1', 'First frequency', 5, 180, 0.5, 'Hz'); f.slider('a1', 'First amplitude', 0, 2, 0.05);
  f.slider('f2', 'Second frequency', 5, 240, 0.5, 'Hz'); f.slider('a2', 'Second amplitude', 0, 2, 0.05);
  f.slider('sampleRate', 'Sampling rate', 256, 1024, 32, 'samples/s'); f.select('count', 'Number of samples', ['128', '256', '512', '1024']);
  f.slider('noise', 'Noise RMS amplitude', 0, 1, 0.05); f.select('window', 'Window', ['rectangular', 'hann', 'hamming']);
  const time = f.canvas('Finite synthetic record'), spectrum = f.canvas('One-sided window-corrected FFT amplitude');
  f.start(() => {
    const s = f.state, N = Number(s.count), random = noise(42, N, s.noise), t = random.map((_, n) => n / s.sampleRate);
    const x = t.map((v, n) => s.a1 * Math.sin(TAU * s.f1 * v) + s.a2 * Math.sin(TAU * s.f2 * v) + random[n]);
    const bound = Math.max(1, s.a1 + s.a2 + Math.sqrt(3) * s.noise);
    plot(time, [{ x: t, y: x, label: 'Seed 42 two-tone record' }], { xDomain: [0, N / s.sampleRate], yDomain: [-bound, bound], xLabel: 'Time (s)', yLabel: 'Amplitude' });
    spectrumPlot(spectrum, magnitudeSpectrum(x, s.sampleRate, s.window), { label: 'One-sided amplitude (2|X|/sum w)' });
    f.observation.textContent = `Δf = ${(s.sampleRate / N).toFixed(2)} Hz; record length ${(N / s.sampleRate).toFixed(3)} s; Nyquist ${(s.sampleRate / 2).toFixed(1)} Hz. ${Math.max(s.f1, s.f2) >= s.sampleRate / 2 ? 'A requested tone reaches or exceeds Nyquist.' : 'Both tones lie below Nyquist.'} What to notice: coherent-gain correction recovers isolated bin-aligned sinusoid amplitudes, but an off-bin peak is not an exact amplitude estimate.`;
  });
}
