import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { magnitudeSpectrum } from '../spectral/index.mjs';
import { TAU } from '../math/numeric.mjs';
import { loadEEGExample } from './loader.mjs';
import { condition } from './processing.mjs';

export default async function EEGTraceExplorer(root) {
  const data = await loadEEGExample(), fs = data.sampleRate, epoch = data.epochs.find((item) => item.condition === 'rest');
  const f = figure(root, 'eegTrace'), signal = f.canvas('Known synthetic structure versus measured EEG'), spectra = f.canvas('Their frequency representations');
  f.start(() => {
    const eeg = condition(epoch.channels.C3, fs, { highpass: 1, lowpass: 40 }), N = eeg.length;
    const t = Array.from({ length: N }, (_, n) => n / fs), synthetic = t.map((time) => 18 * Math.sin(TAU * 10 * time) + 8 * Math.sin(TAU * 22 * time));
    plot(signal, [{ x: t, y: synthetic, label: 'synthetic: 10 Hz + 22 Hz' }, { x: t, y: eeg, label: 'C3 EEG (conditioned)' }],
      { xDomain: [0, 4], yDomain: [-80, 80], xLabel: 'Time (s)', yLabel: 'Voltage (µV)' });
    const a = magnitudeSpectrum(synthetic, fs, 'hann'), b = magnitudeSpectrum(eeg, fs, 'hann');
    plot(spectra, [{ x: a.frequencies, y: a.values, label: 'synthetic amplitude' }, { x: b.frequencies, y: b.values, label: 'EEG amplitude' }],
      { xDomain: [0, 40], yDomain: [0, Math.max(...a.values, ...b.values) * 1.1], xLabel: 'Frequency (Hz)', yLabel: 'Amplitude (µV)' });
    f.observation.textContent = 'The synthetic construction produces two designed peaks. The EEG trace does not reveal a unique sinusoid list by inspection, and its spectrum distributes amplitude across frequencies. Fourier coordinates still exist; their interpretation is now statistical and conditional on the measurement.';
  });
}

