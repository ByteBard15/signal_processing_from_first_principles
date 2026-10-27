import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { periodogram } from '../spectral/index.mjs';
import { linspace } from '../math/numeric.mjs';
import { loadEEGExample } from './loader.mjs';
import { condition, detrend, response } from './processing.mjs';

export default async function EEGPreprocessingExplorer(root) {
  const data = await loadEEGExample(), fs = data.sampleRate;
  const f = figure(root, 'eegPreprocess'); f.select('channel', 'Channel', data.channels); f.slider('highpass', 'High-pass cutoff', 0, 5, 0.5, 'Hz'); f.slider('lowpass', 'Low-pass cutoff', 20, 70, 5, 'Hz'); f.checkbox('notch', 'Apply 60 Hz notch');
  const time = f.canvas('Raw and conditioned epoch'), spectrum = f.canvas('PSD before and after conditioning'), filter = f.canvas('Combined forward–backward filter response');
  f.start(() => {
    const raw = data.epochs[1].channels[f.state.channel], options = { highpass: f.state.highpass, lowpass: f.state.lowpass, notch: f.state.notch, line: 60 };
    const cleaned = condition(raw, fs, options), t = raw.map((_, n) => n / fs);
    plot(time, [{ x: t, y: detrend(raw), label: 'raw (linear trend removed for display)' }, { x: t, y: cleaned, label: 'conditioned' }],
      { xDomain: [0, 4], yDomain: [-100, 100], xLabel: 'Time in epoch (s)', yLabel: 'Voltage (µV)' });
    const before = periodogram(detrend(raw), fs, 'hann'), after = periodogram(cleaned, fs, 'hann'), db = (v) => 10 * Math.log10(Math.max(v, 1e-8));
    plot(spectrum, [{ x: before.frequencies, y: before.values.map(db), label: 'raw PSD' }, { x: after.frequencies, y: after.values.map(db), label: 'conditioned PSD' }],
      { xDomain: [0, 80], yDomain: [-45, 35], xLabel: 'Frequency (Hz)', yLabel: 'PSD (dB µV²/Hz)' });
    const frequencies = linspace(0, 80, 400), gain = response(frequencies, fs, options).map((v) => 20 * Math.log10(Math.max(v, 1e-5)));
    plot(filter, [{ x: frequencies, y: gain, label: 'zero-phase cascade' }], { xDomain: [0, 80], yDomain: [-100, 5], xLabel: 'Frequency (Hz)', yLabel: 'Gain (dB)' });
    f.observation.textContent = `This viewer detrends, then applies forward–backward second-order high/low-pass sections${f.state.notch ? ' and a narrow 60 Hz notch' : ''}. Forward–backward processing cancels phase delay but squares each section’s magnitude response. Edge transients remain possible. Filtering changes the evidence; it does not certify that the retained signal is neural.`;
  });
}

