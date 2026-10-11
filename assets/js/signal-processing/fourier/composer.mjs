import { figure, element } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { linspace } from '../math/numeric.mjs';
import { oscillator, compose } from '../signals/index.mjs';
export default function SinusoidComposer(root) {
  const f = figure(root, 'composer'), rows = element('div');
  f.controls.replaceWith(rows);
  const add = element('button', 'Add sinusoid', { type: 'button' }); rows.after(add);
  const individual = f.canvas('Individual oscillations'), sum = f.canvas('Their summed waveform');
  const t = linspace(0, 1);
  function buildRows() {
    rows.replaceChildren();
    f.state.components.forEach((component, index) => {
      const row = element('fieldset', undefined, { class: 'composer-row' }); row.append(element('legend', `Component ${index + 1}`));
      const group = element('div', undefined, { class: 'sim-controls' }); row.append(group);
      const kindId = `${root.id}-kind-${index}`, kindLabel = element('label', 'Oscillator type', { for: kindId });
      const kind = element('select', undefined, { id: kindId });
      ['sine', 'cosine'].forEach((v) => kind.append(element('option', v, { value: v }))); kind.value = component.kind;
      kindLabel.append(kind); group.append(kindLabel);
      kind.addEventListener('change', () => { component.kind = kind.value; f.redraw(); });
      [['amplitude', 'Amplitude', 0, 2, 0.05, ''], ['frequency', 'Frequency', 1, 15, 0.25, 'Hz'], ['phase', 'Phase', -Math.PI, Math.PI, 0.05, 'rad']].forEach(([name, label, min, max, step, unit]) => {
        const id = `${root.id}-${name}-${index}`, wrap = element('label', undefined, { for: id });
        const output = element('output', `${component[name].toFixed(2)} ${unit}`, { for: id });
        const input = element('input', undefined, { id, type: 'range', min, max, step, value: component[name] });
        wrap.append(element('span', label), output, input); group.append(wrap);
        input.addEventListener('input', () => { component[name] = Number(input.value); output.value = `${component[name].toFixed(2)} ${unit}`; f.redraw(); });
      });
      const remove = element('button', `Remove component ${index + 1}`, { type: 'button' }); remove.disabled = f.state.components.length <= 1;
      remove.addEventListener('click', () => { f.state.components.splice(index, 1); buildRows(); f.redraw(); }); row.append(remove); rows.append(row);
    });
    add.disabled = f.state.components.length >= 6;
  }
  add.addEventListener('click', () => { f.state.components.push({ kind: 'sine', amplitude: 0.3, frequency: 7, phase: 0 }); buildRows(); f.redraw(); });
  buildRows();
  f.start(() => {
    const curves = f.state.components.map((c, i) => ({ x: t, y: t.map(oscillator(c)), label: `Component ${i + 1}: ${c.frequency} Hz` }));
    plot(individual, curves, { xDomain: [0, 1], yDomain: [-2.2, 2.2], xLabel: 'Time (s)', yLabel: 'Amplitude' });
    const bound = Math.max(1, f.state.components.reduce((a, c) => a + c.amplitude, 0));
    plot(sum, [{ x: t, y: t.map(compose(f.state.components)), label: 'Sum' }], { xDomain: [0, 1], yDomain: [-bound * 1.1, bound * 1.1], xLabel: 'Time (s)', yLabel: 'Amplitude' });
    f.observation.textContent = 'What to notice: changing phase can reshape the sum without changing the set of component frequencies. At most six oscillators keep the experiment readable.';
  }, buildRows);
}
