import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { welch } from '../spectral/index.mjs';
import { loadEEGExample, epochsFor } from './loader.mjs';
import { condition, integrateBand } from './processing.mjs';

export default async function EEGRobustnessExplorer(root) {
  const data = await loadEEGExample(), fs = data.sampleRate;
  const f = figure(root, 'eegRobustness'); f.select('channel', 'Channel', data.channels); f.select('length', 'Welch segment length', ['64', '128', '256']); f.slider('overlap', 'Overlap', 0, 0.75, 0.25); f.select('window', 'Window', ['hann', 'hamming', 'rectangular']); f.slider('highpass', 'High-pass cutoff', 0, 4, 0.5, 'Hz');
  const spectra = f.canvas('Condition means under selected analysis choices'), sensitivity = f.canvas('Alpha-power contrast across channels');
  f.start(() => {
    const options = { highpass: f.state.highpass, lowpass: 40 }, length = Number(f.state.length);
    const estimate = (epoch, channel) => welch(condition(epoch.channels[channel], fs, options), fs, length, f.state.overlap, f.state.window);
    const mean = (conditionName, channel) => {
      const all = epochsFor(data, conditionName).map((epoch) => estimate(epoch, channel));
      return { frequencies: all[0].frequencies, values: all[0].values.map((_, k) => all.reduce((sum, item) => sum + item.values[k], 0) / all.length) };
    };
    const rest = mean('rest', f.state.channel), task = mean('left imagery', f.state.channel), db = (v) => 10 * Math.log10(Math.max(v, 1e-8));
    plot(spectra, [{ x: rest.frequencies, y: rest.values.map(db), label: 'rest mean' }, { x: task.frequencies, y: task.values.map(db), label: 'left-imagery mean' }],
      { xDomain: [0, 40], yDomain: [-35, 35], xLabel: 'Frequency (Hz)', yLabel: 'Welch PSD (dB µV²/Hz)' });
    const contrasts = data.channels.map((channel) => { const r = integrateBand(mean('rest', channel), 8, 13), m = integrateBand(mean('left imagery', channel), 8, 13); return 100 * (m - r) / r; });
    plot(sensitivity, [{ x: contrasts.map((_, i) => i), y: contrasts, label: 'left imagery versus rest', stems: true, markers: true }],
      { xDomain: [0, contrasts.length - 1], yDomain: [Math.min(-100, ...contrasts) * 1.1, Math.max(100, ...contrasts) * 1.1], xLabel: `Channel index: ${data.channels.map((c, i) => `${i} ${c}`).join(', ')}`, yLabel: '8–13 Hz relative change (%)' });
    const chosen = contrasts[data.channels.indexOf(f.state.channel)];
    f.observation.textContent = `Selected-channel 8–13 Hz contrast: ${chosen.toFixed(1)}%. Change the segment, overlap, window, cutoff, and channel. A defensible observation should remain qualitatively recognizable across reasonable choices; sign changes or large swings reveal analysis sensitivity that must be reported rather than hidden.`;
  });
}

