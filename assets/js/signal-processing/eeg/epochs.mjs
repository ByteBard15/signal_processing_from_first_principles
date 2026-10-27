import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { loadEEGExample } from './loader.mjs';

export default async function EEGEpochViewer(root) {
  const data = await loadEEGExample(), fs = data.sampleRate;
  const f = figure(root, 'eegEpochs'); f.slider('epoch', 'Selected labelled interval', 1, data.epochs.length, 1); f.select('channel', 'Channel', data.channels);
  const timeline = f.canvas('Run timeline and event labels'), trace = f.canvas('Selected four-second epoch');
  f.start(() => {
    const selected = data.epochs[f.state.epoch - 1];
    const eventX = data.events.map((event) => event.onset), eventY = data.events.map((event) => event.code === 'T0' ? 0 : event.code === 'T1' ? 1 : 2);
    plot(timeline, [{ x: eventX, y: eventY, label: 'T0 rest, T1 left imagery, T2 right imagery', stems: true, markers: true },
      { x: [selected.onset, selected.onset + selected.duration], y: [2.4, 2.4], label: 'selected interval' }],
      { xDomain: [0, data.recordingDuration], yDomain: [0, 2.6], xLabel: 'Run time (s)', yLabel: 'Event code' });
    const values = selected.channels[f.state.channel], t = values.map((_, n) => n / fs);
    plot(trace, [{ x: t, y: values, label: `${f.state.channel}, ${selected.condition}` }],
      { xDomain: [0, selected.duration], yDomain: [-120, 120], xLabel: 'Time within epoch (s)', yLabel: 'Voltage (µV)' });
    f.observation.textContent = `Epoch ${selected.id}: ${selected.code}, ${selected.condition}, onset ${selected.onset.toFixed(1)} s. The event code is interpreted using Run 04: T1 and T2 mean imagined left and right fist, while T0 means rest. The same codes mean different tasks in other run types.`;
  });
}

