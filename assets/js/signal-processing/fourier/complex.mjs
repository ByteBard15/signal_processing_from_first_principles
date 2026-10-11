import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { linspace } from '../math/numeric.mjs';
import { exp, add } from '../math/complex.mjs';
export default function ComplexFrequencyExplorer(root) {
  const f = figure(root, 'complex'); f.slider('angle', 'Rotation phase θ', 0, 360, 1, 'degrees');
  const plane = f.canvas('Conjugate rotations and their real sum', 600), projection = f.canvas('Real projections coincide; imaginary projections cancel');
  const angles = linspace(0, 2 * Math.PI);
  f.start(() => {
    const theta = f.state.angle * Math.PI / 180, positive = exp(theta), negative = exp(-theta), total = add(positive, negative);
    plot(plane, [{ x: angles.map((v) => exp(v).re), y: angles.map((v) => exp(v).im), label: 'Unit circle' },
      { x: [0, positive.re], y: [0, positive.im], label: '+θ rotation', markers: true },
      { x: [0, negative.re], y: [0, negative.im], label: '−θ rotation', markers: true },
      { x: [0, total.re / 2], y: [0, 0], label: 'Conjugate average = cos θ', markers: true }],
    { xDomain: [-1.45, 1.45], yDomain: [-1.1, 1.1], xLabel: 'Real part', yLabel: 'Imaginary part', equalAspect: true });
    plot(projection, [{ x: angles, y: angles.map((v) => exp(v).re), label: 'cos θ' },
      { x: angles, y: angles.map((v) => exp(v).im), label: '+sin θ' },
      { x: angles, y: angles.map((v) => exp(-v).im), label: '−sin θ' }],
    { xDomain: [0, 2 * Math.PI], yDomain: [-1.2, 1.2], xLabel: 'Rotation phase (rad)', yLabel: 'Projection' });
    f.observation.textContent = `At θ = ${f.state.angle}°, the average is ${positive.re.toFixed(3)} + j0. What to notice: sweep the phase to trace opposite directions. Negative frequency describes direction of complex rotation; both real projections have the same oscillation rate.`;
  });
}
