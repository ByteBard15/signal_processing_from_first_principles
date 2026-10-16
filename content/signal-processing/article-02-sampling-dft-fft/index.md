---
title: "From Samples to Spectra: Sampling, DTFT, DFT and the FFT"
subtitle: What a finite digital record can tell us
slug: samples-to-spectra
permalink: /articles/samples-to-spectra/
description: "Deriving spectral replicas, understanding finite observations, and tracing the mathematics from a sampled signal to an FFT, a power estimate, and a spectrogram."
series: Signal Processing from First Principles
article_number: 2
date: 2026-10-11
updated: 2026-10-16
reading_time: 60
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

Four frequency labels will appear in this article, and keeping them separate prevents several common errors:

| Symbol | Meaning | Unit |
| --- | --- | --- |
| $f$ | continuous physical frequency | Hz |
| $\Omega=2\pi f$ | continuous angular frequency | rad/s |
| $\omega=\Omega T_s$ | normalized discrete-time frequency | rad/sample |
| $k$ | DFT frequency-bin index | dimensionless integer |

The same sampled oscillation can therefore be labelled by $f$, $\Omega$, $\omega$, or $k$, but only after the sample rate and record length supply the conversion.

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

For a concrete two-point example, let $x=[1,2]$ and $h=[3,4]$. Linear convolution is $[3,10,8]$. A two-point inverse DFT has only two output positions, so the last value wraps to index zero and produces $[3+8,10]=[11,10]$. Padding both inputs to length three prevents overlap and recovers $[3,10,8]$. The transform has not changed the convolution theorem; the unpadded DFT describes periodic sequences.

## Finite observations lead to the DFT

The DTFT has a continuous argument and can describe an infinite sequence. A buffer contains only

$$x[0],x[1],\ldots,x[N-1].$$

First, treat the finite record as zero outside its observed indices. Its DTFT becomes the finite but still continuous-frequency expression

$$X(e^{j\omega})=\sum_{n=0}^{N-1}x[n]e^{-j\omega n}.$$

We now want $N$ frequency coordinates for an $N$-dimensional sample vector. Since the DTFT repeats every $2\pi$, dividing one period into $N$ equal arcs gives spacing $\Delta\omega=2\pi/N$ and points

$$\omega_k=\frac{2\pi k}{N},\qquad k=0,1,\ldots,N-1.$$

The point $k=N$ would be $2\pi$, which is the same discrete-time frequency as $k=0$, so it would duplicate the first coordinate. Evaluating the finite-record DTFT at the $N$ distinct points produces

$$\boxed{X[k]=\sum_{n=0}^{N-1}x[n]e^{-j2\pi kn/N}.}$$

Equal spacing is not merely convenient. It makes the analysis vectors mutually orthogonal. Let

$$\phi_k[n]=e^{j2\pi kn/N}.$$

Their finite-dimensional inner product is

$$
\begin{aligned}
\langle\phi_k,\phi_\ell\rangle
&=\sum_{n=0}^{N-1}\phi_k[n]\phi_\ell^*[n]\\
&=\sum_{n=0}^{N-1}e^{j2\pi(k-\ell)n/N}.
\end{aligned}
$$

When $k=\ell$ modulo $N$, every term is one and the result is $N$. Otherwise let $r=e^{j2\pi(k-\ell)/N}$. Then $r\ne1$ but $r^N=1$, so the geometric series gives

$$
\sum_{n=0}^{N-1}r^n=\frac{1-r^N}{1-r}=0.
$$

Thus

$$
\boxed{
\langle\phi_k,\phi_\ell\rangle=
\begin{cases}
N,&k\equiv\ell\pmod N,\\
0,&k\not\equiv\ell\pmod N.
\end{cases}}
$$

There are $N$ nonzero orthogonal vectors in the $N$-dimensional space of sample blocks, so they are linearly independent and form a complete basis. This proves why these particular DTFT evaluations are sufficient to represent every $N$-sample record. Orthogonality also produces the inverse. Substitute the forward DFT into

$$x[n]=\frac1N\sum_{k=0}^{N-1}X[k]e^{j2\pi kn/N},\qquad 0\le n<N.$$

Writing the forward sum with a different sample index $m$ gives

$$
\begin{aligned}
\frac1N\sum_{k=0}^{N-1}X[k]e^{j2\pi kn/N}
&=\sum_{m=0}^{N-1}x[m]
\left[\frac1N\sum_{k=0}^{N-1}e^{j2\pi k(n-m)/N}\right]\\
&=\sum_m x[m]\delta[n-m]=x[n].
\end{aligned}
$$

This calculation proves the displayed reconstruction formula rather than assuming it: orthogonality reduces the proposed synthesis sum to the original sample. It also explains the conjugates in the inner product. In general,

$$\langle u^*,v^*\rangle=\langle u,v\rangle^*,$$

so conjugating both vectors preserves orthogonality. Conjugating only one vector changes which frequency index it represents and does not carry the same general guarantee.

The inner sum now runs over discrete frequency bins and isolates a time sample. Compare this with the inverse DTFT proof: there the corresponding cancellation was an integral over continuous frequency. By contrast, the earlier DFT basis proof summed over time and isolated a frequency basis vector.

Again, coefficients are projections divided by basis length on reconstruction. The forward DFT as defined here stores unnormalized projections; $X[k]/N$ is the corresponding coefficient in the inverse series. DFT Parseval consequently reads

$$\sum_{n=0}^{N-1}\lvert x[n]\rvert^2=\frac1N\sum_{k=0}^{N-1}\lvert X[k]\rvert^2.$$

For a real cosine exactly at a non-DC, non-Nyquist bin, its amplitude $A$ appears as $\lvert X[k]\rvert=AN/2$ in each conjugate bin. The two-sided representation and the $N$ scaling both matter when making a physical amplitude plot.

### A four-point DFT by hand

Take $x=[1,2,3,4]$. With $W_4=e^{-j2\pi/4}=-j$,

$$X[k]=\sum_{n=0}^{3}x[n]W_4^{kn}.$$

Evaluating the four projections gives

$$
\begin{aligned}
X[0]&=1+2+3+4=10,\\
X[1]&=1-2j-3+4j=-2+2j,\\
X[2]&=1-2+3-4=-2,\\
X[3]&=1+2j-3-4j=-2-2j.
\end{aligned}
$$

$X[0]/4=2.5$ is the sample mean. The pair $X[1]$ and $X[3]=X^*[1]$ shows conjugate symmetry for real input, while their phases carry information that a magnitude-only plot discards. This small calculation is the same operation the direct implementation performs for every finite record.

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

The DFT first gives normalized bin angles $\omega_k=2\pi k/N$ rad/sample. A sample clock converts phase per sample into phase per second. Since $\omega=2\pi f/f_s$,

$$
\boxed{f_k=\frac{\omega_k}{2\pi}f_s=\frac{k f_s}{N}},
\qquad
\Delta f=\frac{f_s}{N}=\frac1{T_{\rm obs}},
\qquad
T_{\rm obs}=\frac N{f_s}.
$$

The first-to-last sample spacing is $(N-1)/f_s$, while the $N$-sample window duration used in bin spacing is $N/f_s$. Distinguishing these avoids an off-by-one interpretation of the observation interval.

Why do bins above half the array represent negative frequencies? Discrete frequencies separated by $2\pi$ are identical, so for $k>N/2$ we may subtract one full period:

$$
\frac{2\pi k}{N}-2\pi=\frac{2\pi(k-N)}{N}.
$$

The corresponding physical label is $(k-N)f_s/N$. For example, with $N=8$ and $f_s=800$ samples/s, bins $0$ through $4$ represent $0,100,200,300,400$ Hz, while bins $5,6,7$ represent $-300,-200,-100$ Hz. The array order wraps around the frequency circle; it does not continue to new independent positive frequencies.

For real data, $X[N-k]=X^*[k]$, so the negative-frequency half repeats the positive-frequency magnitude information. A real bin-aligned cosine of amplitude $A$ places $AN/2$ in each of its conjugate bins. A one-sided amplitude plot therefore uses

$$
A_1[k]=
\begin{cases}
\lvert X[k]\rvert/N,&k=0,\\
2\lvert X[k]\rvert/N,&0<k<N/2,\\
\lvert X[k]\rvert/N,&k=N/2\text{ for even }N.
\end{cases}
$$

DC and Nyquist are not doubled because each is its own negative-frequency counterpart. Windowed amplitude spectra replace $N$ with the appropriate coherent-gain normalization described below.

{% include interactive-figure.html id="fig-dft-bins" experiment="bins" title="When does a tone land on a frequency bin?" description="Change sampling rate, sample count, and source frequency; compare the displayed bin coordinate with the magnitude spectrum." caption="The default 50 Hz tone, 512 samples/s, and 128 samples give bin coordinate 12.5. Changing the tone to 48 Hz makes it bin-aligned at k = 12." %}

Increasing $N$ at fixed $f_s$ means measuring longer, so bin spacing decreases. Increasing $f_s$ at fixed $N$ expands the unaliased bandwidth but shortens observation duration, so spacing increases. These are different resources.

For example, $N=1000$ samples at $f_s=1000$ samples/s give a one-second window and $\Delta f=1$ Hz. Keeping $N=1000$ but raising $f_s$ to 2000 samples/s raises Nyquist from 500 to 1000 Hz, while shortening the record to 0.5 s and widening the bins to 2 Hz. Raising both $N$ and $f_s$ to 2000 keeps the one-second duration and 1 Hz spacing while expanding bandwidth. Faster sampling and longer observation answer different engineering questions.

Bin spacing is not the entire resolving-power story. A finite observation replaces each ideal sinusoidal line with a shifted copy of the window spectrum. For the rectangular window derived below, the numerator $\sin(N\omega/2)$ first vanishes at $\omega=\pm2\pi/N$. Converting those nulls to hertz gives a null-to-null main-lobe width

$$\boxed{B_{\rm main}=\frac{2f_s}{N}=\frac2{T_{\rm obs}}.}$$

A 0.1 s record therefore has 10 Hz bin spacing and a roughly 20 Hz rectangular main lobe; a two-second record has 0.5 Hz bins and a roughly 1 Hz lobe. Two nearby tones become easier to distinguish because longer observation narrows their individual responses, allowing less overlap. Their actual distinguishability also depends on window, relative amplitudes, phase, noise, and the decision rule. The equation $\Delta f=f_s/N$ describes the evaluation grid, not a universal resolution guarantee.

Zero-padding makes that distinction visible. Appending zeros changes the DFT length but not the measured duration or the finite-record DTFT

$$X(e^{j\omega})=\sum_{n=0}^{N-1}x[n]e^{-j\omega n}.$$

A longer padded DFT samples this same continuous curve more densely. It can smooth a plot and improve interpolation of a peak location, but it cannot narrow the window response or separate components that the measured record did not resolve.

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

For amplitude displays, the window's coherent gain is $G_c=\sum_n w[n]/N$. An isolated bin-aligned cosine can be normalized using $2\lvert X_w[k]\rvert/\sum_n w[n]$ for an interior positive bin. This is different from the squared-window normalization used for PSD below. For the symmetric definitions above, $G_c$ approaches $0.5$ for Hann and $0.54$ for Hamming as $N$ grows; DC and the Nyquist bin require no factor of two.

## Deriving a radix-2 FFT

The direct DFT computes $N$ outputs, each summing $N$ complex terms: $O(N^2)$ work. But many factors repeat. Let

$$W_N=e^{-j2\pi/N},\qquad X[k]=\sum_{n=0}^{N-1}x[n]W_N^{nk}.$$

For even $N$, split the inputs into even and odd indices:

$$\begin{aligned}
X[k]
&=\sum_{r=0}^{N/2-1}x[2r]W_N^{(2r)k}
+\sum_{r=0}^{N/2-1}x[2r+1]W_N^{(2r+1)k}\\
&=\sum_{r=0}^{N/2-1}x[2r]W_N^{2rk}
+W_N^k\sum_{r=0}^{N/2-1}x[2r+1]W_N^{2rk}\\
&=E[k]+W_N^k O[k],
\end{aligned}$$

The identity

$$W_N^{2rk}=e^{-j2\pi(2rk)/N}=e^{-j2\pi rk/(N/2)}=W_{N/2}^{rk}$$

shows that $E$ and $O$ are exactly the $N/2$-point DFTs of the even- and odd-indexed samples. We have not thrown away the odd samples; we have factored their additional single-sample offset into the rotation $W_N^k$.

Why do those two half-length transforms supply all $N$ output bins? Their values repeat after $N/2$ bins:

$$
\begin{aligned}
E[k+N/2]
&=\sum_{r=0}^{N/2-1}x[2r]W_{N/2}^{r(k+N/2)}\\
&=\sum_r x[2r]W_{N/2}^{rk}e^{-j2\pi r}\\
&=E[k],
\end{aligned}
$$

and the same calculation gives $O[k+N/2]=O[k]$. The full-transform twiddle makes only a half-turn:

$$W_N^{k+N/2}=W_N^k e^{-j\pi}=-W_N^k.$$

Thus for $0\le k<N/2$,

$$\boxed{\begin{aligned}
X[k]&=E[k]+W_N^kO[k],\\
X[k+N/2]&=E[k]-W_N^kO[k].
\end{aligned}}$$

Define the shared rotated value $T=W_N^kO[k]$. A butterfly computes $E[k]+T$ and $E[k]-T$: one rotation feeds two outputs. The twiddle is a complex-plane rotation by $-2\pi k/N$, rather than an arbitrary implementation constant.

### A complete four-point FFT

Return to $x=[1,2,3,4]$, whose direct DFT we calculated earlier. Split it into even samples $[1,3]$ and odd samples $[2,4]$. A two-point DFT maps $[a,b]$ to $[a+b,a-b]$, so

$$E=[4,-2],\qquad O=[6,-2].$$

For $k=0$, $W_4^0=1$:

$$X[0]=4+6=10,\qquad X[2]=4-6=-2.$$

For $k=1$, $W_4^1=-j$:

$$
X[1]=-2+(-j)(-2)=-2+2j,
\qquad
X[3]=-2-(-j)(-2)=-2-2j.
$$

These are exactly the four coefficients obtained from the direct sums. Conjugate symmetry appears because the input is real; the even/odd factorization itself also works for complex data and does not depend on that symmetry.

For $N=2^p$, apply the same split recursively until each transform contains one value. There are $p=\log_2N$ stages and $N/2$ butterflies at each stage, for

$$\frac N2\log_2N$$

butterflies in total. Equivalently, the recurrence

$$C(N)=2C(N/2)+O(N)$$

gives $C(N)=O(N\log N)$ rather than the direct transform's $O(N^2)$. At $N=1024$, the rough structural comparison is $1{,}048{,}576$ direct DFT terms versus $5{,}120$ butterflies. Those are different operation types, so this is a growth comparison rather than an exact runtime ratio.

The saving comes from exact algebraic reuse. No frequency bins are removed, and the window, leakage, resolution, and normalization remain unchanged. The classic Cooley–Tukey paper develops this factorization approach; our educational implementation uses its radix-2 special case. [R4](#r4)

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

Different summation orders produce small errors in finite precision. Comparing only magnitude could hide phase mistakes; the experiment checks $\lvert X_{\rm DFT}[k]-X_{\rm FFT}[k]\rvert$ as a complex difference. Numerical tests also verify inverse round trips, impulse/DC cases, and Parseval.

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

Amplitude peaks are useful for deterministic tones. Noise is different: its power is distributed across frequency, and the number and width of bins change when $N$ changes. Raw $\lvert X[k]\rvert^2$ alone has neither observation-length nor bandwidth normalization.

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

## One signal through the entire chain

The individual derivations now fit together, but their boundaries can hide the continuity of the argument. Take one continuous-time signal with three independently adjustable tones:

$$
x_c(t)=A_1\cos(2\pi f_1t+0.15)
+A_2\cos(2\pi f_2t-0.7)
+A_3\cos(2\pi f_3t+1.1).
$$

The complete experiment follows the same values through every representation:

<div class="pipeline pipeline--article" role="img" aria-label="Continuous-time signal is sampled into a discrete sequence, represented by its periodic DTFT, evaluated at DFT bins, computed by either a direct DFT or FFT, inverted to recover the samples, and sinc-interpolated to recover a band-limited continuous signal.">
  <strong>CTS x<sub>c</sub>(t)</strong><b>→</b>
  <strong>samples x[n]</strong><b>→</b>
  <strong>periodic DTFT</strong><b>→</b>
  <strong>DFT bins X[k]</strong><b>→</b>
  <strong>direct DFT = FFT</strong><b>→</b>
  <strong>inverse transforms</strong><b>→</b>
  <strong>sinc reconstruction</strong>
</div>

Sampling at $t=nT_s$ changes each physical frequency into a normalized phase increment:

$$
x[n]=x_c(nT_s),
\qquad
\omega_i=2\pi\frac{f_i}{f_s}\quad\text{rad/sample}.
$$

The sequence cannot distinguish $omega_i$ from $omega_i+2\pi m$, which is why its DTFT repeats and why physical frequencies separated by $mf_s$ produce the same samples. The second panel overlays two deliberately different objects: the original CTS spectrum has ideal lines at $\pm f_1,\pm f_2,\pm f_3$, while the finite record has a continuous-frequency DTFT whose lobes repeat every $f_s$ when its normalized axis is labelled in hertz.

The DFT does not replace that DTFT with another spectrum. It evaluates the same finite-record function at

$$
\omega_k=\frac{2\pi k}{N},
\qquad
f_k=\begin{cases}
kf_s/N,&k\le N/2,\\
(k-N)f_s/N,&k>N/2.
\end{cases}
$$

The signed labels reveal that the upper array indices are negative frequencies wrapped around the $2\pi$ frequency circle. Move a tone between bins: the continuous DTFT peak moves smoothly, while the DFT continues to sample only its fixed grid. Increase $N$ at fixed $f_s$: the record becomes longer, the DTFT lobes narrow, and the DFT samples them more densely.

The fourth panel computes those coefficients twice. The direct DFT evaluates every projection from its definition; the radix-2 FFT reuses even/odd subtransforms. Their markers coincide because they calculate the same $X[k]$. The next panel applies three inverse calculations: an IDFT to the direct coefficients, an inverse FFT to the FFT coefficients, and a numerical inverse-DTFT integral to the continuous-frequency representation. All three recover the discrete samples, within floating-point error.

That agreement does **not** yet prove recovery of the original continuous-time signal. Inverting the DFT, FFT, or DTFT recovers $x[n]$ because those transforms describe the sequence. Returning to continuous time requires the extra band-limited interpolation assumption:

$$
\widehat x_c(t)=\sum_n x[n]\operatorname{sinc}\!\left(\frac{t-nT_s}{T_s}\right).
$$

Lower $f_s$ until one tone exceeds Nyquist. The three inverse transforms will still recover every stored sample accurately, but the sinc curve will follow the aliased band-limited interpretation rather than the original CTS tone. This separates computational reversibility from analog identifiability: no transform can restore information that sampling made ambiguous.

{% include interactive-figure.html id="fig-end-to-end-spectrum" experiment="endToEnd" title="Follow three tones from continuous time to spectra and back" description="Adjust three frequencies and amplitudes, the sampling rate, and record length. Read the six panels in order; every panel recomputes from the same signal and acquisition settings." caption="The CTS line spectrum, finite-record DTFT, signed DFT bins, direct DFT/FFT comparison, three inverse reconstructions, and sinc interpolation are linked views of one experiment. Defaults are bin-aligned and below Nyquist; move a tone by half a bin or lower the sample rate to expose leakage and aliasing." %}

The most revealing trials are purposeful. First use the defaults, where all three tones are below Nyquist and land on bins. Then add half of $\Delta f=f_s/N$ to one frequency and watch its DTFT lobe fall between DFT samples. Finally reduce $f_s$ until a tone crosses Nyquist. The readout reports signed aliases and the numerical errors separately, making it possible to see that exact digital inversion and correct analog reconstruction are different claims.

The next research article will use these reusable sampling, windowing, FFT, Welch, and STFT tools for EEG analysis. The central question will remain the same: **which conclusions belong to the signal, and which belong to the way we measured and analyzed it?**

{% include references.html %}
