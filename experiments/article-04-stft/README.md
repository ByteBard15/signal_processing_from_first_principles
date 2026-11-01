# Article 4 STFT experiments

This subproject reproduces the quantitative and visual experiments for
“Seeing Frequency Change Over Time.” It is intentionally independent of the
browser demonstrations: the analysis executable is C++20, FFTs use FFTW, EEG
is decoded directly from its source EDF+ file, and every plotted value is also
written as CSV.

## What it produces

The experiment holds the STFT method, symmetric Hann window, 75% overlap,
sampling frequency, PSD normalization, and decision rules fixed while changing
only window length.

- Five synthetic switch-signal spectrograms at 125, 250, 500, 1000, and 2000 ms.
- A 200-trial, paired-noise Monte Carlo summary for a 30 Hz tone, simultaneous
  30/34 Hz tones, and a 40 Hz burst from 3.0 to 3.5 seconds.
- Frequency-error, two-tone-resolution, and onset-error SVG plots.
- Five C3 EEG spectrograms from the first 30 seconds of EEGMMIDB Subject S001,
  Run 04, at its native 160 Hz sampling frequency.
- Long-form CSV files containing every time, frequency, and PSD value.

The generated files are committed in [`results`](results/) so the article can
reference the exact run. Re-running the project replaces them deterministically.

## Dependencies

- A C++20 compiler
- FFTW 3 development headers and library
- `pkg-config`
- `curl` and `sha256sum` for a fresh EEG download
- CMake 3.20 or later only if using the optional CMake build

On Debian or Ubuntu, the native dependencies are typically provided by
`g++`, `libfftw3-dev`, `pkg-config`, `cmake`, and `curl`.

## Run everything

From the repository root:

```sh
experiments/article-04-stft/run.sh
```

The script downloads the EEG automatically when it is absent, builds into the
ignored `tmp/article-04-stft-build` directory, and writes results to this
subproject's `results` directory. Paths can be overridden:

```sh
experiments/article-04-stft/run.sh path/to/S001R04.edf path/to/output
```

The source recording can also be downloaded separately:

```sh
experiments/article-04-stft/download_eeg.sh
```

The download is `S001R04.edf` from EEGMMIDB v1.0.0 and must match SHA-256
`3d161f88e1c00632585287d2ce584c2bc0f08862438eb255ea8723e00fac693d`.
The EDF is kept under ignored `tmp/` and is not committed.

With CMake:

```sh
cmake -S experiments/article-04-stft -B tmp/article-04-stft-cmake
cmake --build tmp/article-04-stft-cmake
tmp/article-04-stft-cmake/stft_experiments \
  tmp/eeg-source/S001R04.edf \
  experiments/article-04-stft/results
```

## Fixed analysis protocol

Synthetic signals contain 2048 samples at 256 Hz. All five window lengths use
`H = L/4`, `N_FFT = L`, a symmetric Hann window, complete frames only, and the
one-sided PSD normalization

```text
c[k] |X[m,k]|² / (sample_rate * sum(window[n]²)).
```

Noise is Gaussian at 0 dB whole-record SNR. Trial `r` uses seed
`0x5eed0000 + r`; the same seed supplies every window condition, making the
comparisons paired. The reported 200 test records are never used for threshold
selection.

The burst detector integrates 36–44 Hz power and requires two consecutive
frames above threshold. For each window length, its threshold is the empirical
99th percentile of the maximum two-frame statistic from 1000 independent,
noise-only eight-second calibration records. This controls false alarms at the
record level rather than treating correlated spectrogram cells as independent.

The two-tone result is “resolved” only when local maxima lie within 2 Hz of 30
and 34 Hz and the valley is at least 3 dB below the smaller peak. Frequency
error uses the largest PSD bin in 20–45 Hz. Quadratic log-PSD interpolation is
reported separately and does not replace that primary estimator.

## EEG provenance and preprocessing

The EEG source is the public PhysioNet EEG Motor Movement/Imagery Dataset,
version 1.0.0, Subject S001, motor-imagery Run 04. The reader converts EDF
digital samples using the per-channel physical and digital calibration fields.
The experiment selects C3, retains the native 160 Hz sampling rate, and uses
the first 30 seconds. The only preprocessing is subtraction of that interval's
sample mean. There is no filtering, resampling, normalization, or artifact
rejection.

Annotation onsets are drawn as dashed lines for orientation. They are task/rest
labels, not ground truth for an oscillation, so no EEG localization error is
calculated.

## Result interpretation

[`synthetic_summary.csv`](results/synthetic_summary.csv) is the authoritative
compact result. Under this exact signal, SNR, and rule:

- Raw-bin frequency MAE is 2 Hz for 125 and 250 ms, then 0 Hz once 30 Hz lands
  on the 2 Hz-or-denser grid. Interpolated estimates retain small nonzero error.
- The 4 Hz-separated tones are unresolved through 500 ms and resolved in all
  200 trials at 1000 and 2000 ms.
- Burst-onset MAE rises from 0.004 s at 125 ms to 0.502 s at 2000 ms.
- All burst trials are detected, but estimated duration expands as long windows
  mix samples before and after the physical event.

These are outcomes of the declared estimator, not universal constants for each
window duration. The raw-bin 0 Hz errors at longer lengths mean the true tone
coincides with a DFT bin; they do not mean arbitrary frequencies can be
estimated without error.

## Source layout

- `include/stft.hpp`, `src/stft.cpp`: windowing, FFTW execution, one-sided PSD,
  and band integration.
- `include/edf.hpp`, `src/edf.cpp`: minimal EDF+ decoding needed by this run.
- `include/svg.hpp`, `src/svg.cpp`: dependency-free SVG heatmaps and line plots.
- `src/main.cpp`: signal definitions, fixed estimators, Monte Carlo execution,
  CSV output, and experiment orchestration.

The minimal EDF reader is deliberately scoped to this reproducible experiment;
it is not presented as a general clinical-file library.
