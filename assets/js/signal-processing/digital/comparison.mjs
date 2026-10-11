import { figure, element } from '../shared/figure.mjs';
import { directDFT } from '../transforms/dft.mjs';
import { radix2FFT } from '../transforms/fft.mjs';
import { noise } from '../signals/index.mjs';
export default function DFTFFTComparison(root) {
  const f = figure(root, 'comparison'); f.select('count', 'Transform length', ['8', '16', '32', '64', '128']);
  const table = element('table'); f.plots.append(table);
  f.start(() => {
    const N = Number(f.state.count), x = noise(42, N), direct = directDFT(x), fast = radix2FFT(x);
    const error = direct.map((v, k) => Math.hypot(v.re - fast[k].re, v.im - fast[k].im));
    table.replaceChildren(); const head = element('tr'); ['First eight bins k', '|DFT[k]|', '|FFT[k]|', 'Complex difference'].forEach((v) => head.append(element('th', v, { scope: 'col' }))); table.append(head);
    for (let k = 0; k < Math.min(8, N); k++) { const row = element('tr'); [k, Math.hypot(direct[k].re, direct[k].im).toFixed(6), Math.hypot(fast[k].re, fast[k].im).toFixed(6), error[k].toExponential(2)].forEach((v) => row.append(element('td', v))); table.append(row); }
    f.observation.textContent = `Maximum complex error over all ${N} bins: ${Math.max(...error).toExponential(3)}. Direct sum terms: ${N * N}; radix-2 butterflies: ${N / 2 * Math.log2(N)}. What to notice: both algorithms evaluate the same transform, with small floating-point differences from summation order.`;
  });
}
