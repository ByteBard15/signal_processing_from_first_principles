#!/usr/bin/env node
// Convert one PhysioNet EEGMMIDB EDF+ run into the compact browser fixture used by Article IV.
// Usage: node scripts/prepare-eeg-example.mjs tmp/eeg-source/S001R04.edf
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const input = resolve(process.argv[2] || 'tmp/eeg-source/S001R04.edf');
const output = resolve('data/signal-processing/eeg-example.json');
const bytes = await readFile(input);
const ascii = (start, length) => bytes.toString('ascii', start, start + length).trim();
const signalCount = Number(ascii(252, 4)), headerBytes = Number(ascii(184, 8));
const records = Number(ascii(236, 8)), recordDuration = Number(ascii(244, 8));
if (!signalCount || !headerBytes || !records || !recordDuration) throw new Error('Invalid EDF header');

let offset = 256;
const field = (width, numeric = false) => {
  const values = Array.from({ length: signalCount }, (_, i) => ascii(offset + i * width, width));
  offset += width * signalCount;
  return numeric ? values.map(Number) : values;
};
const labels = field(16), transducers = field(80), dimensions = field(8);
const physicalMin = field(8, true), physicalMax = field(8, true), digitalMin = field(8, true), digitalMax = field(8, true);
const prefilters = field(80), samplesPerRecord = field(8, true); field(32);
if (offset !== headerBytes) throw new Error(`EDF header length mismatch: ${offset} != ${headerBytes}`);

const wanted = ['Fc3.', 'Fc4.', 'C3..', 'Cz..', 'C4..', 'Cp3.', 'Cp4.', 'Fp1.'];
const selected = wanted.map((label) => {
  const index = labels.indexOf(label);
  if (index < 0) throw new Error(`Channel ${label} not found; available labels: ${labels.join(', ')}`);
  return index;
});
const cleanLabel = (label) => label.replaceAll('.', '');
const series = Object.fromEntries(selected.map((i) => [cleanLabel(labels[i]), []]));
const annotations = [];
let cursor = headerBytes;
for (let record = 0; record < records; record++) {
  for (let channel = 0; channel < signalCount; channel++) {
    const count = samplesPerRecord[channel], size = count * 2;
    if (labels[channel] === 'EDF Annotations') {
      const tal = Buffer.alloc(count * 2);
      for (let i = 0; i < count; i++) { tal[i * 2] = bytes[cursor + i * 2]; tal[i * 2 + 1] = bytes[cursor + i * 2 + 1]; }
      const text = tal.toString('latin1').replaceAll('\0', '');
      for (const match of text.matchAll(/\+([0-9.]+)(?:\x15([0-9.]+))?\x14([^\x14\x15]+)/g)) {
        if (/^T[012]$/.test(match[3])) annotations.push({ onset: Number(match[1]), duration: Number(match[2] || 0), code: match[3] });
      }
    } else if (selected.includes(channel)) {
      const scale = (physicalMax[channel] - physicalMin[channel]) / (digitalMax[channel] - digitalMin[channel]);
      const base = physicalMin[channel] - digitalMin[channel] * scale, target = series[cleanLabel(labels[channel])];
      for (let i = 0; i < count; i++) target.push(Number((base + bytes.readInt16LE(cursor + i * 2) * scale).toFixed(3)));
    }
    cursor += size;
  }
}

const sampleRate = samplesPerRecord[selected[0]] / recordDuration;
const epochSeconds = 4, epochSamples = Math.round(epochSeconds * sampleRate);
const epochs = annotations.filter((event) => event.onset + epochSeconds <= records * recordDuration).map((event, index) => {
  const start = Math.round(event.onset * sampleRate);
  return { id: index + 1, onset: event.onset, duration: epochSeconds, code: event.code,
    condition: event.code === 'T0' ? 'rest' : event.code === 'T1' ? 'left imagery' : 'right imagery',
    channels: Object.fromEntries(Object.entries(series).map(([name, values]) => [name, values.slice(start, start + epochSamples)])) };
});
const payload = {
  source: { dataset: 'PhysioNet EEG Motor Movement/Imagery Dataset v1.0.0', doi: '10.13026/C28G6P', subject: 'S001', run: 4,
    task: 'imagine opening and closing the left or right fist', file: 'S001R04.edf', license: 'Open Data Commons Attribution License v1.0' },
  sampleRate, units: dimensions[selected[0]] || 'uV', channels: selected.map((i) => cleanLabel(labels[i])),
  recordingDuration: records * recordDuration, preprocessing: 'none; physical values decoded from EDF digital/physical calibration',
  events: annotations, epochs,
  edf: { transducer: transducers[selected[0]], prefilter: prefilters[selected[0]] },
};
await mkdir(resolve('data/signal-processing'), { recursive: true });
await writeFile(output, `${JSON.stringify(payload)}\n`);
console.log(`Wrote ${output}: ${payload.channels.length} channels, ${epochs.length} labelled epochs, ${sampleRate} samples/s`);
