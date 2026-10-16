import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { linspace, TAU } from '../math/numeric.mjs';
import { magnitude } from '../math/complex.mjs';
import { compose } from '../signals/index.mjs';
import { sampleSignal, reconstructSinc, aliasFrequency } from '../sampling/index.mjs';
import { directDFT, inverseDFT, dtft } from '../transforms/dft.mjs';
import { radix2FFT, inverseFFT } from '../transforms/fft.mjs';

const maximumError = (actual, expected) => Math.max(...actual.map((value, n) => Math.abs(value - expected[n])));

export default function EndToEndSpectrumExplorer(root) {
  const f = figure(root, 'endToEnd');
  f.slider('f1', 'Tone 1 frequency', 1, 60, 0.5, 'Hz');
  f.slider('a1', 'Tone 1 amplitude', 0, 1.5, 0.05);
  f.slider('f2', 'Tone 2 frequency', 1, 60, 0.5, 'Hz');
  f.slider('a2', 'Tone 2 amplitude', 0, 1.5, 0.05);
  f.slider('f3', 'Tone 3 frequency', 1, 60, 0.5, 'Hz');
  f.slider('a3', 'Tone 3 amplitude', 0, 1.5, 0.05);
  f.select('sampleRate', 'Sampling rate', [['64', '64 samples/s'], ['128', '128 samples/s'], ['256', '256 samples/s']]);
  f.select('count', 'Record length', [['64', '64 samples'], ['128', '128 samples'], ['256', '256 samples']]);

  const time = f.canvas('1 · Continuous-time signal and its discrete-time samples');
  const periodic = f.canvas('2 · Original CTS lines and the periodic finite-record DTFT');
  const bins = f.canvas('3 · The DFT samples the DTFT at signed frequency bins');
  const algorithms = f.canvas('4 · Direct DFT and FFT return the same coefficients');
  const inverse = f.canvas('5 · IDFT, inverse FFT, and inverse DTFT recover the samples');
  const continuous = f.canvas('6 · Sinc reconstruction asks whether the CTS signal can be recovered');

  f.start(() => {
    const fs = Number(f.state.sampleRate), N = Number(f.state.count);
    const components = [
      { kind: 'cosine', frequency: f.state.f1, amplitude: f.state.a1, phase: 0.15 },
      { kind: 'cosine', frequency: f.state.f2, amplitude: f.state.a2, phase: -0.7 },
      { kind: 'cosine', frequency: f.state.f3, amplitude: f.state.a3, phase: 1.1 },
    ];
    const source = compose(components), record = sampleSignal(source, fs, N);
    const duration = N / fs, previewEnd = Math.min(duration, 0.3);
    const previewTime = linspace(0, previewEnd, 700);
    const sampleTimes = record.samples.map((_, n) => n / fs);
    const visibleCount = Math.min(N, Math.ceil(previewEnd * fs) + 1);
    const amplitudeLimit = Math.max(1, components.reduce((sum, item) => sum + item.amplitude, 0)) * 1.1;

    plot(time, [
      { x: previewTime, y: previewTime.map(source), label: 'CTS x(t)' },
      { x: sampleTimes.slice(0, visibleCount), y: record.samples.slice(0, visibleCount), label: 'DTS x[n] = x(nT_s)', markers: true, stems: true },
    ], { xDomain: [0, previewEnd], yDomain: [-amplitudeLimit, amplitudeLimit], xLabel: 'Time (s)', yLabel: 'Amplitude' });

    const frequencyAxis = linspace(-1.5 * fs, 1.5 * fs, 1001);
    const dtftMagnitude = frequencyAxis.map((frequency) => magnitude(dtft(record.samples, TAU * frequency / fs)) / N);
    const ctsLines = components.flatMap((item) => [-item.frequency, item.frequency]
      .map((frequency) => ({ frequency, amplitude: item.amplitude / 2 })))
      .filter((item) => item.frequency >= -1.5 * fs && item.frequency <= 1.5 * fs)
      .sort((a, b) => a.frequency - b.frequency);
    const spectralLimit = Math.max(0.1, ...dtftMagnitude, ...ctsLines.map((item) => item.amplitude)) * 1.12;
    plot(periodic, [
      { x: frequencyAxis, y: dtftMagnitude, label: 'Finite-record DTFT |X(e^{j2πf/f_s})| / N' },
      { x: ctsLines.map((item) => item.frequency), y: ctsLines.map((item) => item.amplitude), label: 'Ideal CTS lines A/2', markers: true, stems: true },
    ], { xDomain: [-1.5 * fs, 1.5 * fs], yDomain: [0, spectralLimit], xLabel: 'Physical frequency label f (Hz)', yLabel: 'Two-sided magnitude' });

    const direct = directDFT(record.samples), fast = radix2FFT(record.samples);
    const signedBins = Array.from({ length: N }, (_, k) => ({
      frequency: (k <= N / 2 ? k : k - N) * fs / N,
      direct: magnitude(direct[k]) / N,
      fast: magnitude(fast[k]) / N,
    })).sort((a, b) => a.frequency - b.frequency);
    const basebandAxis = linspace(-fs / 2, fs / 2, 801);
    const basebandDtft = basebandAxis.map((frequency) => magnitude(dtft(record.samples, TAU * frequency / fs)) / N);
    plot(bins, [
      { x: basebandAxis, y: basebandDtft, label: 'Continuous-frequency DTFT' },
      { x: signedBins.map((item) => item.frequency), y: signedBins.map((item) => item.direct), label: 'DFT samples at f_k', markers: true, stems: true },
    ], { xDomain: [-fs / 2, fs / 2], yDomain: [0, Math.max(0.1, ...basebandDtft) * 1.12], xLabel: 'Signed frequency (Hz)', yLabel: 'Two-sided magnitude' });

    plot(algorithms, [
      { x: signedBins.map((item) => item.frequency), y: signedBins.map((item) => item.direct), label: 'Direct DFT', markers: true, stems: true },
      { x: signedBins.map((item) => item.frequency), y: signedBins.map((item) => item.fast), label: 'FFT', markers: true },
    ], { xDomain: [-fs / 2, fs / 2], yDomain: [0, Math.max(0.1, ...signedBins.map((item) => item.direct)) * 1.12], xLabel: 'Signed frequency bin f_k (Hz)', yLabel: '|X[k]| / N' });

    const fromDFT = inverseDFT(direct).map((value) => value.re);
    const fromFFT = inverseFFT(fast).map((value) => value.re);
    const integrationPoints = Math.max(512, N * 2);
    const omega = Array.from({ length: integrationPoints }, (_, m) => -Math.PI + TAU * m / integrationPoints);
    const continuousSpectrum = omega.map((value) => dtft(record.samples, value));
    const fromDTFT = Array.from({ length: N }, (_, n) => continuousSpectrum.reduce((sum, value, m) =>
      sum + value.re * Math.cos(omega[m] * n) - value.im * Math.sin(omega[m] * n), 0) / integrationPoints);
    const shownSamples = Math.min(N, 40);
    const indices = Array.from({ length: shownSamples }, (_, n) => n);
    plot(inverse, [
      { x: indices, y: record.samples.slice(0, shownSamples), label: 'Original samples', markers: true, stems: true },
      { x: indices, y: fromDFT.slice(0, shownSamples), label: 'IDFT(DFT(x))', markers: true },
      { x: indices, y: fromFFT.slice(0, shownSamples), label: 'IFFT(FFT(x))', markers: true },
      { x: indices, y: fromDTFT.slice(0, shownSamples), label: 'Inverse-DTFT integral', markers: true },
    ], { xDomain: [0, shownSamples - 1], yDomain: [-amplitudeLimit, amplitudeLimit], xLabel: 'Sample index n', yLabel: 'Amplitude' });

    const margin = Math.min(duration * 0.2, 0.2), recoveryStart = margin, recoveryEnd = Math.max(recoveryStart + 1 / fs, duration - margin);
    const recoveryTime = linspace(recoveryStart, recoveryEnd, 700);
    const reconstructed = recoveryTime.map((value) => reconstructSinc(record, value));
    plot(continuous, [
      { x: recoveryTime, y: recoveryTime.map(source), label: 'Original CTS x(t)' },
      { x: recoveryTime, y: reconstructed, label: 'Finite sinc reconstruction' },
    ], { xDomain: [recoveryStart, recoveryEnd], yDomain: [-amplitudeLimit, amplitudeLimit], xLabel: 'Time (s)', yLabel: 'Amplitude' });

    const coefficientError = Math.max(...direct.map((value, k) => Math.hypot(value.re - fast[k].re, value.im - fast[k].im)));
    const aliases = components.map((item) => aliasFrequency(item.frequency, fs));
    const overNyquist = components.some((item) => item.frequency >= fs / 2 && item.amplitude > 0);
    f.observation.textContent = `Δf = ${(fs / N).toFixed(3)} Hz; normalized tone frequencies = ${components.map((item) => `${(item.frequency / fs).toFixed(3)} cycles/sample`).join(', ')}; signed aliases = ${aliases.map((value) => `${value.toFixed(2)} Hz`).join(', ')}. Maximum DFT–FFT coefficient error = ${coefficientError.toExponential(2)}; sample recovery errors: IDFT ${maximumError(fromDFT, record.samples).toExponential(2)}, inverse FFT ${maximumError(fromFFT, record.samples).toExponential(2)}, inverse DTFT ${maximumError(fromDTFT, record.samples).toExponential(2)}. ${overNyquist ? 'At least one CTS tone exceeds Nyquist: every inverse recovers the samples, but sinc interpolation cannot recover that original analog tone.' : 'All tones are below Nyquist; interior sinc recovery improves when the finite record contains more surrounding samples.'}`;
  });
}
