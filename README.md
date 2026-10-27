# From Frequency-Domain Analysis to Neural Signals and Sound

An interactive Jekyll research publication in the format of the author's
[digital oscilloscope project](https://github.com/ByteBard15/design_and_construction_of_digital_oscilloscope).
Four published articles connect mathematical derivations to deterministic browser experiments:

- [From Harmonics to Spectra](content/signal-processing/article-01-fourier-series-transform/index.md)
- [From Continuous to Discrete](content/signal-processing/article-02-sampling-dft-fft/index.md)
- [From Samples to Spectra](content/signal-processing/article-03-dft-fft/index.md)
- [Seeing Neural Activity Through Frequency](content/signal-processing/article-04-eeg-frequency-analysis/index.md)

## EEG example data

Article IV uses a compact 521 KB derivative of Subject S001, motor-imagery Run
04 from the [PhysioNet EEG Motor Movement/Imagery Dataset](https://doi.org/10.13026/C28G6P).
It retains eight channels, official event annotations, and 30 four-second epochs
at 160 samples/s. The source is distributed under the Open Data Commons
Attribution License v1.0; attribution and provenance are stored in
`data/signal-processing/eeg-example.json`.

To reproduce it, download `S001R04.edf` from PhysioNet and run:

```sh
node scripts/prepare-eeg-example.mjs path/to/S001R04.edf
```

The full EDF is not committed.

## Run locally

On this workstation, start the server with:

```sh
./scripts/serve
```

The launcher uses the repository-local Ruby runtime in ignored
`tmp/ruby-runtime` when present, or your system's Bundler otherwise. The local
runtime and cached gems survive a system restart; run the command again after
rebooting. It does not install a system service.

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

The Pages workflow runs the numerical and generated-site checks, builds the
Jekyll site, and deploys `_site` after a push to `main`. It can also be run
manually from the Actions tab. The expected live URL is
`https://bytebard15.github.io/signal_processing_from_first_principles/`.

See [the developer guide](docs/signal-processing.md) for the outlines, notation,
library/UI separation, normalization, reusable plotting helpers, and how to add
EEG or audio articles. Each article carries its own metadata and reference IDs.

## Model limits

Synthetic signals are not instrument measurements. Impulse sampling and infinite
sinc interpolation are ideal models; the interactive sinc sum is finite. The
Fourier limit uses a unit rectangular pulse with scaled coefficients T C_k.
Phasors use a phase slider rather than an automatic animation. FFT butterflies
use eight inputs, and graphs use modest grids. The EEG article uses one
illustrative subject/run and a reduced channel set; it does not support clinical
or population claims. Full mathematical assumptions are explained alongside the
figures.
