import { figure } from '../shared/figure.mjs';
import { plot, spectrogram } from '../shared/plot.mjs';
import { stft, periodogram } from '../spectral/index.mjs';
import { windowValues } from '../windows/index.mjs';
import { loadEEGExample } from './loader.mjs';
import { condition, integrateBand } from './processing.mjs';

export async function EEGSTFTConstruction(root) {
  const data = await loadEEGExample(), fs = data.sampleRate;
  const f = figure(root, 'eegStftBuild'); f.select('channel', 'Channel', data.channels); f.select('length', 'Window length', ['64', '128', '256']); f.slider('frame', 'Window position', 0, 5, 1);
  const signal = f.canvas('EEG and the current local analysis window'), local = f.canvas('Spectrum produced by that window'), accumulated = f.canvas('Frames accumulated so far', 330);
  f.start(() => {
    const values = condition(data.epochs[2].channels[f.state.channel], fs, { highpass: 1, lowpass: 45 }), length = Number(f.state.length);
    const result = stft(values, fs, length, 0.5, 'hann'), frameIndex = Math.min(f.state.frame, result.frames.length - 1), frame = result.frames[frameIndex], weights = windowValues('hann', length), t = values.map((_, n) => n / fs);
    const selectedX = t.slice(frame.start, frame.start + length), selectedY = values.slice(frame.start, frame.start + length).map((value, n) => value * weights[n]);
    plot(signal, [{ x: t, y: values, label: 'conditioned EEG' }, { x: selectedX, y: selectedY, label: 'current Hann-windowed samples' }],
      { xDomain: [0, 4], yDomain: [-100, 100], xLabel: 'Time in epoch (s)', yLabel: 'Voltage (µV)' });
    plot(local, [{ x: frame.frequencies, y: frame.values.map((v) => 10 * Math.log10(Math.max(v, 1e-8))), label: `local periodogram at ${frame.time.toFixed(2)} s` }],
      { xDomain: [0, 45], yDomain: [-35, 35], xLabel: 'Frequency (Hz)', yLabel: 'PSD (dB µV²/Hz)' });
    spectrogram(accumulated, { ...result, frames: result.frames.slice(0, frameIndex + 1) }, [0, 4], { floor: -30, ceiling: 30, ariaLabel: 'Partial EEG spectrogram accumulated through the selected frame.' });
    f.observation.textContent = `Frame ${frameIndex + 1} of ${result.frames.length}: select ${length} samples (${(length / fs).toFixed(2)} s), multiply by a Hann window, compute a periodogram, then move by ${result.hop} samples. Repeating that already-known operation builds columns of the spectrogram.`;
  });
}

export async function EEGSpectrogramExplorer(root) {
  const data = await loadEEGExample(), fs = data.sampleRate;
  const f = figure(root, 'eegSpectrogram'); f.select('channel', 'Channel', data.channels); f.select('condition', 'Condition', ['rest', 'left imagery', 'right imagery']); f.select('length', 'STFT window length', ['64', '128', '256', '512']); f.slider('overlap', 'Overlap fraction', 0, 0.75, 0.25);
  const global = f.canvas('One global periodogram'), heat = f.canvas('Local power through time', 360);
  f.start(() => {
    const epoch = data.epochs.find((item) => item.condition === f.state.condition), values = condition(epoch.channels[f.state.channel], fs, { highpass: 1, lowpass: 45 }), length = Number(f.state.length);
    const whole = periodogram(values, fs, 'hann'), db = whole.values.map((v) => 10 * Math.log10(Math.max(v, 1e-8)));
    plot(global, [{ x: whole.frequencies, y: db, label: 'whole-epoch periodogram' }], { xDomain: [0, 45], yDomain: [-35, 35], xLabel: 'Frequency (Hz)', yLabel: 'PSD (dB µV²/Hz)' });
    const result = stft(values, fs, length, f.state.overlap, 'hann');
    spectrogram(heat, result, [0, 4], { floor: -30, ceiling: 30, ariaLabel: `${f.state.channel} ${f.state.condition} EEG spectrogram in squared microvolts per hertz.` });
    f.observation.textContent = `Window ${(length / fs).toFixed(2)} s, Δf = ${(fs / length).toFixed(2)} Hz, hop ${(result.hop / fs).toFixed(2)} s. Short windows localize changes more tightly but blur frequency; long windows sharpen frequency while averaging over more time. Overlap samples the time axis more densely without changing the intrinsic window trade-off.`;
  });
}

export async function EEGEventRelatedExplorer(root) {
  const data = await loadEEGExample(), fs = data.sampleRate;
  const f = figure(root, 'eegEvent'); f.select('channel', 'Channel', data.channels); f.select('task', 'Imagery condition', ['left imagery', 'right imagery']); f.select('band', 'Frequency interval', [['alpha', '8–13 Hz'], ['beta', '13–30 Hz']]);
  const change = f.canvas('Relative band-power change from rest baseline');
  f.start(() => {
    const taskEpoch = data.epochs.find((item) => item.condition === f.state.task), restEpoch = data.epochs.find((item) => item.condition === 'rest');
    const bounds = f.state.band === 'alpha' ? [8, 13] : [13, 30], options = { highpass: 1, lowpass: 40 };
    const rest = stft(condition(restEpoch.channels[f.state.channel], fs, options), fs, 128, 0.75, 'hann');
    const task = stft(condition(taskEpoch.channels[f.state.channel], fs, options), fs, 128, 0.75, 'hann');
    const baseline = rest.frames.reduce((sum, frame) => sum + integrateBand(frame, ...bounds), 0) / rest.frames.length;
    const values = task.frames.map((frame) => 100 * (integrateBand(frame, ...bounds) - baseline) / baseline);
    plot(change, [{ x: task.frames.map((frame) => frame.time), y: values, label: '(Ptask(t) − mean Prest) / mean Prest × 100%' }],
      { xDomain: [0, 4], yDomain: [Math.min(-100, ...values), Math.max(100, ...values)], xLabel: 'Time within task epoch (s)', yLabel: 'Relative band-power change (%)' });
    f.observation.textContent = `Baseline is the mean ${bounds[0]}–${bounds[1]} Hz power across one labelled rest epoch; task power uses 0.8 s Hann windows. Negative values are conventionally called event-related desynchronization (ERD), positive values synchronization (ERS). Here they mean only relative oscillatory-power change under this definition—not loss or gain of neurons, and not a clinical finding.`;
  });
}

