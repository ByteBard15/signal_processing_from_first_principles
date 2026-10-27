const palette = ['--accent', '--accent2', '--muted', '--ink'];
const styles = [[], [7, 4], [2, 4], [10, 3, 2, 3], [12, 6], [2, 2, 8, 2]];
const styleNames = ['solid', 'dashed', 'dotted', 'dash-dot', 'long dash', 'dot-dash'];
const css = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
export function frame(canvas, { xDomain, yDomain, xLabel, yLabel, equalAspect = false }) {
  // Draw in CSS pixels, keeping axes readable on phones and sharp on HiDPI.
  const W = Math.max(280, Math.round(canvas.getBoundingClientRect().width));
  const left = W < 500 ? 62 : 78, right = W - 24, top = 24;
  const H = equalAspect ? Math.round((right - left) * (yDomain[1] - yDomain[0]) / (xDomain[1] - xDomain[0]) + 78) : Number(canvas.dataset.plotHeight || 260);
  const dpr = window.devicePixelRatio || 1;
  canvas.style.height = `${H}px`;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const bottom = H - 54;
  ctx.clearRect(0, 0, W, H); ctx.fillStyle = css('--panel', '#fff'); ctx.fillRect(0, 0, W, H);
  const x = (v) => left + (v - xDomain[0]) / (xDomain[1] - xDomain[0]) * (right - left);
  const y = (v) => bottom - (v - yDomain[0]) / (yDomain[1] - yDomain[0]) * (bottom - top);
  ctx.font = '13px system-ui';
  for (let i = 0; i <= 4; i++) {
    const xv = xDomain[0] + i / 4 * (xDomain[1] - xDomain[0]), yv = yDomain[0] + i / 4 * (yDomain[1] - yDomain[0]);
    ctx.strokeStyle = css('--line', '#d6e0e7'); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x(xv), top); ctx.lineTo(x(xv), bottom); ctx.moveTo(left, y(yv)); ctx.lineTo(right, y(yv)); ctx.stroke();
    ctx.fillStyle = css('--muted', '#526b7a'); ctx.textAlign = 'center'; ctx.fillText(short(xv), x(xv), bottom + 22);
    ctx.textAlign = 'right'; ctx.fillText(short(yv), left - 8, y(yv) + 5);
  }
  if (yDomain[0] <= 0 && yDomain[1] >= 0) {
    ctx.strokeStyle = css('--muted', '#526b7a'); ctx.beginPath(); ctx.moveTo(left, y(0)); ctx.lineTo(right, y(0)); ctx.stroke();
  }
  ctx.fillStyle = css('--ink', '#102a43'); ctx.textAlign = 'center'; ctx.fillText(xLabel, (left + right) / 2, H - 7);
  ctx.save(); ctx.translate(17, (top + bottom) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(yLabel, 0, 0); ctx.restore();
  return { ctx, x, y, left, right, top, bottom };
}
const short = (v) => Math.abs(v) >= 1000 ? v.toExponential(1) : Number(v.toPrecision(3)).toString();
export function plot(canvas, curves, options) {
  const p = frame(canvas, options), { ctx, x, y } = p;
  ctx.save(); ctx.beginPath(); ctx.rect(p.left, p.top, p.right - p.left, p.bottom - p.top); ctx.clip();
  curves.forEach((curve, i) => {
    ctx.strokeStyle = css(palette[i % palette.length], '#087e8b'); ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = 2; ctx.setLineDash(styles[i % styles.length]);
    ctx.beginPath();
    curve.x.forEach((v, j) => {
      const py = y(curve.y[j]);
      if (curve.stems) { ctx.moveTo(x(v), y(0)); ctx.lineTo(x(v), py); }
      else if (j === 0) ctx.moveTo(x(v), py); else ctx.lineTo(x(v), py);
    });
    ctx.stroke(); ctx.setLineDash([]);
    if (curve.markers) curve.x.forEach((v, j) => { ctx.beginPath(); ctx.arc(x(v), y(curve.y[j]), 3, 0, 2 * Math.PI); ctx.fill(); });
  });
  ctx.restore();
  const labels = curves.map((c, i) => `${i + 1}. ${c.label} (${styleNames[i % styleNames.length]}${c.stems ? ', stems' : ''})`).join('; ');
  canvas.setAttribute('aria-label', `${options.xLabel} versus ${options.yLabel}. ${labels}`);
  let legend = canvas.nextElementSibling;
  if (!legend || !legend.classList.contains('plot-legend')) { legend = document.createElement('p'); legend.className = 'plot-legend'; canvas.after(legend); }
  legend.textContent = labels;
  return p;
}
// Arbitrary {frequencies, values}; synthesis belongs to experiment modules.
export function spectrumPlot(canvas, spectrum, { label = 'Spectrum', logarithmic = false, ...options } = {}) {
  const values = logarithmic ? spectrum.values.map((v) => 20 * Math.log10(Math.max(1e-6, v))) : spectrum.values;
  return plot(canvas, [{ x: spectrum.frequencies, y: values, label, stems: !logarithmic }], {
    xDomain: [0, spectrum.frequencies.at(-1)], yDomain: logarithmic ? [-100, 6] : [0, Math.max(0.01, ...values) * 1.1],
    xLabel: 'Frequency (Hz)', yLabel: logarithmic ? 'Magnitude (dB re 1)' : 'Amplitude', ...options });
}
export function spectrogram(canvas, result, timeDomain, { floor = -70, ceiling = 0, ariaLabel = 'Spectrogram of power spectral density over time.' } = {}) {
  const { frames, sampleRate, length, hop } = result;
  const p = frame(canvas, { xDomain: timeDomain, yDomain: [0, sampleRate / 2], xLabel: 'Window center time (s)', yLabel: 'Frequency (Hz)' });
  const { ctx, x, y } = p;
  ctx.save(); ctx.beginPath(); ctx.rect(p.left, p.top, p.right - p.left, p.bottom - p.top); ctx.clip();
  frames.forEach((f) => f.values.forEach((value, k) => {
    const db = 10 * Math.log10(Math.max(value, 1e-10)), level = Math.max(0, Math.min(1, (db - floor) / (ceiling - floor)));
    ctx.fillStyle = `hsl(${240 - 200 * level} 75% ${12 + 55 * level}%)`;
    const df = sampleRate / length;
    ctx.fillRect(x(f.time - hop / sampleRate / 2), y((k + 0.5) * df), Math.max(1, x(hop / sampleRate) - x(0)), y((k - 0.5) * df) - y((k + 0.5) * df) + 1);
  }));
  ctx.restore();
  canvas.setAttribute('aria-label', `${ariaLabel} Power colour scale ${floor} to ${ceiling} dB.`);
  let legend = canvas.nextElementSibling;
  if (!legend || !legend.classList.contains('plot-legend')) { legend = document.createElement('p'); legend.className = 'plot-legend'; canvas.after(legend); }
  legend.textContent = `Colour scale: dark blue ${floor} dB to pale amber ${ceiling} dB.`;
}
