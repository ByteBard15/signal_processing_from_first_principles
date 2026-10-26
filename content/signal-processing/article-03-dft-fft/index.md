---
title: "From Samples to Spectra: The DFT, FFT and Practical Spectral Analysis"
subtitle: What a finite digital record can tell us
slug: samples-to-spectra
permalink: /articles/samples-to-spectra/
description: "Deriving the DFT from the DTFT, interpreting finite records and frequency bins, understanding leakage and windows, and computing the same spectrum efficiently with an FFT."
series: From Frequency-Domain Analysis to Neural Signals and Sound
article_number: 3
date: 2026-10-16
updated: 2026-10-16
reading_time: 36
tags: [DFT, FFT, spectral leakage, windows, spectral analysis, interactive research]
interactive: true
previous_page: /articles/continuous-to-discrete/
previous_title: From Continuous to Discrete
references: [R3, R4, R7]
---

## The finite observation problem

[Article 2]({{ '/articles/continuous-to-discrete/' | relative_url }}) ended with a discrete-time sequence and its DTFT,

$$
X(e^{j\omega})=\sum_{n=-\infty}^{\infty}x[n]e^{-j\omega n},
$$

a continuous, $2\pi$-periodic function of normalized frequency. A computer does not receive an infinite sequence or store a continuous function of frequency. It receives a finite array:

$$x[0],x[1],\ldots,x[N-1].$$

The question for this article is narrower: **what spectrum can those $N$ numbers determine, and how should an engineer interpret it?**

We will first use convolution to understand one practical operation on samples. Then finite observation leads to the DFT, its periodic interpretation, frequency bins, leakage and windows. Only after the mathematical transform is established will we reorganize its arithmetic into an FFT.

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

For amplitude displays, the window's coherent gain is $G_c=\sum_n w[n]/N$. An isolated bin-aligned cosine can be normalized using $2\lvert X_w[k]\rvert/\sum_n w[n]$ for an interior positive bin. This is different from the squared-window normalization used later for power-density estimation. For the symmetric definitions above, $G_c$ approaches $0.5$ for Hann and $0.54$ for Hamming as $N$ grows; DC and the Nyquist bin require no factor of two.

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

The sequence cannot distinguish $\omega_i$ from $\omega_i+2\pi m$, which is why its DTFT repeats and why physical frequencies separated by $mf_s$ produce the same samples. The second panel overlays two deliberately different objects: the original CTS spectrum has ideal lines at $\pm f_1,\pm f_2,\pm f_3$, while the finite record has a continuous-frequency DTFT whose lobes repeat every $f_s$ when its normalized axis is labelled in hertz.

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

So far, a spectrum has answered “which frequencies occur in this finite observation?” Real measurements often demand two harder questions: how reliably is power distributed across frequency, and when did that distribution change? The next article will let EEG data create the need for periodograms, Welch averaging, the STFT, and spectrograms rather than adding those methods here without an application.

{% include references.html %}
