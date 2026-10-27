import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { loadEEGExample, epochsFor } from './loader.mjs';
import { epochSpectra, meanSpectrum, integrateBand } from './processing.mjs';

export default async function EEGChannelExplorer(root) {
  const data = await loadEEGExample(), fs = data.sampleRate;
  const f = figure(root, 'eegChannels'); f.select('channel', 'Selected electrode', data.channels); f.select('condition', 'Condition', ['rest', 'left imagery', 'right imagery']);
  const traces = f.canvas('Same epoch at selected scalp locations'), spectrum = f.canvas('Selected-channel mean PSD'), spatial = f.canvas('Alpha-band power across retained channels');
  f.start(() => {
    const epochs = epochsFor(data, f.state.condition), epoch = epochs[0], t = epoch.channels[f.state.channel].map((_, n) => n / fs);
    plot(traces, data.channels.slice(0, 5).map((channel, i) => ({ x: t, y: epoch.channels[channel].map((v) => v + i * 90), label: `${channel} (offset)` })),
      { xDomain: [0, 4], yDomain: [-150, 500], xLabel: 'Time in epoch (s)', yLabel: 'Offset voltage (µV)' });
    const selected = meanSpectrum(epochSpectra(epochs, f.state.channel, fs, { highpass: 1, lowpass: 40 })), db = (v) => 10 * Math.log10(Math.max(v, 1e-8));
    plot(spectrum, [{ x: selected.frequencies, y: selected.values.map(db), label: `${f.state.channel} mean PSD` }], { xDomain: [0, 40], yDomain: [-35, 30], xLabel: 'Frequency (Hz)', yLabel: 'PSD (dB µV²/Hz)' });
    const band = data.channels.map((channel) => integrateBand(meanSpectrum(epochSpectra(epochs, channel, fs, { highpass: 1, lowpass: 40 })), 8, 13));
    plot(spatial, [{ x: data.channels.map((_, i) => i), y: band, label: '8–13 Hz power', stems: true, markers: true }],
      { xDomain: [0, data.channels.length - 1], yDomain: [0, Math.max(...band) * 1.15], xLabel: `Channel index: ${data.channels.map((c, i) => `${i} ${c}`).join(', ')}`, yLabel: 'Band power (µV²)' });
    f.observation.textContent = `An EEG block is naturally X ∈ ℝ^(C×N): each row is a channel and each column a sample time. Differences across these retained electrodes show spatial variation, but scalp voltage does not provide precise anatomical localization and this reduced channel set is not a topographic inverse model.`;
  });
}

