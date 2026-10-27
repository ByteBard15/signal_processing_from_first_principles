import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { magnitudeSpectrum, periodogram } from '../spectral/index.mjs';
import { loadEEGExample, epochsFor } from './loader.mjs';
import { condition, epochSpectra } from './processing.mjs';

const db = (value) => 10 * Math.log10(Math.max(value, 1e-8));
export default async function EEGPSDExplorer(root) {
  const data = await loadEEGExample(), fs = data.sampleRate;
  const f = figure(root, 'eegPsd'); f.select('channel', 'Channel', data.channels); f.slider('epoch', 'Rest epoch', 1, epochsFor(data, 'rest').length, 1);
  const time = f.canvas('One EEG epoch'), amplitude = f.canvas('FFT amplitude spectrum'), density = f.canvas('Correctly normalized periodogram / PSD'), variability = f.canvas('Periodograms from nominally similar rest epochs');
  f.start(() => {
    const epochs = epochsFor(data, 'rest'), epoch = epochs[f.state.epoch - 1], values = condition(epoch.channels[f.state.channel], fs, { highpass: 1, lowpass: 40 }).slice(0, 512), t = values.map((_, n) => n / fs);
    plot(time, [{ x: t, y: values, label: `${f.state.channel}, rest epoch ${f.state.epoch}` }], { xDomain: [0, t.at(-1)], yDomain: [-100, 100], xLabel: 'Time (s)', yLabel: 'Voltage (µV)' });
    const mag = magnitudeSpectrum(values, fs, 'hann'), psd = periodogram(values, fs, 'hann');
    plot(amplitude, [{ x: mag.frequencies, y: mag.values, label: 'coherent-gain-corrected amplitude' }],
      { xDomain: [0, 40], yDomain: [0, Math.max(...mag.values) * 1.15], xLabel: 'Frequency (Hz)', yLabel: 'Amplitude (µV)' });
    plot(density, [{ x: psd.frequencies, y: psd.values.map(db), label: 'one-sided modified periodogram' }],
      { xDomain: [0, 40], yDomain: [-35, 30], xLabel: 'Frequency (Hz)', yLabel: 'PSD (dB µV²/Hz)' });
    const spectra = epochSpectra(epochs.slice(0, 6), f.state.channel, fs, { highpass: 1, lowpass: 40 });
    plot(variability, spectra.map((spectrum, index) => ({ x: spectrum.frequencies, y: spectrum.values.map(db), label: `epoch ${index + 1}` })),
      { xDomain: [0, 40], yDomain: [-35, 30], xLabel: 'Frequency (Hz)', yLabel: 'PSD (dB µV²/Hz)' });
    const df = fs / values.length, power = psd.values.reduce((sum, value) => sum + value * df, 0);
    f.observation.textContent = `The amplitude spectrum reports sinusoidal amplitude; the periodogram reports power per hertz. Here P[k] = |X_w[k]|²/(f_s Σw²), with interior one-sided bins doubled. Integrating the PSD gives ${power.toFixed(1)} µV² for this conditioned epoch. Separate rest epochs vary because a periodogram is an estimate, not a deterministic fingerprint of the condition.`;
  });
}

