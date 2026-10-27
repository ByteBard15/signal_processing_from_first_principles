import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { loadEEGExample } from './loader.mjs';
import { condition, integrateBand } from './processing.mjs';
import { welch } from '../spectral/index.mjs';

const bands = { delta: [1, 4], theta: [4, 8], alpha: [8, 13], beta: [13, 30], gamma: [30, 45] };
export default async function EEGBandExplorer(root) {
  const data = await loadEEGExample(), fs = data.sampleRate;
  const f = figure(root, 'eegBands'); f.select('channel', 'Channel', data.channels); f.select('condition', 'Epoch condition', ['rest', 'left imagery', 'right imagery']); f.select('band', 'Band to inspect', Object.keys(bands));
  const spectrum = f.canvas('Welch PSD and selected integration interval'), powers = f.canvas('Integrated power in conventional bands');
  f.start(() => {
    const epoch = data.epochs.find((item) => item.condition === f.state.condition), values = condition(epoch.channels[f.state.channel], fs, { highpass: 1, lowpass: 45 });
    const psd = welch(values, fs, 256, 0.5, 'hann'), selected = bands[f.state.band], db = psd.values.map((v) => 10 * Math.log10(Math.max(v, 1e-8)));
    const mask = psd.frequencies.map((frequency, i) => frequency >= selected[0] && frequency <= selected[1] ? db[i] : -45);
    plot(spectrum, [{ x: psd.frequencies, y: db, label: 'Welch PSD' }, { x: psd.frequencies, y: mask, label: `${f.state.band} interval ${selected[0]}–${selected[1]} Hz` }],
      { xDomain: [0, 45], yDomain: [-45, 35], xLabel: 'Frequency (Hz)', yLabel: 'PSD (dB µV²/Hz)' });
    const names = Object.keys(bands), valuesByBand = names.map((name) => integrateBand(psd, ...bands[name]));
    plot(powers, [{ x: names.map((_, i) => i), y: valuesByBand, label: 'integrated PSD', stems: true, markers: true }],
      { xDomain: [0, names.length - 1], yDomain: [0, Math.max(...valuesByBand) * 1.15], xLabel: 'Band index: 0 δ, 1 θ, 2 α, 3 β, 4 γ', yLabel: 'Band power (µV²)' });
    f.observation.textContent = `${f.state.band} power = ${integrateBand(psd, ...selected).toFixed(2)} µV², computed by trapezoidal integration of PSD bins from ${selected[0]} to ${selected[1]} Hz. These boundaries are an explicit convention for this article, not universal physiological laws; changing them changes the summary.`;
  });
}

