import { figure } from '../shared/figure.mjs';
import { plot } from '../shared/plot.mjs';
import { linspace, TAU } from '../math/numeric.mjs';
import { dtft } from '../transforms/dft.mjs';
import { magnitude } from '../math/complex.mjs';
import { rectangleTransform } from '../transforms/fourier-series.mjs';
export default function DTFTPeriodicityExplorer(root) {
  const f = figure(root, 'dtft'); f.slider('span', 'Visible half-span in multiples of π', 1, 6);
  const continuous = f.canvas('CTFT of a continuous rectangular pulse'), discrete = f.canvas('DTFT of five discrete unit samples');
  f.start(() => {
    const span = f.state.span * Math.PI, w = linspace(-span, span, 900), options = { xDomain: [-span, span], yDomain: [0, 1.1] };
    plot(continuous, [{ x: w, y: w.map((v) => Math.abs(rectangleTransform(v))), label: '|X(ω)|, pulse width 1 s' }],
    { ...options, xLabel: 'Continuous angular frequency (rad/s)', yLabel: 'Magnitude (amplitude·s)' });
    plot(discrete, [{ x: w, y: w.map((v) => magnitude(dtft([1, 1, 1, 1, 1], v))), label: '|X(e^{jω})|' }],
    { ...options, yDomain: [0, 5.5], xLabel: 'Normalized angular frequency (rad/sample)', yLabel: 'Magnitude' });
    f.observation.textContent = 'What to notice: the CTFT envelope does not repeat; the discrete sequence repeats its spectrum every 2π rad/sample. These are two illustrative signals, not a claim that their transforms have the same normalization or values.';
  });
}
