import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { condition, integrateBand, response } from '../../assets/js/signal-processing/eeg/processing.mjs';
import { periodogram } from '../../assets/js/signal-processing/spectral/index.mjs';

const data = JSON.parse(await readFile(new URL('../../data/signal-processing/eeg-example.json', import.meta.url)));

test('processed EEG fixture preserves declared dimensions and event mapping', () => {
  assert.equal(data.source.subject, 'S001'); assert.equal(data.source.run, 4); assert.equal(data.sampleRate, 160);
  assert.equal(data.channels.length, 8); assert.equal(data.epochs.length, 30);
  assert.ok(data.epochs.every((epoch) => Object.values(epoch.channels).every((values) => values.length === 640)));
  assert.deepEqual([...new Set(data.epochs.map((epoch) => epoch.condition))].sort(), ['left imagery', 'rest', 'right imagery']);
});

test('EEG conditioning remains finite and filter response attenuates excluded frequencies', () => {
  const raw = data.epochs[0].channels.C3, filtered = condition(raw, 160, { highpass: 2, lowpass: 35, notch: true, line: 60 });
  assert.equal(filtered.length, raw.length); assert.ok(filtered.every(Number.isFinite));
  const [slow, pass, line] = response([0.1, 10, 60], 160, { highpass: 2, lowpass: 35, notch: true, line: 60 });
  assert.ok(pass > slow * 100); assert.ok(pass > line * 100);
});

test('band power integrates PSD density in squared microvolts', () => {
  const values = condition(data.epochs[0].channels.C3, 160, { highpass: 1, lowpass: 40 }).slice(0, 512);
  const psd = periodogram(values, 160, 'hann');
  const alpha = integrateBand(psd, 8, 13), beta = integrateBand(psd, 13, 30);
  assert.ok(alpha > 0 && beta > 0 && Number.isFinite(alpha + beta));
  const flat = { frequencies: [0, 1, 2, 3, 4], values: [2, 2, 2, 2, 2] };
  assert.equal(integrateBand(flat, 1, 4), 6);
});
