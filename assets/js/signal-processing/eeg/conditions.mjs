import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { loadEEGExample, epochsFor } from './loader.mjs';
import { epochSpectra, meanSpectrum, integrateBand } from './processing.mjs';

export default async function EEGConditionComparison(root) {
  const data = await loadEEGExample(), fs = data.sampleRate;
  const f = figure(root, 'eegConditions'); f.select('channel', 'Channel', data.channels); f.select('task', 'Imagery condition', ['left imagery', 'right imagery']);
  const mean = f.canvas('Mean PSD across labelled epochs'), spread = f.canvas('Epoch variability around the mean');
  f.start(() => {
    const options = { highpass: 1, lowpass: 40, window: 'hann' };
    const rest = epochSpectra(epochsFor(data, 'rest'), f.state.channel, fs, options), task = epochSpectra(epochsFor(data, f.state.task), f.state.channel, fs, options);
    const r = meanSpectrum(rest), m = meanSpectrum(task), db = (v) => 10 * Math.log10(Math.max(v, 1e-8));
    plot(mean, [{ x: r.frequencies, y: r.values.map(db), label: `rest mean (n=${rest.length})` }, { x: m.frequencies, y: m.values.map(db), label: `${f.state.task} mean (n=${task.length})` }],
      { xDomain: [0, 40], yDomain: [-35, 30], xLabel: 'Frequency (Hz)', yLabel: 'Mean PSD (dB µV²/Hz)' });
    plot(spread, [{ x: r.frequencies, y: r.spread.map((v) => db(v[0])), label: 'rest lower quartile' }, { x: r.frequencies, y: r.spread.map((v) => db(v[1])), label: 'rest upper quartile' },
      { x: m.frequencies, y: m.spread.map((v) => db(v[0])), label: 'task lower quartile' }, { x: m.frequencies, y: m.spread.map((v) => db(v[1])), label: 'task upper quartile' }],
      { xDomain: [0, 40], yDomain: [-35, 30], xLabel: 'Frequency (Hz)', yLabel: 'PSD quartiles (dB µV²/Hz)' });
    const rb = integrateBand(r, 8, 13), mb = integrateBand(m, 8, 13), change = 100 * (mb - rb) / rb;
    f.observation.textContent = `For this subject, run, channel, and preprocessing, mean 8–13 Hz power changes by ${change.toFixed(1)}% from rest to ${f.state.task}. Quartile curves expose epoch-to-epoch spread. This is an illustrative within-recording comparison, not a diagnostic result or a population claim.`;
  });
}

