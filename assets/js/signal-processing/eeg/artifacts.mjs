import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { noise } from '../signals/index.mjs';
import { TAU } from '../math/numeric.mjs';

export default function EEGArtifactExplorer(root) {
  const f = figure(root, 'eegArtifacts');
  for (const [key, label] of [['drift', 'Baseline drift'], ['line', '60 Hz interference'], ['blink', 'Eye-blink transient'], ['muscle', 'Muscle-like broadband activity'], ['measurement', 'Measurement noise']]) f.checkbox(key, label);
  const components = f.canvas('Individual components'), observed = f.canvas('Combined observed signal');
  const fs = 160, N = fs * 4, t = Array.from({ length: N }, (_, n) => n / fs), random = noise(17, N, 1);
  const neural = t.map((time, n) => 10 * Math.sin(TAU * 10 * time) + 5 * Math.sin(TAU * 20 * time + 0.4) + 2 * random[n]);
  const parts = {
    drift: t.map((time) => 18 * Math.sin(TAU * 0.35 * time)), line: t.map((time) => 5 * Math.sin(TAU * 60 * time)),
    blink: t.map((time) => 65 * Math.exp(-(((time - 1.7) / 0.16) ** 2))),
    muscle: t.map((time, n) => (time > 2.5 && time < 3.2 ? 9 * random[(n * 13) % N] + 5 * Math.sin(TAU * 37 * time) : 0)),
    measurement: t.map((_, n) => 3 * random[(n * 7 + 3) % N]),
  };
  f.start(() => {
    const active = Object.keys(parts).filter((key) => f.state[key]);
    plot(components, [{ x: t, y: neural, label: 'illustrative neural component' }, ...active.map((key) => ({ x: t, y: parts[key], label: key }))],
      { xDomain: [0, 4], yDomain: [-85, 85], xLabel: 'Time (s)', yLabel: 'Voltage (µV)' });
    const sum = neural.map((value, n) => value + active.reduce((total, key) => total + parts[key][n], 0));
    plot(observed, [{ x: t, y: sum, label: 'measured = neural + artifacts + noise' }],
      { xDomain: [0, 4], yDomain: [-100, 100], xLabel: 'Time (s)', yLabel: 'Voltage (µV)' });
    f.observation.textContent = 'These components overlap in time and frequency. A high-pass filter can reduce drift but also attenuate genuine slow activity; a notch can suppress line interference but cannot identify every oscillation near that frequency. The decomposition is known here only because we constructed it.';
  });
}

