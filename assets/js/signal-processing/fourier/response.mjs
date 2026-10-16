import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { linspace, accumulated } from '../math/numeric.mjs';
import { magnitude } from '../math/complex.mjs';
import { exponentialResponse, exponentialTransform, pulseResponse } from '../filters/continuous.mjs';

export default function ContinuousResponseExplorer(root) {
  const f = figure(root, 'response');
  f.slider('responseTime', 'Response time τ_r', 0.1, 1, 0.05, 's');
  f.slider('observation', 'Observe the output at t', 0, 3, 0.05, 's');
  const signal = f.canvas('One-second input pulse and its output');
  const kernel = f.canvas('Shifted response h(t−τ) and weighted contribution');
  const running = f.canvas('Accumulated area at the selected output instant');
  const spectrum = f.canvas('Response magnitude: the frequency multiplier');
  f.start(() => {
    const { responseTime: r, observation: time } = f.state;
    const t = linspace(-0.5, 4, 650), output = t.map((v) => pulseResponse(v, 1, r));
    plot(signal, [{ x: t, y: t.map((v) => v >= 0 && v <= 1 ? 1 : 0), label: 'Input x(t)' },
      { x: t, y: output, label: 'Output (x*h)(t)' },
      { x: [time], y: [pulseResponse(time, 1, r)], label: 'Selected output value', markers: true, stems: true }],
    { xDomain: [-0.5, 4], yDomain: [-0.1, 1.1], xLabel: 'Time (s)', yLabel: 'Amplitude' });
    // The input support and causality give this exact integration interval.
    const end = Math.min(time, 1), inputTimes = end > 0 ? linspace(0, end, 512) : [0, 0];
    const product = end > 0 ? inputTimes.map((v) => exponentialResponse(time - v, r)) : [0, 0];
    const allTimes = linspace(-0.25, 3.25, 900);
    plot(kernel, [{ x: allTimes, y: allTimes.map((v) => exponentialResponse(time - v, r)), label: 'Shifted kernel h(t−τ)' },
      { x: inputTimes, y: product, label: 'x(τ)h(t−τ) on its integration interval' }],
    { xDomain: [-0.25, 3.25], yDomain: [0, 1.1 / r], xLabel: 'Input time τ (s)', yLabel: 'Weighted response (1/s)' });
    const integral = accumulated(product, end > 0 ? end / (product.length - 1) : 0);
    plot(running, [{ x: inputTimes, y: integral, label: 'Area accumulated over input times' }],
    { xDomain: [0, 1], yDomain: [0, 1.1], xLabel: 'Integration limit in input time (s)', yLabel: 'Accumulated amplitude' });
    const w = linspace(0, 30);
    plot(spectrum, [{ x: w, y: w.map((v) => magnitude(exponentialTransform(v, r))), label: '|H(ω)|' }],
    { xDomain: [0, 30], yDomain: [0, 1.1], xLabel: 'Angular frequency (rad/s)', yLabel: 'Gain magnitude' });
    const analytic = pulseResponse(time, 1, r);
    f.observation.textContent = `At t = ${time.toFixed(2)} s: integrated contribution ${integral.at(-1).toFixed(5)}, analytic output ${analytic.toFixed(5)}. What to notice: only earlier input times contribute. A longer response time spreads the output tail and suppresses more high frequencies. The frequency gain reaches 1/√2 at ω = ${(1 / r).toFixed(2)} rad/s.`;
  });
}
