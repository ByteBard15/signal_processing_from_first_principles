import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { periodogram, stft, welch } from '../spectral/index.mjs';
import { loadEEGExample } from './loader.mjs';
import { condition } from './processing.mjs';

export default async function EEGWelchExplorer(root) {
  const data = await loadEEGExample(), fs = data.sampleRate;
  const f = figure(root, 'eegWelch'); f.select('channel', 'Channel', data.channels); f.select('length', 'Segment length', ['64', '128', '256', '512']); f.slider('overlap', 'Overlap fraction', 0, 0.75, 0.25); f.select('window', 'Window', ['hann', 'hamming', 'rectangular']);
  const segments = f.canvas('Overlapping analysis segments'), individuals = f.canvas('Modified periodograms'), average = f.canvas('Welch average');
  f.start(() => {
    const values = condition(data.epochs[1].channels[f.state.channel], fs, { highpass: 1, lowpass: 40 }), length = Number(f.state.length);
    const result = stft(values, fs, length, f.state.overlap, f.state.window), t = values.map((_, n) => n / fs);
    plot(segments, result.frames.slice(0, 5).map((frame, i) => ({ x: t.slice(frame.start, frame.start + length), y: values.slice(frame.start, frame.start + length).map((v) => v + i * 55), label: `segment ${i + 1} (vertically offset)` })),
      { xDomain: [0, 4], yDomain: [-100, 330], xLabel: 'Time in epoch (s)', yLabel: 'Offset voltage (µV)' });
    const db = (v) => 10 * Math.log10(Math.max(v, 1e-8));
    plot(individuals, result.frames.slice(0, 6).map((frame, i) => ({ x: frame.frequencies, y: frame.values.map(db), label: `segment ${i + 1}` })),
      { xDomain: [0, 40], yDomain: [-35, 35], xLabel: 'Frequency (Hz)', yLabel: 'PSD (dB µV²/Hz)' });
    const estimate = welch(values, fs, length, f.state.overlap, f.state.window), raw = periodogram(values, fs, f.state.window);
    plot(average, [{ x: raw.frequencies, y: raw.values.map(db), label: 'whole-epoch periodogram' }, { x: estimate.frequencies, y: estimate.values.map(db), label: 'Welch average' }],
      { xDomain: [0, 40], yDomain: [-35, 35], xLabel: 'Frequency (Hz)', yLabel: 'PSD (dB µV²/Hz)' });
    f.observation.textContent = `${estimate.segments} complete segments, ${(length / fs).toFixed(2)} s each, Δf = ${(fs / length).toFixed(2)} Hz. Longer segments sharpen the frequency grid but leave fewer spectra to average. Overlap supplies more correlated estimates; it does not create independent data. Welch reduces variance by averaging modified periodograms, at the cost of local segment resolution.`;
  });
}

