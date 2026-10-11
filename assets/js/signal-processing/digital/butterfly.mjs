import { figure, element } from '../shared/figure.mjs';
import { frame } from '../shared/plot.mjs';
import { fftStages } from '../transforms/fft.mjs';
import { format } from '../math/complex.mjs';
import { binTone } from '../../../../data/signal-processing/fixtures.mjs';
export default function FFTButterflyExplorer(root) {
  const f = figure(root, 'butterfly'); f.slider('stage', 'FFT stage (0 = bit-reversed inputs)', 0, 3);
  const canvas = f.canvas('Eight-point radix-2 stage connections', 440), table = element('table', undefined, { class: 'fft-table' }), twiddles = element('p'); f.plots.append(table, twiddles);
  const input = binTone(8, 1), result = fftStages(input);
  f.start(() => {
    const stage = result.stages[f.state.stage], previous = result.stages[Math.max(0, f.state.stage - 1)], p = frame(canvas,
      { xDomain: [0, 1], yDomain: [7.5, -0.5], xLabel: 'Previous → selected stage', yLabel: 'Array slot (top = 0)' });
    const { ctx, x, y } = p; ctx.strokeStyle = '#087e8b'; ctx.lineWidth = 2;
    stage.butterflies.forEach(({ a, b }) => { [[a, a], [a, b], [b, a], [b, b]].forEach(([from, to]) => { ctx.beginPath(); ctx.moveTo(x(0.15), y(from)); ctx.lineTo(x(0.85), y(to)); ctx.stroke(); }); });
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink'); ctx.font = '13px monospace'; ctx.textAlign = 'center';
    for (let i = 0; i < 8; i++) { ctx.fillText(format(previous.values[i]), x(0.15), y(i) - 6); ctx.fillText(format(stage.values[i]), x(0.85), y(i) - 6); }
    canvas.setAttribute('aria-label', `FFT stage ${f.state.stage}; connections shown between paired slots. Exact values and twiddles follow in the table.`);
    table.replaceChildren(); const head = element('tr'); ['Slot', 'Original input index (bit-reversed stage 0)', 'Selected-stage value'].forEach((v) => head.append(element('th', v, { scope: 'col' }))); table.append(head);
    stage.values.forEach((v, i) => { const row = element('tr'); [i, result.ordering[i], format(v)].forEach((v) => row.append(element('td', v))); table.append(row); });
    twiddles.textContent = stage.butterflies.length ? stage.butterflies.map(({ a, b, j, size, twiddle }) => `Slots ${a},${b}: W_${size}^${j} = ${format(twiddle)}`).join('; ') : `Original input x[n]: ${input.map((v) => v.toFixed(3)).join(', ')}`;
    f.observation.textContent = `Stage ${f.state.stage}: group size ${stage.size}. What to notice: each butterfly writes u+Wv and u−Wv. Stage 0 reorders indices ${result.ordering.join(', ')}; stage 3 gives natural-order X[k]. The input is cos(2πn/8), so final peaks are at bins 1 and 7.`;
  });
}
