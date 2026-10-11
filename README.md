# Signal Processing from First Principles

An interactive Jekyll research publication in the format of the author's
[digital oscilloscope project](https://github.com/ByteBard15/design_and_construction_of_digital_oscilloscope).
Two articles connect mathematical derivations to deterministic browser experiments:

- [From Harmonics to Spectra](content/signal-processing/article-01-fourier-series-transform/index.md)
- [From Samples to Spectra](content/signal-processing/article-02-sampling-dft-fft/index.md)

## Run locally

Use Ruby/Bundler with the existing GitHub Pages dependency set:

```sh
bundle install
bundle exec jekyll serve
```

Open `http://127.0.0.1:4000/signal_processing_from_first_principles/`.
The site retains Jekyll, Kramdown/GFM, MathJax 3, Liquid, and the reference site's
CSS. Plots use native Canvas and JavaScript ES modules, without a frontend build
step. MathJax loads from its existing CDN; plots and calculations are local.

## Verify

```sh
node --test tests/signal-processing/*.test.mjs
bundle exec jekyll build --strict_front_matter
node tests/signal-processing/check-site.mjs
```

The CI workflow runs these checks and **does not deploy**. No publication workflow
is included. URL/baseurl are prepared for the repository's GitHub Pages path,
not a claim that the site has been published.

See [the developer guide](docs/signal-processing.md) for the outlines, notation,
library/UI separation, normalization, reusable plotting helpers, and how to add
EEG or audio articles. Each article carries its own metadata and reference IDs.

## Model limits

Synthetic signals are not instrument measurements. Impulse sampling and infinite
sinc interpolation are ideal models; the interactive sinc sum is finite. The
Fourier limit uses a unit rectangular pulse with scaled coefficients T C_k.
Phasors use a phase slider rather than an automatic animation. FFT butterflies
use eight inputs, and graphs use modest grids. PSD has no implicit detrending;
Welch/STFT use complete symmetric-Hann windows. Full mathematical assumptions
are explained alongside the figures.
