---
title: "From Continuous to Discrete: Sampling, Aliasing, Reconstruction and the DTFT"
subtitle: What information survives when a signal becomes samples?
slug: continuous-to-discrete
permalink: /articles/continuous-to-discrete/
description: "Deriving what sampling does in time and frequency, why aliasing occurs, when sinc reconstruction works, and why discrete-time spectra repeat."
series: Signal Processing from First Principles
article_number: 2
date: 2026-10-11
updated: 2026-10-16
reading_time: 27
tags: [sampling, aliasing, reconstruction, DTFT, interactive research]
interactive: true
previous_page: /articles/harmonics-to-spectra/
previous_title: From Harmonics to Spectra
next_page: /articles/samples-to-spectra/
next_title: From Samples to Spectra
references: [R3, R7]
---

## What does sampling actually do?

An ADC does not store a continuous voltage curve. It stores a sequence of observations. If the clock is uniform, the $n$th observation is

$$x[n]=x(nT_s),\qquad T_s=\frac1{f_s}.$$

Here $T_s$ is seconds/sample and $f_s$ is samples/second. A computer can draw lines between samples, but those lines are an assumption about what happened between measurements. The samples alone do not contain every continuous-time detail.

Three frequency labels will appear in this article, and keeping them separate prevents several common errors:

| Symbol | Meaning | Unit |
| --- | --- | --- |
| $f$ | continuous physical frequency | Hz |
| $\Omega=2\pi f$ | continuous angular frequency | rad/s |
| $\omega=\Omega T_s$ | normalized discrete-time frequency | rad/sample |

The same sampled oscillation can therefore be labelled by $f$, $\Omega$, or $\omega$, but only after the sample rate supplies the conversion.

[Article 1]({{ '/articles/harmonics-to-spectra/#what-if-the-signal-never-repeats' | relative_url }}) derived the convention

$$X(\Omega)=\int_{-\infty}^{\infty}x(t)e^{-j\Omega t}\,dt,
\qquad x(t)=\frac1{2\pi}\int X(\Omega)e^{j\Omega t}\,d\Omega.$$

In this first section, Article 1's angular-frequency variable will be written as $\Omega$ to distinguish it from the normalized $\omega$ used later. Let $\Omega_s=2\pi f_s$.

### A sample marker is not a Dirac impulse

The discrete impulse $\delta[n]$ is an ordinary sequence: it equals one at $n=0$ and zero at every other integer. The Dirac delta $\delta(t)$ is different. It is a distribution defined by what it does inside an integral:

$$
\int_{-\infty}^{\infty}q(t)\delta(t-a)\,dt=q(a).
$$

It has unit area and zero support away from $a$; assigning it a finite height is not meaningful. It is useful here because it keeps an exact sample value at an exact continuous-time location. Represent ideal sampling by the periodic impulse train

$$p(t)=\sum_{n=-\infty}^{\infty}\delta(t-nT_s),
\qquad x_s(t)=x(t)p(t)=\sum_n x(nT_s)\delta(t-nT_s).$$

The last equality follows from the sifting property: multiplication by $x(t)$ changes the impulse at $nT_s$ into an impulse with area $x(nT_s)$. Thus $x_s(t)$ is a continuous-time distribution, while $x[n]=x(nT_s)$ is the sequence of impulse weights stored by the computer. They contain the same sample values but are not the same mathematical object.

### Proof: the spectrum of the sampling clock

What spectrum does this operation create? The periodic impulse train has Fourier-series coefficients

$$
\begin{aligned}
P_m
&=\frac1{T_s}\int_{-T_s/2}^{T_s/2}p(t)e^{-jm\Omega_st}\,dt\\
&=\frac1{T_s}\int_{-T_s/2}^{T_s/2}\delta(t)e^{-jm\Omega_st}\,dt\\
&=\frac1{T_s}.
\end{aligned}
$$

The centered interval contains exactly one impulse, avoiding ambiguous endpoints. Every Fourier-series coefficient has the same value, so in the distributional sense

$$p(t)=\frac1{T_s}\sum_{m=-\infty}^{\infty}e^{jm\Omega_st}.$$

Substitute this series into $x_s=xp$:

$$x_s(t)=\frac1{T_s}\sum_m x(t)e^{jm\Omega_st}.$$

Why does each term shift the spectrum? Apply the transform definition directly:

$$
\begin{aligned}
\mathcal F\{x(t)e^{j\Omega_0t}\}(\Omega)
&=\int x(t)e^{j\Omega_0t}e^{-j\Omega t}\,dt\\
&=\int x(t)e^{-j(\Omega-\Omega_0)t}\,dt\\
&=X(\Omega-\Omega_0).
\end{aligned}
$$

Taking the transform term by term now gives

$$\boxed{X_s(\Omega)=\frac1{T_s}\sum_{m=-\infty}^{\infty}X(\Omega-m\Omega_s).}$$

Thus sampling creates shifted copies at every integer multiple of $f_s$ in Hz. We have derived replication before stating a sample-rate rule. The origin is the periodic timing pattern, not a plotting artifact. [R3](#r3)

Equivalently, $P(\Omega)=(2\pi/T_s)\sum_m\delta(\Omega-m\Omega_s)$, and multiplication in time produces $(X*P)/(2\pi)$ in frequency. Convolution with an impulse shifts a function, so this second route produces the same replicas. We will derive the multiplication–convolution relationship later; the direct shift proof already establishes the result without assuming it.

{% include interactive-figure.html id="fig-sampling-spectrum" experiment="sampling" title="Sampling creates spectral copies" description="Change the band limit and sampling rate; compare the original spectrum with replicas whose centers are separated by f_s." caption="The time signal is sinc(2Bt), whose spectrum is flat on −B &lt; f &lt; B. Sample markers show impulse weights. The replicated spectrum is divided by f_s to make shape comparisons readable." %}

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

For real cosines, the magnitude $\lvert f_a\rvert$ is often used as the displayed alias frequency. For sines, a negative $f_a$ also changes sign/phase; retaining the signed representative preserves the exact samples.

{% include interactive-figure.html id="fig-aliasing" experiment="aliasing" title="Two waveforms, one sample sequence" description="Raise the true frequency or lower the sampling rate until the apparent low-frequency curve differs from the source." caption="Try 25 Hz sampled at 30 samples/s: sin(2π·25n/30) = −sin(2π·5n/30). The signed alias is −5 Hz, and both continuous curves meet at every sample." %}

The problem is fundamental: a post-acquisition calculation cannot infer which member of that equivalence class produced the sequence without additional assumptions. Avoiding aliasing requires restricting the **analog** bandwidth before sampling. Increasing the FFT length afterward cannot undo overlap that already happened.

## Reconstruction: what continuous signal do the samples specify?

When replicas do not overlap, a low-pass reconstruction filter can retain the central copy and reject its neighbors. Two filter choices must not be confused: its cutoff selects the desired copy, while its gain restores the amplitude changed by impulse sampling.

The central copy is $X_s(\Omega)=X(\Omega)/T_s$. Therefore, within the original signal band, the reconstruction filter needs gain $T_s$:

$$
H_r(\Omega)=
\begin{cases}
T_s,&\lvert\Omega\rvert<\pi/T_s,\\
0,&\lvert\Omega\rvert>\pi/T_s.
\end{cases}
$$

Indeed, $H_r(\Omega)X_s(\Omega)=T_sX(\Omega)/T_s=X(\Omega)$. The Nyquist cutoff is a convenient ideal choice when the signal occupies less than the entire central interval. More generally, the passband must include the original spectrum and exclude the adjacent replicas.

### Derivation: a rectangular passband becomes a sinc

Using the inverse transform,

$$\begin{aligned}
h_r(t)&=\frac{T_s}{2\pi}\int_{-\pi/T_s}^{\pi/T_s}e^{j\Omega t}\,d\Omega\\
&=\frac{\sin(\pi t/T_s)}{\pi t/T_s}
=\operatorname{sinc}(t/T_s).
\end{aligned}$$

Here the normalized sinc is

$$
\operatorname{sinc}(u)=
\begin{cases}
\dfrac{\sin(\pi u)}{\pi u},&u\ne0,\\[4pt]
1,&u=0.
\end{cases}
$$

The sinc is not an arbitrary smooth curve placed through the samples. It is the impulse response of the rectangular reconstruction filter.

### Derivation: filtering the impulses

Filtering means convolution with $h_r$:

$$
\begin{aligned}
x_r(t)
&=(x_s*h_r)(t)\\
&=\left[\sum_n x[n]\delta(t-nT_s)\right]*h_r(t)\\
&=\sum_n x[n]\bigl[\delta(t-nT_s)*h_r(t)\bigr]\\
&=\sum_n x[n]h_r(t-nT_s).
\end{aligned}
$$

The final step uses $\delta(t-a)*h(t)=h(t-a)$: every weighted sampling impulse generates one shifted copy of the filter's impulse response. Substitution produces

$$\boxed{x(t)=\sum_{n=-\infty}^{\infty}x[n]\operatorname{sinc}\!\left(\frac{t-nT_s}{T_s}\right).}$$

Why does the sum pass through every sample? Evaluate it at $t=mT_s$:

$$
x_r(mT_s)=\sum_n x[n]\operatorname{sinc}(m-n).
$$

When $n=m$, the sinc argument is zero and the factor is one. For every other integer $n$, $m-n$ is a nonzero integer and the sinc is zero. Only one term survives:

$$\boxed{x_r(mT_s)=x[m].}$$

Exact interpolation is built into the kernel. It does not by itself prove recovery of the original waveform: infinitely many continuous functions can cross the same points. Recovering the **true** waveform additionally needs the bandlimit, sufficient rate, exact sample times, and the ideal infinite sequence. [R3](#r3)

{% include interactive-figure.html id="fig-sinc-reconstruction" experiment="sinc" title="Each sample launches a reconstruction kernel" description="Select a sample, then adjust rate, source frequency, and retained sample count; compare individual shifted sinc responses with their sum." caption="The upper plot makes convolution visible: weighted impulses produce shifted filter responses. The lower plot sums every retained response. Edge error comes from missing sinc tails; below Nyquist the interior reconstruction follows an alias." %}

Increase the sample count while keeping an adequately sampled frequency. The interior improves because more sinc tails participate. Now undersample. The sum still interpolates the retained points, but it cannot distinguish the original source from its baseband alias. Interpolation is not evidence that acquisition was unambiguous.

## Why discrete-time spectra are periodic

We now leave the impulse-weighted continuous-time signal and work with the sequence $x[n]$. Define its discrete-time Fourier transform:

$$X(e^{j\omega})=\sum_{n=-\infty}^{\infty}x[n]e^{-j\omega n}.$$

**From this point, DTFT $\omega$ is normalized angular frequency in rad/sample.** It is related to physical Hz by $\omega=2\pi f/f_s$, not $2\pi f$. The notation $X(e^{j\omega})$ emphasizes the unit-circle frequency parameter; it does not introduce a different input signal for each $\omega$.

For every integer $n$,

$$e^{-j(\omega+2\pi)n}=e^{-j\omega n}e^{-j2\pi n}=e^{-j\omega n}.$$

Consequently,

$$\boxed{X(e^{j(\omega+2\pi)})=X(e^{j\omega}).}$$

The periodicity is in the basis itself. It holds for every absolutely summable sequence and for finite sequences, with suitable generalized interpretations beyond that class. But periodicity alone does not give us an inverse. We need to show that integration over one frequency period can isolate a particular time sample.

### Derivation: why the inverse DTFT recovers one sample

Begin with an orthogonality integral indexed by an integer $q$:

$$
I_q=\frac1{2\pi}\int_{-\pi}^{\pi}e^{j\omega q}\,d\omega.
$$

If $q=0$, the integrand is one and $I_0=1$. If $q\ne0$,

$$
\begin{aligned}
I_q
&=\frac1{2\pi}\left[\frac{e^{j\omega q}}{jq}\right]_{-\pi}^{\pi}\\
&=\frac{e^{j\pi q}-e^{-j\pi q}}{j2\pi q}\\
&=\frac{\sin(\pi q)}{\pi q}=0,
\end{aligned}
$$

because $q$ is a nonzero integer. Hence

$$
\boxed{\frac1{2\pi}\int_{-\pi}^{\pi}e^{j\omega(n-m)}\,d\omega=\delta[n-m],}
$$

where $\delta[n-m]$ is the discrete unit impulse. Every sequence has the exact impulse expansion

$$x[n]=\sum_{m=-\infty}^{\infty}x[m]\delta[n-m].$$

Insert the exponential representation of the impulse:

$$
\begin{aligned}
x[n]
&=\sum_m x[m]\frac1{2\pi}\int_{-\pi}^{\pi}e^{j\omega(n-m)}\,d\omega\\
&=\frac1{2\pi}\int_{-\pi}^{\pi}e^{j\omega n}
\left[\sum_m x[m]e^{-j\omega m}\right]d\omega.
\end{aligned}
$$

The bracketed sum is precisely the forward DTFT. Therefore

$$\boxed{x[n]=\frac1{2\pi}\int_{-\pi}^{\pi}X(e^{j\omega})e^{j\omega n}\,d\omega.}$$

The logical direction matters: the forward expression defines the spectral representation; frequency-domain orthogonality proves that the inverse retrieves the sequence. Interchanging the sum and integral is immediate for finite records and justified directly for absolutely summable sequences. Broader signal classes require the same generalized interpretations already used for ideal sinusoids.

This orthogonality is easy to confuse with the DFT result derived later. In the inverse DTFT, $e^{j\omega n}$ and $e^{j\omega m}$ are functions of the **continuous frequency variable** $\omega$; integrating over a $2\pi$ interval isolates the integer time index. In the DFT, we instead sum over **finite time samples** to isolate one of a finite set of frequency bins. They are dual cancellation arguments, but the variable being accumulated is different.

For example, an infinite discrete cosine separates into counter-rotating exponentials,

$$
\cos(\omega_0n)=\frac12e^{j\omega_0n}+\frac12e^{-j\omega_0n}.
$$

Its generalized DTFT therefore contains periodic impulse trains at $+\omega_0$ and $-\omega_0$. The two locations are the discrete-time version of the conjugate frequency pair from Article 1. Magnitude reports their strength; phase records how the cosine is positioned relative to the time origin.

{% include interactive-figure.html id="fig-dtft-periodicity" experiment="dtft" title="Continuous frequency does not imply a nonperiodic spectrum" description="Expand the displayed frequency span; compare a continuous pulse CTFT with the DTFT of a finite discrete sequence." caption="The DTFT is continuous in its frequency argument but repeats every 2π rad/sample. The CTFT curve uses rad/s and generally does not repeat." %}

Keep three objects separate:

- A continuous-time transform $X(\Omega)$, with $\Omega$ in rad/s, is generally not periodic.
- The impulse-sampled continuous signal has replicas separated by $\Omega_s=2\pi f_s$ rad/s.
- The sequence DTFT repeats every $2\pi$ rad/sample.

The last two describe related representations. Directly transforming the impulses gives

$$X_s(\Omega)=\sum_n x[n]e^{-j\Omega nT_s}=X(e^{j\Omega T_s}).$$

Writing $\Omega$ for physical angular frequency here prevents the unit conversion from disappearing into notation. Thus the impulse-sampled transform and the sequence DTFT have equal numerical values after the axis substitution $\omega=\Omega T_s$ under our angular-frequency convention. Their replication formulas may display a factor $1/T_s$ because that factor relates the samples back to the original continuous spectrum $X(\Omega)$. It is not an extra scale factor between $X_s(\Omega)$ and $X(e^{j\omega})$. The period $2\pi$ in $\omega$ corresponds to $2\pi/T_s$ rad/s, or $f_s$ Hz, on the physical axis.

{% include callout.html type="note" title="Going further: the unit circle" content="The Z-transform uses z = r e^{jω}; the DTFT is its unit-circle evaluation r = 1 when that evaluation converges. Moving off the circle adds radial weighting and a region-of-convergence question. See the [Z-transform overview](https://en.wikipedia.org/wiki/Z-transform). We do not need that additional machinery for finite spectral records." %}

## The Nyquist interval in normalized frequency

The conversion between a physical frequency and its discrete-time label is

$$
\omega=2\pi\frac{f}{f_s}.
$$

Therefore the principal normalized interval

$$-\pi\leq\omega<\pi$$

corresponds exactly to the signed physical-frequency interval

$$-\frac{f_s}{2}\leq f<\frac{f_s}{2}.$$

Frequencies outside it are not forbidden; they are equivalent to a representative inside it after adding or subtracting integer multiples of $2\pi$. That is the normalized-frequency form of aliasing.

The chain developed in this article is now complete:

<div class="pipeline pipeline--article" role="img" aria-label="A continuous signal is sampled, creating spectral replicas and possible aliasing; under the sampling assumptions it can be reconstructed, while the resulting sequence has a periodic DTFT.">
  <strong>continuous x(t)</strong><b>→</b>
  <strong>sampling</strong><b>→</b>
  <strong>spectral replicas</strong><b>→</b>
  <strong>aliasing or reconstruction</strong><b>→</b>
  <strong>sequence x[n]</strong><b>→</b>
  <strong>periodic DTFT</strong>
</div>

The DTFT still has a continuous frequency argument and may describe an infinite sequence. A computer instead receives a finite array. [Article 3]({{ '/articles/samples-to-spectra/' | relative_url }}) begins with that mismatch: how do $N$ stored samples become $N$ frequency coefficients, and how can an FFT calculate those coefficients without changing their meaning?

{% include references.html %}
