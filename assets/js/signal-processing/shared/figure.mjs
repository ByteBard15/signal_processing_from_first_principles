import { defaults } from '../../../../data/signal-processing/experiments.mjs';

export function element(tag, text, attrs = {}) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}
export function figure(root, key) {
  let state = structuredClone(defaults[key]);
  const ui = root.querySelector('.experiment-ui');
  const controls = element('div', undefined, { class: 'sim-controls' });
  const plots = element('div', undefined, { class: 'figure-plots' });
  const observation = element('p', undefined, { class: 'sim-readout', 'aria-live': 'polite', 'aria-atomic': 'true' });
  const reset = element('button', 'Reset defaults', { type: 'button', class: 'reset-controls' });
  ui.append(controls, reset, plots, observation);
  let render = () => {}, pending = false;
  const redraw = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; render(); });
  };
  const inputs = [];
  function slider(name, label, min, max, step = 1, unit = '') {
    const id = `${root.id}-${name}`;
    const wrapper = element('label', undefined, { for: id });
    const output = element('output', undefined, { for: id });
    const input = element('input', undefined, { type: 'range', id, min, max, step, value: state[name] });
    const sync = () => { input.value = state[name]; output.value = `${Number(state[name]).toFixed(step < 1 ? 2 : 0)} ${unit}`; };
    wrapper.append(element('span', label), output, input); controls.append(wrapper); inputs.push(sync); sync();
    input.addEventListener('input', () => { state[name] = Number(input.value); sync(); redraw(); });
    return input;
  }
  function select(name, label, choices) {
    const id = `${root.id}-${name}`, wrapper = element('label', label, { for: id });
    const input = element('select', undefined, { id });
    choices.forEach((choice) => {
      const [value, title] = Array.isArray(choice) ? choice : [choice, choice];
      input.append(element('option', title, { value }));
    });
    const sync = () => { input.value = state[name]; }; inputs.push(sync); sync();
    wrapper.append(input); controls.append(wrapper);
    input.addEventListener('change', () => { state[name] = input.value; redraw(); });
    return input;
  }
  function canvas(label, height = 260) {
    const holder = element('div');
    holder.append(element('p', label, { class: 'sim-title' }));
    const node = element('canvas', undefined, { width: 800, height, 'data-plot-height': height, class: 'sim-canvas', role: 'img', 'aria-label': label });
    node.textContent = label; holder.append(node); plots.append(holder); return node;
  }
  let onReset = () => {};
  reset.addEventListener('click', () => {
    state = structuredClone(defaults[key]); inputs.forEach((fn) => fn()); onReset(); redraw();
  });
  const resize = new ResizeObserver(redraw); resize.observe(root);
  root.addEventListener('figure-redraw', redraw);
  return { get state() { return state; }, controls, plots, observation, slider, select, canvas, redraw,
    start(fn, resetExtra = () => {}) { render = fn; onReset = resetExtra; render(); } };
}
