# Signal Processing from First Principles

## Reference and layers

Adapted from the author's oscilloscope research site, commit `1d6de2d`:
Jekyll/GFM, Liquid includes, MathJax 3, Georgia headings, system prose,
CSS tokens, vanilla JavaScript and Canvas. No plotting or UI dependencies.
The reference checkout in `tmp/oscilloscope-reference` is not site content.

- Prose/metadata: `content/signal-processing/<article>/index.md`.
- Math: `assets/js/signal-processing/{math,signals,transforms,sampling,windows,filters,spectral}`.
- UI: `shared`, `fourier`, `digital` under the same JS root.
- Reproducible defaults/fixtures: `data/signal-processing` (browser imports).
- References: `_data/references.yml`, rendered at each article's end.
- Tests: `node --test tests/signal-processing/*.test.mjs`.

The JS files are native ES modules (`.mjs`) so Node and browsers share exactly
the same algorithms without a bundler. Jekyll copies these as static assets.

## Outlines reviewed before implementation

**Article 1:** composition → functions as vectors/probe → orthogonality-derived
trigonometric series → harmonic reconstruction → pointwise versus energy
convergence → Gibbs → conjugate rotations/complex series → Parseval → periodic
pulse with growing T/Riemann-sum transform limit → rectangle/Gaussian and shifts
→ a brief continuous response/convolution example → necessary transform
properties → short proof checks → unresolved sampling question.

**Article 2:** impulse-train multiplication/replicas → aliasing/overlap → sinc
reconstruction → the discrete sequence as its own object → periodic DTFT →
physical versus normalized frequency → unit-circle aside.

**Article 3:** weighted sums/convolution → frequency multiplication → finite
basis/DFT → periodic extension → bin spacing and duration → leakage/windows →
even/odd FFT/butterflies → direct comparison → practical two-tone analysis →
linked continuous-time/DTFT/DFT/FFT/inverse experiment.

No Laplace/Z derivations, general LTI/control chapters, or standalone convolution
treatment. Convolution earns its place through smoothing and finite windows.

## Notation and normalization

`x(t)`: continuous; `x[n]`: discrete; `X(ω)`: CTFT, ω in rad/s;
`X(e^{jω})`: DTFT, ω in rad/sample (explicitly announced at the transition);
`X[k]`: DFT; `f` in Hz; `ω=2πf` only for continuous time.
`T`, `ω₀=2π/T`: periodic signal; `T_s=1/f_s`: sample interval;
`N`: record/DFT length; `Δf=f_s/N`: bin spacing.

CTFT: forward integral unscaled; inverse `1/(2π)`.
DFT: forward sum unscaled; inverse `1/N`.
DTFT inverse: `1/(2π)` integral over one frequency period.
Normalized sinc is `sin(πu)/(πu)`.
In Markdown prose, write absolute values with `\lvert`/`\rvert` and a starred
subscript with `\ast`: bare pipes or asterisks can be parsed as GFM tables or
emphasis before MathJax sees them. Put long formulas in display blocks so the
existing equation container can scroll on narrow screens.
Window definitions are symmetric (`N−1` denominator). Power-density, Welch and
STFT conventions remain reusable numerical modules for the planned EEG article,
where their assumptions and physical units will be introduced.

## Extending

Add a figure module exporting an initializer; register it in `boot.mjs`, add
defaults in `data/signal-processing/experiments.mjs`, then compose with
`{% include interactive-figure.html ... %}`. Give it a stable ID, description,
caption, labeled controls, and an interpretation. DSP belongs in pure modules.
`plot` and `spectrogram` accept arbitrary data; they do not synthesize signals.
Add numerical tests whenever a new algorithm/normalization is introduced.

Add a Markdown article with explicit permalink, series metadata, citation IDs,
and previous/next URLs; update `_data/navigation.yml` and `index.md`. Planned
articles have no live links. Keep relative_url in all site-local links.

Local site: `bundle install && bundle exec jekyll serve`. Build:
`bundle exec jekyll build --strict_front_matter`, followed by
`node tests/signal-processing/check-site.mjs` for routes, anchors, assets, and
the module import graph. The Pages workflow validates, builds, uploads and
deploys after pushes to `main`, once Pages uses GitHub Actions as its source.

## Validation and deliberate simplifications

Initial implementation: 14 numerical tests pass; strict Jekyll build passes.
Chrome checked all 23 experiments with slider extrema, selector choices, reset,
and composer add/remove; no runtime errors or page overflow at 390 px. Built
articles rendered 284 MathJax expressions without TeX errors. TOC/citation
anchors have no duplicates or missing targets. Desktop/mobile and dark-mode
screenshots were inspected; Canvas labels draw in CSS pixels and resize with
the container rather than shrinking text with a fixed-width bitmap.

Limits: complex rotations are manually phase-stepped; butterflies use N=8;
sinc interpolation is a finite sum; the T-limit uses scaled pulse coefficients;
spectral replicas are evaluated on a bounded display; PSD is a basic estimator
without detrending or confidence intervals. Welch/STFT omit incomplete edge
frames. No static illustrations are needed: figures are generated locally.
Accessibility provides native labeled controls, line-pattern legends, captions,
live interpretation, and exact butterfly/convolution tables; Canvas is not a
complete screen-reader data-table replacement for every plotted point.

Remaining research work is the planned EEG/audio content. PSD, Welch and STFT
will be introduced through EEG rather than appended to the foundations.

Article 1's October 12 review revision expands the inner-product definitions,
completeness/projection reasoning, waveform derivations, and convergence/Gibbs
analysis. It keeps N as the highest included harmonic index and introduces M
for the retained odd-term count. The new causal exponential-response experiment
uses pure functions in `filters/continuous.mjs`; its convolution is checked
against an analytic pulse response and its transform against quadrature.
The frequency probe now offers sine and cosine quadratures. The original large
digital article was split after the DTFT: Article 2 asks what sampling preserves,
while Article 3 asks what a finite computer buffer can calculate.
The revision adds six numerical checks (20 total). Its ten figures and 358
MathJax expressions were verified in Chrome, including mobile overflow, probe
quadratures, and response slider extrema/reset. The build checker rejects
unheaded tables in Article 1 to catch accidental GFM parsing of inline math.
