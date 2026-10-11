---
title: "From Samples to Spectra: Sampling, DTFT, DFT and the FFT"
subtitle: What a finite digital record can tell us
slug: samples-to-spectra
permalink: /articles/samples-to-spectra/
description: "Deriving spectral replicas, understanding finite observations, and tracing the mathematics from a sampled signal to an FFT, a power estimate, and a spectrogram."
series: Signal Processing from First Principles
article_number: 2
date: 2026-10-11
updated: 2026-10-11
reading_time: 38
tags: [sampling, DSP, FFT, spectral analysis, interactive research]
interactive: true
previous_page: /articles/harmonics-to-spectra/
previous_title: From Harmonics to Spectra
references: [R3, R4, R5, R6, R7]
---

## What does sampling actually do?

An ADC does not store a continuous voltage curve. It stores a sequence of observations. If the clock is uniform, the $n$th observation is

$$x[n]=x(nT_s),\qquad T_s=\frac1{f_s}.$$

Here $T_s$ is seconds/sample and $f_s$ is samples/second. A computer can draw lines between samples, but those lines are an assumption about what happened between measurements. The samples alone do not contain every continuous-time detail.

[Article 1]({{ '/articles/harmonics-to-spectra/#what-if-the-signal-never-repeats' | relative_url }}) derived the convention

$$X(\omega)=\int_{-\infty}^{\infty}x(t)e^{-j\omega t}\,dt,
\qquad x(t)=\frac1{2\pi}\int X(\omega)e^{j\omega t}\,d\omega.$$

In this section $\omega$ is still continuous angular frequency in rad/s. Let $\omega_s=2\pi f_s$. Represent ideal sampling using a train of Dirac impulses:

$$p(t)=\sum_{n=-\infty}^{\infty}\delta(t-nT_s),
\qquad x_s(t)=x(t)p(t)=\sum_n x(nT_s)\delta(t-nT_s).$$

An impulse is not a tall finite-height sample marker. It is a distribution that contributes its weight when integrated: $\int q(t)\delta(t-a)\,dt=q(a)$. The sampled signal is a continuous-time distribution, distinct from the number sequence $x[n]$.

What spectrum does this operation create? The periodic impulse train has Fourier-series coefficients

$$P_m=\frac1{T_s}\int_{\text{one period}}p(t)e^{-jm\omega_st}\,dt=\frac1{T_s}.$$

Choose a period centered on the impulse at zero, avoiding double-counted endpoints. In the distributional sense,

$$p(t)=\frac1{T_s}\sum_m e^{jm\omega_st}.$$

Multiplying $x$ by that series and using the frequency-shift property gives

$$\boxed{X_s(\omega)=\frac1{T_s}\sum_{m=-\infty}^{\infty}X(\omega-m\omega_s).}$$

Thus sampling creates shifted copies at every integer multiple of $f_s$ in Hz. We have derived replication before stating a sample-rate rule. The origin is the periodic timing pattern, not a plotting artifact. [R3](#r3)

Equivalently, $P(\omega)=(2\pi/T_s)\sum_m\delta(\omega-m\omega_s)$, and multiplication in time produces $(X*P)/(2\pi)$ in frequency. We will derive and use convolution shortly; the shift argument above already makes the replicas explicit.

{% include interactive-figure.html id="fig-sampling-spectrum" experiment="sampling" title="Sampling creates spectral copies" description="Change the band limit and sampling rate; compare the original spectrum with replicas whose centers are separated by f_s." caption="The time signal is sinc(2Bt), whose spectrum is flat on |f|&lt;B. Sample markers show impulse weights. The replicated spectrum is divided by f_s to make shape comparisons readable." %}

This is an ideal model. A real ADC also has quantization, aperture effects, jitter, and an analog input path. Those affect measurement accuracy, but they are not needed to establish the ambiguity caused by sampling itself. My [oscilloscope research](https://bytebard15.github.io/design_and_construction_of_digital_oscilloscope/research/) uses the same finite-buffer viewpoint; a plausible trace does not by itself establish a correct analog spectrum. [R7](#r7)

## Aliasing is an ambiguity, not just a distorted plot

If the original spectrum occupies $[-B,B]$ Hz, its nearest copies occupy $[f_s-B,f_s+B]$ and $[-f_s-B,-f_s+B]$. A gap between the central and adjacent copies requires

$$B<f_s-B\quad\Longrightarrow\quad f_s>2B.$$

This is the Nyquist condition emerging from non-overlap. At equality the boundaries touch; exact boundary-frequency sinusoids can be phase-degenerate. We use a strict inequality and, in a physical acquisition chain, leave transition bandwidth for an anti-alias filter.

For a single complex sinusoid, frequencies separated by $mf_s$ are indistinguishable at the sample instants:

$$e^{j2\pi(f_0+mf_s)n/f_s}
=e^{j2\pi f_0n/f_s}e^{j2\pi mn}
=e^{j2\pi f_0n/f_s}.$$

Integer $n$ removes the final factor. A signed representative in $[-f_s/2,f_s/2)$ is

$$f_a=\left((f_0+f_s/2)\bmod f_s\right)-f_s/2.$$

For real cosines, the magnitude $|f_a|$ is often used as the displayed alias frequency. For sines, a negative $f_a$ also changes sign/phase; retaining the signed representative preserves the exact samples.

{% include interactive-figure.html id="fig-aliasing" experiment="aliasing" title="Two waveforms, one sample sequence" description="Raise the true frequency or lower the sampling rate until the apparent low-frequency curve differs from the source." caption="Try 25 Hz sampled at 30 samples/s: sin(2π·25n/30) = −sin(2π·5n/30). The signed alias is −5 Hz, and both continuous curves meet at every sample." %}

The problem is fundamental: a post-acquisition calculation cannot infer which member of that equivalence class produced the sequence without additional assumptions. Avoiding aliasing requires restricting the **analog** bandwidth before sampling. Increasing the FFT length afterward cannot undo overlap that already happened.

## Reconstruction: what continuous signal do the samples specify?

When replicas do not overlap, an ideal low-pass filter can keep the central one. Sampling scaled it by $1/T_s$, so the reconstruction filter must have gain $T_s$ in its passband:

$$H_r(\omega)=\begin{cases}T_s,&|\omega|<\pi/T_s,\\0,&|\omega|>\pi/T_s.\end{cases}$$

Using the inverse transform,

$$\begin{aligned}
h_r(t)&=\frac{T_s}{2\pi}\int_{-\pi/T_s}^{\pi/T_s}e^{j\omega t}\,d\omega\\
&=\frac{\sin(\pi t/T_s)}{\pi t/T_s}
=\operatorname{sinc}(t/T_s).
\end{aligned}$$

Filtering the impulse train is a weighted sum of shifted copies of this kernel, producing

$$\boxed{x(t)=\sum_{n=-\infty}^{\infty}x[n]\operatorname{sinc}\!\left(\frac{t-nT_s}{T_s}\right).}$$

Each sinc equals 1 at its own sample and zero at all the other sample instants. Matching the samples is therefore built into the formula. Recovering the **true** waveform additionally needs the bandlimit, sufficient rate, exact sample times, and the ideal infinite sequence. [R3](#r3)

{% include interactive-figure.html id="fig-sinc-reconstruction" experiment="sinc" title="Reconstruct between sample instants" description="Adjust rate, source frequency, and retained sample count; compare the original with a finite sinc sum." caption="This demonstration truncates the infinite interpolation series. Errors near the ends reflect missing samples; below Nyquist the interior reconstruction follows an aliased source." %}

Increase the sample count while keeping an adequately sampled frequency. The interior improves because more sinc tails participate. Now undersample. The sum still interpolates the retained points, but it cannot distinguish the original source from its baseband alias. Interpolation is not evidence that acquisition was unambiguous.

## Why discrete-time spectra are periodic

We now leave the impulse-weighted continuous-time signal and work with the sequence $x[n]$. Define its discrete-time Fourier transform:

$$X(e^{j\omega})=\sum_{n=-\infty}^{\infty}x[n]e^{-j\omega n}.$$

**From this point, DTFT $\omega$ is normalized angular frequency in rad/sample.** It is related to physical Hz by $\omega=2\pi f/f_s$, not $2\pi f$. The notation $X(e^{j\omega})$ emphasizes the unit-circle frequency parameter; it does not introduce a different input signal for each $\omega$.

For every integer $n$,

$$e^{-j(\omega+2\pi)n}=e^{-j\omega n}e^{-j2\pi n}=e^{-j\omega n}.$$

Consequently,

$$\boxed{X(e^{j(\omega+2\pi)})=X(e^{j\omega}).}$$

The periodicity is in the basis itself. It holds for every absolutely summable sequence and for finite sequences, with suitable generalized interpretations beyond that class. The inverse needs only one period:

$$x[n]=\frac1{2\pi}\int_{-\pi}^{\pi}X(e^{j\omega})e^{j\omega n}\,d\omega.$$

Substitute the forward sum and integrate: $\int_{-\pi}^{\pi}e^{j\omega(n-m)}d\omega$ is $2\pi$ if $n=m$ and zero otherwise. This is the same orthogonality argument as Article 1, with the integration now in frequency rather than time.

{% include interactive-figure.html id="fig-dtft-periodicity" experiment="dtft" title="Continuous frequency does not imply a nonperiodic spectrum" description="Expand the displayed frequency span; compare a continuous pulse CTFT with the DTFT of a finite discrete sequence." caption="The DTFT is continuous in its frequency argument but repeats every 2π rad/sample. The CTFT curve uses rad/s and generally does not repeat." %}

Keep three objects separate:

- A continuous-time transform $X(\Omega)$, with $\Omega$ in rad/s, is generally not periodic.
- The impulse-sampled continuous signal has replicas separated by $\omega_s=2\pi f_s$ rad/s.
- The sequence DTFT repeats every $2\pi$ rad/sample.

The last two describe related representations. Directly transforming the impulses gives

$$X_s(\Omega)=\sum_n x[n]e^{-j\Omega nT_s}=X(e^{j\Omega T_s}).$$

Writing $\Omega$ for physical angular frequency here prevents the unit conversion from disappearing into notation. The period $2\pi$ in $\Omega T_s$ corresponds to $2\pi/T_s$ in $\Omega$.

{% include callout.html type="note" title="Going further: the unit circle" content="The Z-transform uses z = r e^{jω}; the DTFT is its unit-circle evaluation r = 1 when that evaluation converges. Moving off the circle adds radial weighting and a region-of-convergence question. See the [Z-transform overview](https://en.wikipedia.org/wiki/Z-transform). We do not need that additional machinery for finite spectral records." %}

## Convolution earns its place: a weighted local measurement

Suppose a noisy sequence should be smoothed. A length-$L$ moving average computes

$$y[n]=\frac1L\left(x[n]+x[n-1]+\cdots+x[n-L+1]\right).$$

Define $h[k]=1/L$ for $0\le k<L$ and zero otherwise. Then

$$y[n]=\sum_k h[k]x[n-k]=\sum_k x[k]h[n-k]=(x*h)[n].$$

This is convolution: shift a weighting pattern, multiply the aligned values, and add. For the causal average, the output uses current and earlier samples. The output is delayed relative to a symmetric average, a timing effect that a magnitude-only spectrum will not show.

{% include interactive-figure.html id="fig-convolution" experiment="convolution" title="Watch a weighted sum move across a record" description="Slide the output index and change kernel length; inspect each multiplied input and its contribution to y[n]." caption="The highlighted samples are x[n−k]. The table shows h[k] and each product before accumulation. The signal's noise is deterministic." %}

There is no need to develop a general systems theory to use this operation. The question is now concrete: **why does averaging reduce some oscillations more than others?**

## Why convolution becomes frequency multiplication

For finite sequences or absolutely summable ones, change variables $m=n-k$ in the DTFT of the output:

$$\begin{aligned}
Y(e^{j\omega})
&=\sum_n\left[\sum_k x[k]h[n-k]\right]e^{-j\omega n}\\
&=\sum_k x[k]e^{-j\omega k}\sum_m h[m]e^{-j\omega m}\\
&=X(e^{j\omega})H(e^{j\omega}).
\end{aligned}$$

The shift in each weighted input becomes a phase factor, and the double sum separates. This is the convolution theorem, derived for the operation we just used.

For the moving average, a geometric series yields

$$\begin{aligned}
H(e^{j\omega})&=\frac1L\sum_{k=0}^{L-1}e^{-j\omega k}\\
&=e^{-j\omega(L-1)/2}\frac{\sin(L\omega/2)}{L\sin(\omega/2)}.
\end{aligned}$$

At $\omega=0$, take the limit $H=1$: constant levels survive. Higher-frequency oscillations have alternating values within the averaging window, so they cancel. The sine ratio predicts the zeros and sidelobes; the exponential factor gives a delay of $(L-1)/2$ samples. A moving average is a useful simple smoother, but it is not an ideal monotonic low-pass response.

{% include interactive-figure.html id="fig-filter-spectrum" experiment="filter" title="One filtering operation, two equivalent descriptions" description="Increase moving-average length; compare the input, kernel, full output, and their three spectra." caption="The output is full linear convolution, including its tail. Its numerical DTFT is compared against the complex product XH rather than merely comparing magnitudes." %}

We will also need the dual statement. Insert the inverse DTFT of $w[n]$ into the transform of $x[n]w[n]$:

$$\begin{aligned}
Z(e^{j\omega})
&=\sum_n x[n]e^{-j\omega n}\frac1{2\pi}\int_{-\pi}^{\pi}W(e^{j\theta})e^{j\theta n}\,d\theta\\
&=\frac1{2\pi}\int_{-\pi}^{\pi}W(e^{j\theta})X(e^{j(\omega-\theta)})\,d\theta.
\end{aligned}$$

Multiplication in discrete time becomes **periodic convolution in normalized frequency**. The continuous-time counterpart integrates over the whole frequency line with the same $1/(2\pi)$ convention. We will use this result to explain what a finite observation window does to a tone.

One computational caution: multiplying two $N$-point DFTs and applying an inverse DFT gives **circular** convolution. To obtain the full linear convolution of lengths $L_x,L_h$, pad both to at least $L_x+L_h-1$ before transforming. The periodic basis will explain why.

## Finite observations lead to the DFT

The DTFT has a continuous argument and can describe an infinite sequence. A buffer contains only

$$x[0],x[1],\ldots,x[N-1].$$

First, treat the finite record as zero outside its observed indices. Its DTFT is a finite sum. Evaluate it at $N$ equally spaced points on one frequency period:

$$\omega_k=\frac{2\pi k}{N},\qquad k=0,1,\ldots,N-1.$$

This produces the discrete Fourier transform:

$$\boxed{X[k]=\sum_{n=0}^{N-1}x[n]e^{-j2\pi kn/N}.}$$

These evaluations have an extra useful property: they form a complete coordinate system for an $N$-dimensional data vector. For two different bin indices modulo $N$,

$$\sum_{n=0}^{N-1}e^{j2\pi(k-\ell)n/N}
=\frac{1-e^{j2\pi(k-\ell)}}{1-e^{j2\pi(k-\ell)/N}}=0.$$

When $k=\ell$, the sum is $N$. Therefore the inverse is

$$x[n]=\frac1N\sum_{k=0}^{N-1}X[k]e^{j2\pi kn/N},\qquad 0\le n<N.$$

Again, coefficients are projections divided by basis length on reconstruction. The forward DFT as defined here stores unnormalized projections; $X[k]/N$ is the corresponding coefficient in the inverse series. DFT Parseval consequently reads

$$\sum_{n=0}^{N-1}|x[n]|^2=\frac1N\sum_{k=0}^{N-1}|X[k]|^2.$$

For a real cosine exactly at a non-DC, non-Nyquist bin, its amplitude $A$ appears as $|X[k]|=AN/2$ in each conjugate bin. The two-sided representation and the $N$ scaling both matter when making a physical amplitude plot.

## Why the DFT has two periodic interpretations

Extending the coefficient formula beyond its usual indices,

$$X[k+N]=\sum_n x[n]e^{-j2\pi(k+N)n/N}=X[k],$$

because $e^{-j2\pi n}=1$. The DFT repeats in **bin index** with period $N$.

Extending the inverse to any integer $n$ gives

$$\widetilde{x}[n+N]=\frac1N\sum_k X[k]e^{j2\pi k(n+N)/N}=\widetilde{x}[n].$$

The inverse basis describes an $N$-periodic extension of the measured block. This does not contradict the earlier zero-extended finite DTFT: the DFT samples that finite DTFT, and those samples reconstruct a periodic extension when the inverse is evaluated outside the original block. They are different extensions used for different questions.

{% include interactive-figure.html id="fig-periodic-extension" experiment="periodic" title="A finite buffer and its DFT interpretation" description="Switch between the stored record and repeated copies implied by the inverse DFT basis." caption="Repeated points are a mathematical interpretation, not additional ADC measurements. An end-to-start discontinuity can exist even when the measured interior is smooth." %}

This is also why DFT-domain filtering wraps the convolution tail around the block unless we pad. The periodic basis uses index arithmetic modulo $N$.

## Frequency bins, duration, and resolving two tones

Physical frequency labels come from the sample clock:

$$f_k=\frac{k f_s}{N},\qquad\Delta f=\frac{f_s}{N}=\frac1{T_{\rm obs}},\qquad T_{\rm obs}=\frac N{f_s}.$$

The first-to-last sample spacing is $(N-1)/f_s$, while the $N$-sample window duration used in bin spacing is $N/f_s$. Distinguishing these avoids an off-by-one interpretation of the observation interval.

Bins above $N/2$ in the raw DFT correspond to negative frequencies $(k-N)f_s/N$. For real data we often show only $0\le f\le f_s/2$. The interior one-sided amplitude bins are doubled; DC and the even-$N$ Nyquist bin are not.

{% include interactive-figure.html id="fig-dft-bins" experiment="bins" title="When does a tone land on a frequency bin?" description="Change sampling rate, sample count, and source frequency; compare the displayed bin coordinate with the magnitude spectrum." caption="The default 50 Hz tone, 512 samples/s, and 128 samples give bin coordinate 12.5. Changing the tone to 48 Hz makes it bin-aligned at k = 12." %}

Increasing $N$ at fixed $f_s$ means measuring longer, so bin spacing decreases. Increasing $f_s$ at fixed $N$ expands the unaliased bandwidth but shortens observation duration, so spacing increases. These are different resources.

Bin spacing is not the entire resolving-power story. A window's main-lobe width controls how nearby tone responses overlap. Zero-padding provides denser frequency evaluations of the same finite-window DTFT; it does not extend the measurement or narrow that underlying lobe. It can locate a peak more smoothly without resolving two components that the original observation could not separate.

## Leakage: a finite window changes the spectrum

An infinite complex tone is $x[n]=e^{j\omega_0n}$. We observe only $N$ consecutive samples, which is multiplication by a rectangular window. Its DTFT is

$$\begin{aligned}
W_R(e^{j\omega})&=\sum_{n=0}^{N-1}e^{-j\omega n}\\
&=e^{-j\omega(N-1)/2}\frac{\sin(N\omega/2)}{\sin(\omega/2)}.
\end{aligned}$$

By frequency shift, the windowed tone has spectrum $W_R(e^{j(\omega-\omega_0)})$. A real sine contributes positive and negative copies. The DFT samples that lobe pattern at its bins.

If $\omega_0=2\pi k_0/N$, rectangular-window zeros coincide with the other DFT bins. An off-bin tone shifts those zeros away, so many bins receive nonzero projections. **Spectral leakage is the response of a finite observation**, not evidence that the source generated new analog tones. Its DFT-periodic extension generally also has an end-to-start mismatch. [R3](#r3)

Tapering the observation reduces abrupt edges. For the symmetric windows used here,

$$w_H[n]=\frac12-\frac12\cos\frac{2\pi n}{N-1},$$

$$w_{Hm}[n]=0.54-0.46\cos\frac{2\pi n}{N-1},\qquad 0\le n<N.$$

Hann reaches zero at both ends; Hamming has endpoints 0.08. Both change the window spectrum, generally reducing near sidelobes relative to a rectangle while broadening the main lobe. Their sidelobe patterns differ; “less leakage” is incomplete unless we specify which frequency offsets matter.

{% include interactive-figure.html id="fig-windowing" experiment="leakage" title="Choose which spectral error matters" description="Compare rectangular, Hann, and Hamming windows; move the tone between bins and change observation length." caption="The window-transform panel exposes main-lobe width and sidelobes directly. The tone plot corrects coherent gain, but cannot remove off-bin peak bias or separate unresolved tones." %}

The approximate large-$N$ null-to-null main-lobe widths are two bins for a rectangle and four for Hann/Hamming. Lower sidelobes help reveal a small component near a strong one at sufficiently separated frequencies; a wider main lobe makes close components harder to separate. Increasing the observation duration can improve both absolute lobe width and bin spacing, but changing the taper alone is a trade-off.

For amplitude displays, the window's coherent gain is $\sum_n w[n]/N$. An isolated bin-aligned cosine can be normalized using $2|X_w[k]|/\sum_n w[n]$ for an interior positive bin. This is different from the squared-window normalization used for PSD below.

## Deriving a radix-2 FFT

The direct DFT computes $N$ outputs, each summing $N$ complex terms: $O(N^2)$ work. But many factors repeat. Let

$$W_N=e^{-j2\pi/N},\qquad X[k]=\sum_{n=0}^{N-1}x[n]W_N^{nk}.$$

For even $N$, split the inputs into even and odd indices:

$$\begin{aligned}
X[k]&=\sum_{r=0}^{N/2-1}x[2r]W_N^{2rk}
+W_N^k\sum_{r=0}^{N/2-1}x[2r+1]W_N^{2rk}\\
&=E[k]+W_N^k O[k],
\end{aligned}$$

where $W_N^2=W_{N/2}$ and $E,O$ are $N/2$-point transforms. Their values repeat after $N/2$ bins, while $W_N^{k+N/2}=-W_N^k$. Thus for $0\le k<N/2$,

$$\boxed{\begin{aligned}
X[k]&=E[k]+W_N^kO[k],\\
X[k+N/2]&=E[k]-W_N^kO[k].
\end{aligned}}$$

One multiplication and a sum/difference reuse the two smaller-transform results. This pair is a butterfly. For $N=2^p$, recurse until the transforms have one value. Each level has $O(N)$ work and there are $p=\log_2N$ levels:

$$C(N)=2C(N/2)+O(N)=O(N\log N).$$

The important saving is reuse, not an approximation. The classic Cooley–Tukey paper develops this factorization approach; our educational implementation uses its radix-2 special case. [R4](#r4)

{% include interactive-figure.html id="fig-fft-butterfly" experiment="butterfly" title="Inspect every stage of an eight-point FFT" description="Step from the bit-reversed inputs through three butterfly stages; inspect complex values and the actual twiddle factors." caption="The input is cos(2πn/8). Reordered slots are 0,4,2,6,1,5,3,7; the final output returns to natural bin order, with magnitude 4 at k = 1 and k = 7." %}

The visualization uses an iterative version of the same decomposition. Bit reversal puts inputs in the order required for adjacent small transforms, then group sizes grow through 2, 4, and 8. In each group the update is:

```javascript
const u = values[a];
const v = multiply(twiddle, values[b]);
values[a] = add(u, v);
values[b] = subtract(u, v);
```

The temporary $u$ is retained so the first write does not corrupt the second. The [library source]({{ '/assets/js/signal-processing/transforms/fft.mjs' | relative_url }}) records stages for teaching; it prioritizes inspectability over minimum allocations. Other FFT algorithms handle other lengths, but a radix-2 FFT here explicitly rejects non-power-of-two input.

## DFT versus FFT: compare outputs, not names

The **DFT is the mathematical transform**. An **FFT is an algorithm for evaluating it** efficiently. Feeding the same samples and normalization to both should yield the same complex coefficients, up to floating-point roundoff. Neither algorithm repairs aliasing, avoids finite-window leakage, or changes resolution.

{% include interactive-figure.html id="fig-dft-fft-comparison" experiment="comparison" title="Compute one transform two ways" description="Change the record length and compare direct sums with radix-2 results for the same seeded data." caption="The table shows the first eight bins; the maximum complex difference is measured across all bins. Work counts are illustrative operation counts, not browser timing benchmarks." %}

Different summation orders produce small errors in finite precision. Comparing only magnitude could hide phase mistakes; the experiment checks $|X_{\rm DFT}[k]-X_{\rm FFT}[k]|$ as a complex difference. Numerical tests also verify inverse round trips, impulse/DC cases, and Parseval.

## A practical spectral-analysis experiment

Start with a known source so we can judge the analysis:

$$x(t)=\sin(2\pi\,50t)+0.4\sin(2\pi\,120t)+\eta(t).$$

For the browser experiment, noise is generated directly at sample instants as independent seeded uniform values with a stated RMS. It models discrete observation noise, not a fully specified continuous-time noise process or ADC circuit.

At the default $f_s=512$ samples/s and $N=512$, observation duration is one second and $\Delta f=1$ Hz. Both tones land on bins. The analysis proceeds in a reproducible sequence:

1. Generate samples using the specified clock and a fixed noise seed.
2. Retain exactly $N$ observations.
3. Apply the selected window.
4. Compute the DFT with the radix-2 FFT.
5. Convert to a one-sided, coherent-gain-corrected amplitude spectrum.
6. Interpret peaks alongside Nyquist, duration, window response, and noise level.

{% include interactive-figure.html id="fig-spectrum-analyzer" experiment="analyzer" title="Analyze a finite two-tone measurement" description="Change both tones and amplitudes, sampling rate, observation length, noise level, and window; identify which changes alter the source and which alter the measurement." caption="Defaults use 50 Hz + 0.4·120 Hz, 512 samples/s, 512 samples, Hann window, and seed 42. The one-sided spectrum doubles interior bins only." %}

First remove noise: the isolated bin-aligned peaks should approach amplitudes 1 and 0.4. Then move a tone half a bin: peak height and spread change despite unchanged source amplitude. Move two tones close together: their window responses can overlap. Finally lower $f_s$ until the upper tone aliases: no window choice recovers its true analog origin.

For the oscilloscope context, $f_s$ must be the effective rate of the **stored** samples, not merely an ADC's nominal conversion rate. Rate errors become frequency-axis errors. The finite observation duration is equally consequential: a short, high-rate buffer gives broad bandwidth but coarse spacing. These are acquisition decisions that an FFT library cannot make for us. [R7](#r7)

## Power spectral density: why squared magnitude needs a scale

Amplitude peaks are useful for deterministic tones. Noise is different: its power is distributed across frequency, and the number and width of bins change when $N$ changes. Raw $|X[k]|^2$ alone has neither observation-length nor bandwidth normalization.

For windowed data $X_w[k]$, define the two-sided modified periodogram

$$\widehat S_{xx}[k]=\frac{|X_w[k]|^2}{f_s\sum_{n=0}^{N-1}w[n]^2}.$$

For a real one-sided estimate, double the interior positive bins; keep DC and, for even $N$, Nyquist unchanged. If input is volts, units are $\mathrm{V^2/Hz}$. Our synthetic signals use arbitrary amplitude units, so the axis says amplitude²/Hz. This is a power density, not an amplitude density. [R6](#r6)

Why this denominator? Combine DFT Parseval with $\Delta f=f_s/N$. Integrating the two-sided periodogram over its bins gives

$$\begin{aligned}
\sum_k\widehat S_{xx}[k]\Delta f
&=\frac{\sum_k|X_w[k]|^2}{N\sum_n w[n]^2}\\
&=\frac{\sum_n |x[n]w[n]|^2}{\sum_n w[n]^2}.
\end{aligned}$$

For a rectangular window this is exactly the record's mean-square amplitude. For stationary noise, squared-window normalization compensates the expected energy loss from tapering. Coherent gain, used for tone amplitude, answers a different normalization question.

A single periodogram remains variable. Longer observation improves its frequency detail but does not by itself make each noise-bin estimate stable. Welch's method divides the record into segments, windows each one, computes a periodogram, and averages at common frequencies:

$$\widehat S_W[k]=\frac1M\sum_{r=0}^{M-1}\widehat S_r[k].$$

Overlap reuses observations; the estimates are then correlated, so $M$ is not the number of independent records. Shorter segments usually provide more averages but broader lobes and coarser spacing. Welch trades some frequency detail for a more stable power estimate. [R5](#r5)

{% include interactive-figure.html id="fig-welch" experiment="welch" title="A noisy periodogram versus averaged segments" description="Change segment length and noise level, then sweep the seed to compare different reproducible noise realizations." caption="Both estimates use Hann windows and the same 2048-sample record at 256 samples/s. Welch uses 50% overlap and only complete segments; no mean removal is applied." %}

The peaks have different widths because they use different effective observation lengths. Judge the noise-floor variability as well as the peak shape; comparing peak heights alone would confuse variance reduction with resolution. For later EEG work, preprocessing, physical units, artifacts, and stationarity assumptions will need explicit treatment. This experiment establishes the spectral estimator without claiming a biomedical interpretation.

## When frequency changes over time

Now let a record contain 20 Hz in its first half and 60 Hz in its second. A whole-record FFT identifies both frequencies, but its magnitude cannot tell when they occurred. Reversing the real record leaves its DFT magnitude unchanged, illustrating the information lost when phase and time localization are discarded.

We can analyze shorter neighborhoods instead. For a window centered near sample $m$, define the short-time Fourier transform conceptually as

$$X(m,\omega)=\sum_n x[n]w[n-m]e^{-j\omega n}.$$

The transform is still a frequency projection, now weighted to a neighborhood. Slide the neighborhood through the record. Sampling those local frequency representations on DFT bins produces a spectrogram.

The implementation stores windows from a start index $r$ and transforms local indices $q$: $\sum_q x[r+q]w[q]e^{-j\omega q}$. Relative to a global-index exponential, this differs by a phase factor $e^{j\omega r}$. The magnitudes agree. We label each frame by its center $(r+(L-1)/2)/f_s$.

{% include interactive-figure.html id="fig-stft" experiment="stft" title="Locate a frequency change with a spectrogram" description="Change STFT window length and overlap; compare transition blur with the width of the frequency bands." caption="The signal switches at two seconds. Colors show per-frame power density on a fixed −70 to 0 dB scale. Complete windows only are used, leaving unobserved edge neighborhoods blank." %}

A short window localizes the switch, but its broad spectral lobes blur nearby frequencies. A long window gives finer frequency structure, but a window straddling the switch contains both regimes. Increasing overlap samples the same windowed view more densely in time; it does not evade this uncertainty or change intrinsic lobe width.

The STFT does not assume that the whole record is stationary. It asks whether a chosen neighborhood is useful for a local spectral description. If the phenomenon's duration varies greatly across frequencies, wavelets and other multiresolution methods may be a future extension. We stop here: before introducing another representation, we should test what this one tells us about real neural measurements.

The next research article will use these reusable sampling, windowing, FFT, Welch, and STFT tools for EEG analysis. The central question will remain the same: **which conclusions belong to the signal, and which belong to the way we measured and analyzed it?**

{% include references.html %}
