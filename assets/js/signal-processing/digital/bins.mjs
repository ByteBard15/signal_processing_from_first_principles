import { figure } from '../shared/figure.mjs';
import { plot, spectrumPlot } from '../shared/plot.mjs';
import { sampleSignal } from '../sampling/index.mjs';
import { oscillator } from '../signals/index.mjs';
import { magnitudeSpectrum } from '../spectral/index.mjs';

const css = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

function frequencyCircle(canvas, fs) {
  const W = Math.max(280, Math.round(canvas.getBoundingClientRect().width));
  const H = Number(canvas.dataset.plotHeight || 360), dpr = window.devicePixelRatio || 1;
  canvas.style.height = `${H}px`; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H); ctx.fillStyle = css('--panel', '#fff'); ctx.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2, radius = Math.min(W * 0.29, H * 0.32);
  ctx.strokeStyle = css('--line', '#d6e0e7'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, radius, 0, 2 * Math.PI); ctx.stroke();
  ctx.font = `${W < 470 ? 11 : 13}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let k = 0; k < 8; k++) {
    const angle = -2 * Math.PI * k / 8, px = cx + radius * Math.cos(angle), py = cy + radius * Math.sin(angle);
    const signed = k <= 4 ? k : k - 8, hz = signed * fs / 8;
    ctx.strokeStyle = signed < 0 ? css('--accent2', '#ff9f1c') : css('--accent', '#087e8b');
    ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
    ctx.beginPath(); ctx.arc(px, py, 5, 0, 2 * Math.PI); ctx.fill();
    const labelRadius = radius + (W < 470 ? 34 : 45), lx = cx + labelRadius * Math.cos(angle), ly = cy + labelRadius * Math.sin(angle);
    ctx.fillText(`k=${k}`, lx, ly - 8); ctx.fillText(`${hz.toFixed(Number.isInteger(hz) ? 0 : 1)} Hz`, lx, ly + 9);
  }
  ctx.fillStyle = css('--muted', '#526b7a'); ctx.fillText('same frequency point', cx, cy - 9); ctx.fillText('after one full turn', cx, cy + 9);
  ctx.textAlign = 'left'; ctx.fillStyle = css('--accent', '#087e8b'); ctx.fillText('● nonnegative / counterclockwise', 16, H - 28);
  ctx.textAlign = 'right'; ctx.fillStyle = css('--accent2', '#ff9f1c'); ctx.fillText('negative / clockwise ●', W - 16, H - 28);
  canvas.setAttribute('aria-label', `Eight-point frequency circle at ${fs} samples per second. Bins zero through four are labelled zero through ${fs / 2} hertz; bins five through seven wrap to ${-3 * fs / 8}, ${-2 * fs / 8}, and ${-fs / 8} hertz.`);
}

export default function DFTBinExplorer(root) {
  const f = figure(root, 'bins'); f.slider('frequency', 'Input frequency', 5, 180, 0.5, 'Hz'); f.slider('sampleRate', 'Sampling rate', 256, 1024, 32, 'samples/s');
  f.select('count', 'Number of samples', [['64', '64'], ['128', '128'], ['256', '256'], ['512', '512']]);
  const signal = f.canvas('A source tone versus its nearest DFT basis tone');
  const circle = f.canvas('Why upper DFT indices are signed negative frequencies', 360);
  const spectrum = f.canvas('DFT coefficients at discrete frequency bins');
  f.start(() => {
    const N = Number(f.state.count), fs = f.state.sampleRate, x = sampleSignal(oscillator({ kind: 'sine', frequency: f.state.frequency }), fs, N);
    const k = f.state.frequency * N / fs, nearest = Math.round(k), basisFrequency = nearest * fs / N;
    const shown = Math.min(N, 64), indices = Array.from({ length: shown }, (_, n) => n);
    plot(signal, [
      { x: indices, y: x.samples.slice(0, shown), label: `source tone (${f.state.frequency.toFixed(1)} Hz)`, markers: true },
      { x: indices, y: indices.map((n) => Math.sin(2 * Math.PI * nearest * n / N)), label: `nearest basis k=${nearest} (${basisFrequency.toFixed(2)} Hz)` },
    ], { xDomain: [0, shown - 1], yDomain: [-1.2, 1.2], xLabel: 'Sample index n', yLabel: 'Amplitude' });
    frequencyCircle(circle, fs);
    spectrumPlot(spectrum, magnitudeSpectrum(x.samples, fs), { label: 'One-sided amplitude' });
    f.observation.textContent = `Tone = ${f.state.frequency.toFixed(1)} Hz; nearest bin = k ${nearest} at ${basisFrequency.toFixed(3)} Hz. Δf = f_s/N = ${(fs / N).toFixed(3)} Hz; observation = ${(N / fs).toFixed(3)} s; tone coordinate = ${k.toFixed(3)} bins. A tone belongs to the signal; a bin is one fixed frequency where the DFT looks. ${f.state.frequency >= fs / 2 ? 'This tone is at or above Nyquist and aliases.' : Number.isInteger(k) ? 'The tone is bin-aligned, so the source and basis traces coincide.' : 'The tone lies between bins, so no single basis trace coincides with it.'}`;
  });
}
