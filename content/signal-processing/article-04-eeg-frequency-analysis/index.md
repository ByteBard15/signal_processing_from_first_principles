---
title: "Seeing Frequency Change Over Time: The Short-Time Fourier Transform and Time–Frequency Uncertainty"
subtitle: Window functions, spectral leakage, and the trade-off between temporal and frequency localization
slug: seeing-neural-activity-through-frequency
permalink: /articles/seeing-neural-activity-through-frequency/
description: "Deriving the short-time Fourier transform, interpreting windows and spectrograms, and designing reproducible window-length experiments with synthetic signals and EEG."
series: From Frequency-Domain Analysis to Neural Signals and Sound
article_number: 4
date: 2026-11-01
updated: 2026-11-01
reading_time: 58
tags: [STFT, spectrogram, windows, spectral leakage, time-frequency uncertainty, EEG, C++]
interactive: true
previous_page: /articles/samples-to-spectra/
previous_title: From Samples to Spectra
references: [R3, R8, R12, R13, R14]
---

## A spectrum without a clock

[Article 3]({{ '/articles/samples-to-spectra/' | relative_url }}) began with a finite record and derived its DFT,

$$
X[k]=\sum_{n=0}^{N-1}x[n]e^{-j2\pi kn/N}.
$$

Each coefficient asks how strongly the entire record projects onto one complex oscillation. The word **entire** now matters. Let two four-second signals sampled at $f_s=256$ samples/s be

$$
x_1(t)=\sin(2\pi 20t),
$$

and

$$
x_2(t)=
\begin{cases}
\sin(2\pi 20t),&0\leq t<2,\\
\sin(2\pi 60t),&2\leq t<4.
\end{cases}
$$

The first contains one stationary tone. The second contains two successive tones. A global magnitude spectrum can reveal energy near 20 and 60 Hz in $x_2$, but it has discarded the answer to “which came first?” Reversing the two halves changes phase but leaves their broad magnitude structure much the same. A magnitude spectrum organizes a record by frequency; it does not preserve a readable time axis.

This limitation is not a failure of the Fourier transform. It follows from the question we asked. Every global coefficient combines samples from the whole observation. To ask when a frequency occurs, we need a measurement whose support is local in time.

Signals whose statistical or spectral character changes with time are called **non-stationary**. The term must be used carefully: stationarity is formally a property of a random process, with several possible definitions. In practical spectral analysis, “locally stationary” often means that a short region can be treated as approximately unchanging even though the full record cannot. A tone switch is deliberately non-stationary. Speech, machinery during a speed change, and electroencephalography (EEG) may also contain transient or evolving structure.

EEG records voltage differences between electrodes or between an electrode and a reference. It reflects the combined electrical fields reaching the scalp, not the activity of an isolated neuron. Rhythmic and transient patterns may vary during a recording, so the timing of spectral power can matter. That observation motivates a time–frequency display; it does not by itself establish a diagnosis or a universal task-related EEG effect.

{% include interactive-figure.html id="fig-stft" experiment="stft" title="A spectrum gains a time axis" description="Change the analysis-window length and overlap for a signal that switches from 20 Hz to 60 Hz at two seconds." caption="The global FFT contains both components but does not expose their order. The spectrogram repeats a local Fourier measurement. Window length changes its blur; overlap changes how densely that blurred measurement is sampled in time." %}

## From a global transform to a local transform

Use ordinary frequency $f$ in hertz and the continuous-time Fourier convention

$$
X(f)=\int_{-\infty}^{\infty}x(\tau)e^{-j2\pi f\tau}\,d\tau.
$$

The integration variable is written as $\tau$ because $t$ will label the location of a local observation. Choose a window $w$ concentrated around zero and move its centre to $t$:

$$
w_t(\tau)=w(\tau-t).
$$

Multiplication retains or emphasizes samples near $t$:

$$
x_t(\tau)=x(\tau)w(\tau-t).
$$

There is no new transform yet. Apply the same Fourier transform to this local signal:

$$
\boxed{X(t,f)=\int_{-\infty}^{\infty}
x(\tau)w(\tau-t)e^{-j2\pi f\tau}\,d\tau.}
$$

This is one convention for the **short-time Fourier transform** (STFT). For fixed $t$, it is the Fourier transform of the windowed signal. Moving $t$ produces another spectrum. The resulting function has two independent coordinates: observation time $t$ in seconds and frequency $f$ in hertz.

Some texts conjugate the window, write $w^*(\tau-t)$, or use $e^{-j2\pi f(\tau-t)}$. For a real window the conjugation changes nothing. Moving $t$ into the exponential multiplies each coefficient by a phase factor $e^{j2\pi ft}$, changing phase but not magnitude. Those conventions are compatible when stated; silently mixing them is not.

### The finite, discrete STFT used by a computer

Let a real sequence be sampled at $f_s$ samples/s. We will use:

| Symbol | Meaning | Unit or range |
| --- | --- | --- |
| $m$ | frame index | $0,1,\ldots,M-1$ |
| $n$ | position inside a frame | $0,1,\ldots,L-1$ |
| $L$ | number of windowed data samples | samples |
| $H$ | hop between frame starts | samples |
| $N_{\rm FFT}$ | transform length | samples, $N_{\rm FFT}\geq L$ |
| $k$ | DFT-bin index | $0,1,\ldots,N_{\rm FFT}-1$ |

Frame $m$ starts at sample $mH$. Before writing its transform, separate the three operations that are easy to compress into one formula. First select $L$ actual measurements:

$$
x_m[n]=x[mH+n],\qquad 0\leq n<L.
$$

Then weight those measurements:

$$
v_m[n]=x_m[n]w[n].
$$

Finally, if the requested DFT length is larger than the measured frame, define the FFT input

$$
u_m[n]=
\begin{cases}
v_m[n],&0\leq n<L,\\
0,&L\leq n<N_{\rm FFT}.
\end{cases}
$$

Its $N_{\rm FFT}$-point DFT is

$$
\begin{aligned}
X[m,k]
&=\sum_{n=0}^{N_{\rm FFT}-1}u_m[n]e^{-j2\pi kn/N_{\rm FFT}}\\
&=\sum_{n=0}^{L-1}x[n+mH]w[n]e^{-j2\pi kn/N_{\rm FFT}},
\end{aligned}
$$

because every term from $n=L$ onward is multiplied by zero. Thus the commonly quoted STFT expression

$$
\boxed{X[m,k]=\sum_{n=0}^{L-1}x[n+mH]w[n]
e^{-j2\pi kn/N_{\rm FFT}}.}
$$

is an ordinary DFT of a precisely defined finite vector. $L$ is the number of actual signal samples allowed to influence one frame. $N_{\rm FFT}$ is the number of equally spaced frequency coordinates at which the DFT is evaluated. If $N_{\rm FFT}>L$, the windowed frame is followed by $N_{\rm FFT}-L$ zeros. The frame still contains only $L$ measurements.

For example, let $L=8$ and let the tapered frame be

$$
v_m=[2,4,1,3,5,2,1,4].
$$

With $N_{\rm FFT}=8$, those eight values enter an eight-point DFT. With $N_{\rm FFT}=16$, the input is

$$
[2,4,1,3,5,2,1,4,0,0,0,0,0,0,0,0].
$$

The second calculation returns sixteen coefficients, but positions 8 through 15 are declared zeros rather than new observations. If $N_{\rm FFT}<L$, a length-$N_{\rm FFT}$ DFT cannot accept all $L$ values without discarding, folding, or otherwise changing them. This article therefore requires $N_{\rm FFT}\geq L$; truncating to $N_{\rm FFT}$ samples would define a shorter effective window.

Under this indexing convention, the frame-start time and a useful frame-centre time are

$$
t_m^{\rm start}=\frac{mH}{f_s},
\qquad
t_m^{\rm centre}=\frac{mH+(L-1)/2}{f_s}.
$$

The first expression locates the left edge; the second locates the centre of the actual sample positions. Some software instead uses $mH+L/2$ as the centre of the half-open interval occupied by the frame. The difference is half a sample, so metadata must say which convention was used.

The frequency assigned to bin $k$ is

$$
f_k=\frac{k f_s}{N_{\rm FFT}}.
$$

For a real signal, bins $0$ through $\lfloor N_{\rm FFT}/2\rfloor$ contain the non-redundant one-sided representation. Higher indices correspond to negative frequencies after subtracting $f_s$. The spacing of the **computed grid** is $f_s/N_{\rm FFT}$; the resolving behaviour remains controlled by the $L$ measured, windowed samples.

## A window is part of the measurement

Why not simply cut a block from the record? Cutting is already windowing. A length-$L$ rectangular window is

$$
w_R[n]=
\begin{cases}
1,&0\leq n<L,\\
0,&\text{otherwise}.
\end{cases}
$$

Article 3 derived that multiplication in time becomes periodic convolution in normalized frequency. If $X(e^{j\omega})$ and $W(e^{j\omega})$ are the DTFTs of signal and window, then

$$
\mathcal F_d\{x[n]w[n]\}(e^{j\omega})
=\frac{1}{2\pi}\int_{-\pi}^{\pi}
X(e^{j(\omega-\theta)})W(e^{j\theta})\,d\theta.
$$

For an ideal complex sinusoid, $X$ is an impulse at its frequency. Convolution shifts a copy of $W$ to that frequency. A finite observation therefore replaces an ideal line by the window's spectral shape: a central **main lobe** and surrounding **side lobes**. Energy appearing away from the source frequency is **spectral leakage**. It is caused by finite observation and window shape, not by sampling frequencies folding across Nyquist. The latter is aliasing.

For the rectangular window, sum its DTFT directly:

$$
\begin{aligned}
W_R(e^{j\omega})
&=\sum_{n=0}^{L-1}e^{-j\omega n}\\
&=e^{-j\omega(L-1)/2}
\frac{\sin(L\omega/2)}{\sin(\omega/2)}.
\end{aligned}
$$

At $\omega=0$, the limiting magnitude is $L$. The nearest zeros occur at $\omega=\pm2\pi/L$. The region between those zeros is the **main lobe**: the largest concentration around the frequency being measured. The smaller peaks outside those zeros are **side lobes**. They are why a strong component can contribute nonzero values far from its own frequency.

Convolution does not create new physical oscillators in the source. If a complex tone has an ideal spectral impulse at $\omega_0$, then

$$
\delta(\omega-\omega_0)*W_R(\omega)=W_R(\omega-\omega_0).
$$

The window spectrum is shifted so that its main lobe is centred at $\omega_0$, while its sidelobes extend elsewhere. For a real cosine there are ideal impulses at $+\omega_0$ and $-\omega_0$, so the windowed spectrum contains two shifted copies. “Additional frequencies” in a plotted finite-record spectrum are values of these lobes, not evidence that multiplication caused the physical source to emit extra tones.

{% include interactive-figure.html id="fig-window-convolution" experiment="leakage" title="Multiplication in time becomes spreading in frequency" description="Compare the window shape, the windowed tone, the shifted spectral lobe pattern, and the window transform itself." caption="The fourth panel labels the main lobe and sidelobe pattern through its shape. Changing from rectangular to Hann alters that kernel; the tone spectrum is the corresponding shifted response. Use the tone and window panels together as the time-domain multiplication, and the two spectral panels as its frequency-domain consequence." %}

### Why an off-bin sinusoid leaks

Suppose $x[n]=\cos(2\pi r n/L)$ and $r$ is not an integer. The rectangular record contains a non-integer number of cycles. The DFT represents the block as one period of a periodic sequence, so it implicitly joins the last sample back to the first. In general, the joined value and slope do not match. A sharp boundary needs many Fourier basis functions, so projections spread across bins.

For example, at $f_s=256$ Hz a 21 Hz sinusoid observed for $L=64$ samples lasts 0.25 s and contains $21(0.25)=5.25$ cycles. The bin spacing is 4 Hz, so the tone lies at bin coordinate $21/4=5.25$, not at an integer bin. Its rectangular-window zeros do not fall on the other DFT bins, and many coefficients are nonzero.

This periodic-extension picture is useful, but it is not a separate leakage mechanism. It describes the same mathematics as convolution with the rectangular-window spectrum.

### Derivation: one tone becomes the window spectrum

The exact finite sum shows why integer-bin alignment is special. Begin with a complex tone

$$
x[n]=e^{j\omega_0n},\qquad 0\leq n<L,
$$

and use a rectangular window with an unpadded $L$-point DFT. At bin $k$,

$$
\begin{aligned}
X[k]
&=\sum_{n=0}^{L-1}e^{j\omega_0n}e^{-j2\pi kn/L}\\
&=\sum_{n=0}^{L-1}e^{j\delta_kn},
\qquad
\delta_k=\omega_0-\frac{2\pi k}{L}.
\end{aligned}
$$

For $\delta_k$ not an integer multiple of $2\pi$, this is a geometric series:

$$
X[k]=\frac{1-e^{jL\delta_k}}{1-e^{j\delta_k}}.
$$

Use $1-e^{j\alpha}=-2je^{j\alpha/2}\sin(\alpha/2)$ in numerator and denominator:

$$
\boxed{
X[k]=e^{j(L-1)\delta_k/2}
\frac{\sin(L\delta_k/2)}{\sin(\delta_k/2)}.}
$$

Its magnitude is the shifted rectangular-window spectrum,

$$
\lvert X[k]\rvert=
\left\lvert\frac{\sin(L\delta_k/2)}{\sin(\delta_k/2)}\right\rvert.
$$

If $\omega_0=2\pi k_0/L$, then at $k=k_0$ every summand equals one and the limiting value is $X[k_0]=L$. At any other integer bin $k$, $L\delta_k/2=\pi(k_0-k)$ makes the numerator zero while the denominator is nonzero. All other DFT projections cancel exactly.

If $k_0$ is not an integer, the shifted zeros generally fall between the DFT sample locations, so many $X[k]$ values are nonzero. The DFT has not split one physical sinusoid into newly generated tones. It has sampled the finite window's lobe pattern. A real cosine is the sum of positive- and negative-frequency complex tones, so its result is the corresponding pair of shifted window spectra.

The 21 Hz example makes every number visible. With $f_s=256$ Hz and $L=64$,

$$
T_w=\frac{64}{256}=0.25\ \text{s},
\qquad
21T_w=5.25\ \text{cycles},
$$

and

$$
\Delta f=\frac{256}{64}=4\ \text{Hz},
\qquad
k_0=\frac{21}{4}=5.25.
$$

The closest basis tones are bin 5 at 20 Hz and bin 6 at 24 Hz. By contrast, a 20 Hz tone completes exactly five cycles and aligns with bin 5 under the same rectangular observation. “Non-integer cycles,” “a discontinuity in the periodic extension,” and “a shifted window spectrum whose zeros miss the DFT bins” are time-domain, periodic, and frequency-domain views of the same finite-record calculation.

{% include interactive-figure.html id="fig-off-bin-leakage" experiment="leakage" title="Move a tone onto and away from a DFT bin" description="Choose a rectangular window and compare a bin-centred tone with one between bins; inspect both the continuous finite-record DTFT and its DFT samples." caption="With 64 samples at 512 samples/s, natural bins are 8 Hz apart. Set the tone to 48 Hz for exact alignment, then move it toward 50 Hz. The continuous lobe shifts smoothly; at 48 Hz its zeros land on the other DFT bins, while an off-bin shift gives many nonzero samples." %}

### Rectangular and Hann windows make different compromises

The symmetric Hann window is

$$
\boxed{w_H[n]=\frac12\left(1-\cos\frac{2\pi n}{L-1}\right),
\qquad 0\leq n<L.}
$$

The denominator $L-1$ puts cosine phase $0$ at the first sample and $2\pi$ at the last, so both endpoints are zero. This **symmetric** form is natural when the finite sequence itself must be symmetric, as in FIR filter design. A common **periodic** form uses denominator $L$:

$$
w_{H,p}[n]=\frac12\left(1-\cos\frac{2\pi n}{L}\right),
\qquad 0\leq n<L.
$$

It is the first $L$ samples of an $(L+1)$-sample symmetric Hann after its duplicate zero endpoint is removed, so it joins periodically without repeating that endpoint. FFT libraries and numerical packages differ in defaults; the C++ implementation below deliberately uses the symmetric $L-1$ definition. [R14](#r14)

The Hann transform can be related to the rectangular transform rather than treated as an unrelated curve. Let

$$
\omega_H=\frac{2\pi}{L-1}.
$$

Using $\cos\alpha=(e^{j\alpha}+e^{-j\alpha})/2$, write the symmetric Hann as

$$
w_H[n]=\frac12w_R[n]
-\frac14e^{j\omega_Hn}w_R[n]
-\frac14e^{-j\omega_Hn}w_R[n].
$$

The modulation property then gives

$$
\boxed{
W_H(e^{j\omega})=
\frac12W_R(e^{j\omega})
-\frac14W_R(e^{j(\omega-\omega_H)})
-\frac14W_R(e^{j(\omega+\omega_H)}) .}
$$

Thus the Hann response is a weighted combination of three shifted rectangular-window responses. Near many sidelobe peaks those copies partially cancel, lowering sidelobes. Near the centre they combine into a wider main lobe. Tapering and the spectral trade-off are two descriptions of this same algebra.

Tapering the frame toward zero reduces the abrupt end-to-start mismatch and lowers sidelobes relative to a rectangular window. It does **not** eliminate leakage. The Hann main lobe is also broader: for large $L$, its null-to-null width is approximately four DFT bins, compared with two for the rectangle. A weak tone sufficiently far from a strong tone may be easier to see with Hann's lower sidelobes, while two equal, very close tones may be harder to separate because of its wider main lobes.

The rectangular window is therefore not “wrong,” and Hann is not universally “better.” A rectangle has the narrowest main lobe among these two and is exact for a noiseless bin-centred sinusoid under the DFT's periodic model. Hann is often a useful default when components are not bin-centred and sidelobe suppression matters. Window selection declares which spectral errors matter most.

## One duration cannot localize both coordinates arbitrarily well

Set $N_{\rm FFT}=L$ for the moment. A window containing $L$ samples has nominal duration

$$
T_w=\frac{L}{f_s}.
$$

The DFT grid spacing is

$$
\boxed{\Delta f_{\rm bin}=\frac{f_s}{L}=\frac1{T_w}.}
$$

At $f_s=256$ samples/s, the proposed experiment uses powers of two:

| Window duration | Samples $L$ | Hop $H=L/4$ | DFT-bin spacing $f_s/L$ |
| --- | ---: | ---: | ---: |
| 125 ms | 32 | 8 | 8 Hz |
| 250 ms | 64 | 16 | 4 Hz |
| 500 ms | 128 | 32 | 2 Hz |
| 1000 ms | 256 | 64 | 1 Hz |
| 2000 ms | 512 | 128 | 0.5 Hz |

These numbers are exact grid spacings, not universal frequency resolutions. With a Hann window the main lobe is roughly four bins from first null to first null, so its width in hertz also shrinks as $L$ grows. Whether two tones are empirically resolved depends additionally on their amplitudes, phases, separation, noise, and a declared peak-selection rule.

A short window multiplies the signal by something narrow in time. It can distinguish events occurring at noticeably different times because each frame mixes only a short interval. But its broad window spectrum smears a sinusoid over frequency. A long window accumulates many cycles, making the window spectrum narrower in hertz, but every coefficient combines a longer span of the signal. A sudden tone onset contributes to frames whose windows straddle that onset, so its displayed boundary is smeared across time.

This explains the trade-off rather than merely naming it:

- Short windows restrict which times contribute and broaden the spectral response.
- Long windows narrow the spectral response and combine more distant times.

Longer windows do not guarantee lower frequency-estimation error for every signal. A changing component can violate the assumption that one frequency describes the frame; additive noise, interference, estimator bias, and a component shorter than the window can reverse a simple trend.

### Zero-padding changes the ruler, not the observation

If $L=64$ but $N_{\rm FFT}=256$, displayed bins are 1 Hz apart even though the measured duration remains 0.25 s and the Hann response remains that of 64 weights. The padded DFT samples the same finite-frame DTFT at four times as many locations. This can make a lobe smoother and support peak interpolation. It cannot narrow the lobe or separate two components whose windowed responses already merge.

This can be proved directly. The DTFT of one length-$L$ windowed frame is

$$
V_m(e^{j\omega})=\sum_{n=0}^{L-1}v_m[n]e^{-j\omega n}.
$$

The zero-padded DFT evaluates this same function at

$$
\omega_k=\frac{2\pi k}{N_{\rm FFT}}:
$$

$$
\begin{aligned}
U_m[k]
&=\sum_{n=0}^{N_{\rm FFT}-1}u_m[n]e^{-j2\pi kn/N_{\rm FFT}}\\
&=\sum_{n=0}^{L-1}v_m[n]e^{-j\omega_kn}\\
&=V_m(e^{j\omega_k}).
\end{aligned}
$$

Changing $N_{\rm FFT}$ changes the set of $\omega_k$ values but not the function being sampled. For the 21 Hz tone above, padding from 64 to 256 points creates a displayed bin exactly at 21 Hz. The surrounding leakage lobe does not disappear: the tone still occupied only 0.25 seconds and still completed 5.25 cycles. Padding merely places a sample at the centre of the already-existing lobe.

{% include interactive-figure.html id="fig-zero-padding-grid" experiment="leakage" title="Zero-padding adds markers, not a narrower response" description="Increase the displayed DFT from N points to 2N, 4N, or 8N while keeping the measured samples and window fixed." caption="The continuous finite-record DTFT curve is unchanged. Padding places more DFT samples on that curve, so its peak and sidelobes look smoother, but their widths do not shrink." %}

## The time–frequency uncertainty relation

The qualitative trade-off has a precise continuous counterpart. Let $w(t)$ be square-integrable and nonzero, with Fourier transform

$$
W(f)=\int_{-\infty}^{\infty}w(t)e^{-j2\pi ft}\,dt.
$$

Normalize energy when defining moments. The time centroid and variance are

$$
\mu_t=\frac{\int t\lvert w(t)\rvert^2dt}{\int\lvert w(t)\rvert^2dt},
\qquad
\sigma_t^2=\frac{\int(t-\mu_t)^2\lvert w(t)\rvert^2dt}{\int\lvert w(t)\rvert^2dt}.
$$

Using angular frequency $\omega=2\pi f$ and the corresponding transform $W_\omega(\omega)$, define

$$
\mu_\omega=\frac{\int \omega\lvert W_\omega(\omega)\rvert^2d\omega}{\int\lvert W_\omega(\omega)\rvert^2d\omega},
\qquad
\sigma_\omega^2=\frac{\int(\omega-\mu_\omega)^2\lvert W_\omega(\omega)\rvert^2d\omega}{\int\lvert W_\omega(\omega)\rvert^2d\omega}.
$$

For functions with finite second moments and sufficient regularity for the Fourier derivative argument,

$$
\boxed{\sigma_t\sigma_\omega\geq\frac12.}
$$

Because $\omega=2\pi f$, standard deviations scale as $\sigma_\omega=2\pi\sigma_f$. Therefore

$$
\boxed{\sigma_t\sigma_f\geq\frac1{4\pi}.}
$$

### Derivation: where the lower bound comes from

Translation and modulation change the centroids but not the spreads, so first centre the window such that $\mu_t=0$ and $\mu_\omega=0$. Write its energy as

$$
E=\int_{-\infty}^{\infty}\lvert w(t)\rvert^2dt.
$$

Assume $tw(t)$ and $w'(t)$ are square-integrable and that $t\lvert w(t)\rvert^2$ vanishes at infinity. Integration by parts gives

$$
\begin{aligned}
E
&=\int \lvert w(t)\rvert^2dt\\
&=-\int t\frac{d}{dt}\lvert w(t)\rvert^2dt\\
&=-2\operatorname{Re}\int t\,w'(t)w^*(t)\,dt.
\end{aligned}
$$

The first equality after the sign follows because

$$
\int \frac{d}{dt}\left(t\lvert w(t)\rvert^2\right)dt=0
$$

under the boundary assumption. Now discard only the phase of the inner product and apply Cauchy–Schwarz:

$$
\begin{aligned}
E
&\leq 2\left\lvert\int tw'(t)w^*(t)\,dt\right\rvert\\
&\leq 2
\left(\int t^2\lvert w(t)\rvert^2dt\right)^{1/2}
\left(\int\lvert w'(t)\rvert^2dt\right)^{1/2}.
\end{aligned}
$$

With the angular-frequency transform convention

$$
W_\omega(\omega)=\int w(t)e^{-j\omega t}dt,
$$

differentiation gives $\mathcal F\{w'\}=j\omega W_\omega$. Parseval therefore gives

$$
\frac{\int\lvert w'(t)\rvert^2dt}{E}
=
\frac{\int\omega^2\lvert W_\omega(\omega)\rvert^2d\omega}
{\int\lvert W_\omega(\omega)\rvert^2d\omega}
=\sigma_\omega^2,
$$

where the final equality uses $\mu_\omega=0$. Similarly,

$$
\frac{\int t^2\lvert w(t)\rvert^2dt}{E}=\sigma_t^2.
$$

Divide the Cauchy–Schwarz result by $E$ to obtain

$$
1\leq2\sigma_t\sigma_\omega,
\qquad
\boxed{\sigma_t\sigma_\omega\geq\frac12}.
$$

Equality requires equality in Cauchy–Schwarz and in the preceding real-part bound. After centring, that requires $w'(t)=-ctw(t)$ for a positive real constant $c$. Solving the differential equation gives

$$
w(t)=A e^{-ct^2/2},
$$

a Gaussian up to translation, modulation, scale, and constant phase. A Gaussian attains the lower bound under these definitions; a Hann window generally does not. [R12](#r12)

Four related quantities must remain separate:

1. $\sigma_t\sigma_f$ is a theoretical relation between energy-weighted spreads of a Fourier pair.
2. Practical resolution describes an analysis system's ability to distinguish events or components under a stated decision rule.
3. DFT-bin spacing describes where a finite transform is evaluated.
4. Localization error compares an estimator with known ground truth.

The identity $(L/f_s)(f_s/L)=1$ is only the product of nominal window duration and unpadded bin spacing. It is **not** the uncertainty equality, and it says nothing about the variance of a Hann spectrum. The window-length experiment will measure practical errors while the inequality explains why no window can concentrate without limit in both domains.

## Hop size samples the moving measurement

The window need not move forward by its full length. If each frame contains $L$ samples and starts $H$ samples after the previous one, then

$$
N_{\rm overlap}=L-H,
\qquad
\operatorname{Overlap}(\%)=\frac{L-H}{L}\times100.
$$

For a small indexing example, choose $L=8$ and $H=4$. The first three frames contain

$$
\begin{aligned}
m=0 &: \quad x[0],x[1],\ldots,x[7],\\
m=1 &: \quad x[4],x[5],\ldots,x[11],\\
m=2 &: \quad x[8],x[9],\ldots,x[15].
\end{aligned}
$$

Frame 1 reuses samples 4 through 7 from frame 0, then adds samples 8 through 11. Nothing has been interpolated between samples: overlap means the same measured values participate in more than one local spectrum.

For $L=256$ and $H=64$, adjacent frames share 192 samples, giving 75% overlap. The window lasts $256/f_s$ seconds, while successive frame coordinates are only $64/f_s$ seconds apart. Window duration and frame spacing are different.

If a record contains $N_x$ samples and incomplete final frames are discarded, the number of frames is

$$
M=
\begin{cases}
0,&N_x<L,\\[3pt]
1+\left\lfloor\dfrac{N_x-L}{H}\right\rfloor,&N_x\geq L.
\end{cases}
$$

For $N_x=1024$, $L=256$, and $H=64$, this gives $M=13$. Their centres are separated by 0.25 s when $f_s=256$ Hz, although each measurement spans one second.

Overlap provides a denser sampling of the time-varying STFT. It makes animations and heatmaps less blocky and reduces the chance that a transient falls only near a window edge. It does not shorten the one-second window, narrow its spectral response, or evade uncertainty. More overlap also increases computation and produces more strongly correlated, redundant frames.

Overlap matters for inverse STFT reconstruction because shifted synthesis windows must combine with suitable gain. Constant-overlap-add conditions are one way to ensure the reconstructed samples receive constant total weighting. Reconstruction is an important design problem, but this article uses the STFT for analysis and does not assume that any arbitrary window-hop pair provides perfect synthesis.

## From complex coefficients to a spectrogram

$X[m,k]$ is complex. Its magnitude $\lvert X[m,k]\rvert$ measures local coefficient size; its argument records phase relative to the frame's time origin. Common displays are:

$$
A[m,k]=\lvert X[m,k]\rvert,
\qquad
P[m,k]=\lvert X[m,k]\rvert^2.
$$

The first is a magnitude spectrogram and the second a power spectrogram before any density normalization. For power in decibels,

$$
P_{\rm dB}[m,k]=10\log_{10}\left(\frac{P[m,k]}{P_{\rm ref}}\right).
$$

$P_{\rm ref}$ must have the same units as $P$. If a magnitude rather than power is displayed, the equivalent expression is $20\log_{10}(A/A_{\rm ref})$ because $P\propto A^2$. A small positive floor is normally applied before the logarithm to avoid $\log 0$; that floor is a display choice, not measured power.

A power spectral density estimate for a real, one-sided frame can use

$$
\widehat S_{xx}[m,k]
=\frac{c_k\lvert X[m,k]\rvert^2}{f_s\sum_{n=0}^{L-1}w^2[n]},
$$

where $c_k=2$ for interior positive-frequency bins and $c_k=1$ at DC and, for even $N_{\rm FFT}$, Nyquist. Its units are signal-unit squared per hertz. The squared-window normalization is essential when comparing window lengths: raw $\lvert X\rvert^2$ grows with both the amount of data and window weights. Coherent-gain normalization used for sinusoidal amplitude is a different convention and must not be substituted silently.

A conventional spectrogram puts time horizontally, frequency vertically, and maps magnitude or power to colour. A 3D surface uses points

$$
(t_m,f_k,P[m,k]).
$$

Both visualize the same matrix. A surface can make peaks intuitive in one representative example, but perspective and occlusion often make a 2D heatmap easier to compare quantitatively.

In an idealized spectrogram, a stationary tone makes a horizontal ridge. A short burst makes a ridge restricted in time but blurred near its beginning and end. A linear chirp makes a sloped ridge. The exact widths are properties of the windowed analysis, not literal widths of the physical source.

## Implementing the STFT in modern C++

The following C++20 implementation uses FFTW's real-to-complex transform. It creates one plan and reuses aligned input and output buffers for every frame. Incomplete final frames are discarded; changing that policy to padding would add a boundary assumption and additional frames.

```cpp
#include <fftw3.h>

#include <cmath>
#include <complex>
#include <cstddef>
#include <stdexcept>
#include <utility>
#include <vector>

struct StftConfig {
    double sample_rate_hz{};
    std::size_t window_length{};
    std::size_t hop_size{};
    std::size_t fft_size{};
};

struct StftFrame {
    double centre_time_s{};
    std::vector<std::complex<double>> coefficients;
    std::vector<double> power_density;
};

struct StftResult {
    std::vector<double> frequencies_hz;
    std::vector<StftFrame> frames;
};

std::vector<double> symmetric_hann(std::size_t length) {
    if (length < 2) {
        throw std::invalid_argument("Hann length must be at least two");
    }
    const double pi = std::acos(-1.0);
    std::vector<double> window(length);
    for (std::size_t n = 0; n < length; ++n) {
        // L - 1 makes both samples at the finite record's endpoints zero.
        window[n] = 0.5 * (1.0 - std::cos(2.0 * pi * n / (length - 1)));
    }
    return window;
}

StftResult stft(const std::vector<double>& signal, const StftConfig& cfg) {
    if (!(cfg.sample_rate_hz > 0.0) || cfg.window_length < 2 ||
        cfg.hop_size == 0 || cfg.fft_size < cfg.window_length) {
        throw std::invalid_argument("invalid STFT configuration");
    }

    const auto window = symmetric_hann(cfg.window_length);
    double window_energy = 0.0;
    for (double value : window) {
        window_energy += value * value;
    }

    const std::size_t bin_count = cfg.fft_size / 2 + 1;
    auto* input = fftw_alloc_real(cfg.fft_size);
    auto* output = fftw_alloc_complex(bin_count);
    if (input == nullptr || output == nullptr) {
        if (input != nullptr) fftw_free(input);
        if (output != nullptr) fftw_free(output);
        throw std::bad_alloc{};
    }

    // ESTIMATE avoids planner measurements that may overwrite the buffers.
    fftw_plan plan = fftw_plan_dft_r2c_1d(
        static_cast<int>(cfg.fft_size), input, output, FFTW_ESTIMATE);
    if (plan == nullptr) {
        fftw_free(output);
        fftw_free(input);
        throw std::runtime_error("FFTW could not create a plan");
    }

    StftResult result;
    result.frequencies_hz.resize(bin_count);
    for (std::size_t k = 0; k < bin_count; ++k) {
        result.frequencies_hz[k] = k * cfg.sample_rate_hz / cfg.fft_size;
    }

    // Policy: process complete windows only; do not invent a padded final frame.
    for (std::size_t start = 0;
         start + cfg.window_length <= signal.size();
         start += cfg.hop_size) {
        for (std::size_t n = 0; n < cfg.window_length; ++n) {
            input[n] = signal[start + n] * window[n];
        }
        for (std::size_t n = cfg.window_length; n < cfg.fft_size; ++n) {
            input[n] = 0.0; // zero-padding changes the sampled frequency grid only
        }

        fftw_execute(plan);

        StftFrame frame;
        frame.centre_time_s =
            (start + (cfg.window_length - 1) / 2.0) / cfg.sample_rate_hz;
        frame.coefficients.resize(bin_count);
        frame.power_density.resize(bin_count);

        for (std::size_t k = 0; k < bin_count; ++k) {
            const std::complex<double> value{output[k][0], output[k][1]};
            frame.coefficients[k] = value;

            // One-sided PSD scaling: double bins with distinct negative partners.
            const bool dc = k == 0;
            const bool nyquist = cfg.fft_size % 2 == 0 && k == cfg.fft_size / 2;
            const double one_sided = (dc || nyquist) ? 1.0 : 2.0;
            frame.power_density[k] =
                one_sided * std::norm(value) /
                (cfg.sample_rate_hz * window_energy);
        }
        result.frames.push_back(std::move(frame));
    }

    fftw_destroy_plan(plan);
    fftw_free(output);
    fftw_free(input);
    return result;
}
```

FFTW's forward transform uses the same negative-exponent DFT convention as this article and is unnormalized. A forward transform followed by its inverse therefore multiplies samples by $N_{\rm FFT}$; an inverse pipeline must divide by that value. Its one-dimensional real transform stores only $N_{\rm FFT}/2+1$ non-redundant complex outputs. The code preserves those complex coefficients and separately computes a one-sided PSD. [R13](#r13)

Allocation and plan lifetime are explicit. Production code should wrap the buffers and plan in RAII types so cleanup also occurs if construction of a result frame throws. This first implementation keeps the FFT loop visible and avoids allocating FFTW buffers or plans inside it; result vectors necessarily allocate storage for retained output.

A minimal CMake build is:

```cmake
cmake_minimum_required(VERSION 3.20)
project(stft_example LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(PkgConfig REQUIRED)
pkg_check_modules(FFTW3 REQUIRED IMPORTED_TARGET fftw3)

add_executable(stft_example main.cpp)
target_link_libraries(stft_example PRIVATE PkgConfig::FFTW3)
```

On a system with FFTW and `pkg-config` development files installed:

```text
cmake -S . -B build
cmake --build build
```

The pipeline is now explicit: select $L$ and $H$, generate the window, extract and taper each complete frame, zero-pad to $N_{\rm FFT}$ if requested, execute the FFT, retain complex bins, apply a declared magnitude or power normalization, and attach physical time and frequency coordinates.

## Experiment: change only the window length

The central experiment asks what changes when the Hann window length changes. To make that answer identifiable, hold the transform, sample rate, overlap proportion, normalization, signal duration, and decision rules fixed.

The complete C++20 experiment, EDF+ reader, download script, fixed seeds, CSV data, and SVG figures are in the [Article 4 STFT experiment project](https://github.com/ByteBard15/signal_processing_from_first_principles/tree/main/experiments/article-04-stft). Its README records the exact build and rerun commands. Results below were generated by that code with FFTW 3.3.11; they are not values inferred from the plots.

For synthetic data, use $f_s=256$ Hz, 75% overlap ($H=L/4$), the symmetric Hann window, and $N_{\rm FFT}=L$ for the primary comparison. A secondary zero-padding plot may use a common dense FFT grid, clearly labelled as interpolation. Use the five lengths in the earlier table.

### What enters the experiment?

There are two input sources, and they answer different questions.

The **synthetic source** is generated from equations. Its frequencies, onset, offset, amplitude, and noise distribution are known because the program sets them. It is not intended to imitate every feature of EEG. Its purpose is measurement: if an estimator reports 31 Hz for a programmed 30 Hz tone, the error is knowable.

The **EEG source** is a measured voltage-difference recording. Subject S001 Run 04 asked the participant to imagine opening and closing the left or right fist during annotated task intervals. In this run, `T0` marks rest, `T1` the left-imagery instruction, and `T2` the right-imagery instruction. These codes describe the experimental cue, not a guaranteed mental state and not the onset of a specific cortical rhythm. The first 30 seconds alternate labelled rest and imagery intervals; the practical comparison later applies every window length to the same C3 samples. [R8](#r8)

The notation also separates the source from its analysis. $x(t)$ denotes an ideal continuous-time definition; sampling it at $t=n/f_s$ produces $x[n]$. The STFT turns $x[n]$ into complex coefficients $X[m,k]$. The plotted **PSD** is the normalized squared coefficient described earlier, with units of signal-unit squared per hertz. None of these symbols denotes a new physical signal emitted by the source.

### Synthetic signals with known answers

Use four deterministic source definitions over an eight-second record:

$$
\begin{aligned}
x_{\rm tone}(t)&=\sin(2\pi 30t),\\
x_{\rm two}(t)&=\sin(2\pi 30t)+0.8\sin(2\pi 34t),\\
x_{\rm burst}(t)&=\mathbf 1_{[3.0,\,3.5)}(t)\sin(2\pi 40t),\\
x_{\rm chirp}(t)&=\sin\left(2\pi\left(10t+\frac{50-10}{2\cdot8}t^2\right)\right).
\end{aligned}
$$

The indicator $\mathbf 1_{[3.0,\,3.5)}(t)$ equals one during that half-second interval and zero elsewhere. Therefore the stationary tone tests peak-frequency estimation, the two-tone signal tests a fixed 4 Hz separation, and the burst supplies exact onset, offset, duration, and carrier frequency. The optional chirp supplies instantaneous frequency $f_i(t)=10+5t$ Hz and tests whether a continuously changing ridge is averaged within long frames. Each signal isolates one question; combining all effects in one source would make the cause of an error ambiguous.

For noisy trials, **0 dB input SNR** means

$$
10\log_{10}\left(\frac{P_{\rm clean}}{P_{\rm noise}}\right)=0,
$$

so the noise and clean signal have equal whole-record mean-square power. “Paired” trials mean that trial $r$ uses the same random realization for every window length. This removes an avoidable source of between-window variation: one length is not rewarded with an accidentally easier noise draw.

Define the estimators before looking at results. For the stationary tone, let $\hat f$ be the frequency of the largest one-sided PSD bin in $[20,45]$ Hz, with ties assigned to the lower frequency. Then

$$
e_f=\lvert\hat f-30\ \text{Hz}\rvert.
$$

Peak-bin error includes quantization by the DFT grid. A separately reported quadratic interpolation may reduce grid bias, but it must not replace the predeclared primary estimator after results are seen.

Here **peak-bin estimation** means selecting one of the actual DFT grid frequencies, not searching a continuous frequency axis. **Quadratic interpolation** fits a parabola to the logarithmic PSD at the winning bin and its two neighbours, then estimates a peak between them. It can locate the centre of an already visible lobe more finely than the grid spacing, but it cannot split two lobes that the measured window has merged.

For the two-tone experiment, declare the pair **resolved** only if two local maxima occur in $[26,38]$ Hz, each lies within 2 Hz of a different true tone, and the minimum between them is at least 3 dB below the smaller peak. This is one operational definition, not a universal Rayleigh law. Report resolved/unresolved for noiseless data and the resolution proportion across noisy trials.

The 3 dB valley rule turns “I can see two bumps” into a reproducible decision. A 3 dB power drop means the valley power is at most about half the smaller peak power because $10\log_{10}(1/2)\approx-3.01$ dB. Another rule could produce different resolution percentages, which is why the criterion is stated before the results.

For the burst, first integrate PSD over the fixed 36–44 Hz band for each frame. Estimate onset as the earliest frame centre whose band power exceeds a threshold for two consecutive frames. A per-frame threshold such as the median plus six median absolute deviations produced too many record-level opportunities for a false alarm when short windows created hundreds of frames. The implemented rule therefore calibrates the statistic actually tested: for each window length, generate 1000 independent noise-only eight-second records, retain the maximum of the smaller power in every adjacent-frame pair, and use the empirical 99th percentile of those 1000 maxima. Test trials are separate from calibration. This controls false alarms per record without treating correlated frames as independent. Define

$$
e_{t,\rm on}=\lvert\hat t_{\rm on}-3.0\ \text{s}\rvert,
\qquad
e_{t,\rm off}=\lvert\hat t_{\rm off}-3.5\ \text{s}\rvert,
$$

and

$$
e_{\rm duration}=\lvert(\hat t_{\rm off}-\hat t_{\rm on})-0.5\ \text{s}\rvert.
$$

Frame-centre threshold crossing is a defined estimator, not the physical instant at which the window first touches the burst. The distinction exposes rather than hides temporal smearing.

Add zero-mean Gaussian noise at a fixed input SNR defined from clean-signal power over the full record. Generate at least 200 seeds. Every seed must be reused across all five window lengths so comparisons are paired. For each length report bias, mean absolute error, root-mean-square error, and sample standard deviation across independent records—not across spectrogram pixels:

$$
\operatorname{bias}=\frac1R\sum_{r=1}^{R}(\hat\theta_r-\theta),
\quad
\operatorname{MAE}=\frac1R\sum_r\lvert\hat\theta_r-\theta\rvert,
$$

$$
\operatorname{RMSE}=\sqrt{\frac1R\sum_r(\hat\theta_r-\theta)^2}.
$$

The random generator, seed list, SNR convention, record endpoints, threshold calibration record, and software revision belong with the results.

### Measured synthetic results

The experiment used 200 paired Gaussian-noise trials at 0 dB whole-record SNR. Every window length received the same clean signal and noise realization for a given trial. The complete table, including bias and standard deviation for onset, offset, and duration, is [available as CSV]({{ '/experiments/article-04-stft/results/synthetic_summary.csv' | relative_url }}).

| Window | Bin spacing | Frequency MAE | Interpolated MAE | Two tones resolved | Burst onset MAE | Burst duration MAE |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 125 ms | 8 Hz | 2.000 Hz | 0.098 Hz | 0/200 | 0.004 s | 0.035 s |
| 250 ms | 4 Hz | 2.000 Hz | 0.012 Hz | 0/200 | 0.005 s | 0.076 s |
| 500 ms | 2 Hz | 0.000 Hz | 0.007 Hz | 0/200 | 0.120 s | 0.368 s |
| 1000 ms | 1 Hz | 0.000 Hz | 0.003 Hz | 200/200 | 0.253 s | 0.751 s |
| 2000 ms | 0.5 Hz | 0.000 Hz | 0.002 Hz | 200/200 | 0.502 s | 1.513 s |

The zero raw-bin error at 500 ms and longer has a narrow meaning: 30 Hz lies exactly on those DFT grids in this experiment. It does not imply zero error for an arbitrary frequency. Quadratic interpolation reduces the coarse-grid error for short windows but adds no resolving information; the 30 and 34 Hz components remain merged through 500 ms under the predeclared 3 dB-valley rule.

The time result moves in the other direction. Onset MAE is below 5 ms for the two shortest windows under this detector, then rises to about half a second for the two-second window. Duration error grows because a long window remains above threshold while it overlaps samples on both sides of the half-second burst. All 200 bursts were detected at every length, so these summaries do not hide missed trials.

![Frequency error versus window duration]({{ '/experiments/article-04-stft/results/frequency_error.svg' | relative_url }})

![Burst-onset error versus window duration]({{ '/experiments/article-04-stft/results/onset_error.svg' | relative_url }})

![Two-tone resolution versus window duration]({{ '/experiments/article-04-stft/results/two_tone_resolution.svg' | relative_url }})

The same 20-to-60 Hz switch was transformed with every length and identical $-80$ to $-5$ dB PSD colour limits. Compare the [125 ms]({{ '/experiments/article-04-stft/results/synthetic_spectrogram_125ms.svg' | relative_url }}), [250 ms]({{ '/experiments/article-04-stft/results/synthetic_spectrogram_250ms.svg' | relative_url }}), [500 ms]({{ '/experiments/article-04-stft/results/synthetic_spectrogram_500ms.svg' | relative_url }}), [1000 ms]({{ '/experiments/article-04-stft/results/synthetic_spectrogram_1000ms.svg' | relative_url }}), and [2000 ms]({{ '/experiments/article-04-stft/results/synthetic_spectrogram_2000ms.svg' | relative_url }}) outputs. The short-window ridges are broad in frequency but change close to four seconds; long-window ridges are narrow but coexist across a wider region around the switch.

![Synthetic switch spectrogram with a 500 ms Hann window]({{ '/experiments/article-04-stft/results/synthetic_spectrogram_500ms.svg' | relative_url }})

A 3D surface is deliberately omitted from the reproducible core results. It would contain the same matrix as the heatmap, while perspective would make window-to-window comparisons less direct. The CSV output supports constructing one later without rerunning the transform.

## EEG as a practical demonstration, not synthetic ground truth

Use a manageable public recording from the PhysioNet EEG Motor Movement/Imagery Dataset (EEGMMIDB), version 1.0.0. The repository's fixture is Subject S001, Run 04: a motor-imagery run supplied as EDF+ with event annotations. The source dataset contains 64 EEG channels in the international 10–10 arrangement, sampled at **160 Hz**, not 256 Hz. [R8](#r8)

The preparation script `scripts/prepare-eeg-example.mjs` decodes the EDF digital values using each channel's physical minimum, maximum, and digital calibration. It stores eight named channels—Fc3, Fc4, C3, Cz, C4, Cp3, Cp4, and Fp1—in `data/signal-processing/eeg-example.json`. Values are in microvolts according to the EDF physical-dimension field. The fixture retains the source event codes, sampling frequency, channel labels, file identity, and license.

The experiment should use the same S001 Run 04 interval for every window length. Do **not** resample merely to make the synthetic and EEG tables match. At 160 Hz, the nearest exact sample counts for the requested durations are:

| Requested duration | Samples | Actual duration | Bin spacing with $N_{\rm FFT}=L$ | 75% overlap hop |
| --- | ---: | ---: | ---: | ---: |
| 125 ms | 20 | 125 ms | 8 Hz | 5 samples |
| 250 ms | 40 | 250 ms | 4 Hz | 10 samples |
| 500 ms | 80 | 500 ms | 2 Hz | 20 samples |
| 1000 ms | 160 | 1000 ms | 1 Hz | 40 samples |
| 2000 ms | 320 | 2000 ms | 0.5 Hz | 80 samples |

For a transparent first comparison, select one channel such as C3 in advance, subtract only the mean of the displayed interval, and apply no band-pass, notch filter, artifact rejection, normalization, or resampling. Pass the microvolt samples into the same C++ STFT pipeline with the five $L$ values above. Display one-sided PSD in $\mu\text{V}^2/\text{Hz}$ and use the same fixed dB colour limits across window lengths. State that mean removal is preprocessing and retain the unmodified fixture as the source.

An optional second panel may apply a predeclared 1–45 Hz filter, but it must identify filter type, order, phase treatment, edge handling, and coefficients. It must not be visually compared with the raw panel as though window length were the only changed variable.

EEGMMIDB annotations label rest and task intervals; they do not provide exact ground truth for the onset of a particular oscillation at C3. Therefore this demonstration should compare visible concentration and smearing, not calculate “true EEG frequency error” from task labels. The synthetic signals carry the quantitative ground truth.

The experiment processed the first 30 seconds of C3 from `S001R04.edf`. The source SHA-256 is `3d161f88e1c00632585287d2ce584c2bc0f08862438eb255ea8723e00fac693d`. The native sample rate is 160 Hz; the only preprocessing was subtraction of the 30-second interval mean. All displays use $-25$ to $35$ dB $\mu\text{V}^2/\text{Hz}$, and dashed lines mark the source annotation onsets. Frame counts and analysis metadata are [recorded as CSV]({{ '/experiments/article-04-stft/results/eeg_metadata.csv' | relative_url }}).

Compare the [125 ms]({{ '/experiments/article-04-stft/results/eeg_c3_s001r04_125ms.svg' | relative_url }}), [250 ms]({{ '/experiments/article-04-stft/results/eeg_c3_s001r04_250ms.svg' | relative_url }}), [500 ms]({{ '/experiments/article-04-stft/results/eeg_c3_s001r04_500ms.svg' | relative_url }}), [1000 ms]({{ '/experiments/article-04-stft/results/eeg_c3_s001r04_1000ms.svg' | relative_url }}), and [2000 ms]({{ '/experiments/article-04-stft/results/eeg_c3_s001r04_2000ms.svg' | relative_url }}) spectrograms. Short windows produce broad, rapidly varying patches; long windows produce narrower and more persistent bands while mixing activity across a longer portion of each annotated interval.

![C3 EEG spectrogram with a 500 ms Hann window]({{ '/experiments/article-04-stft/results/eeg_c3_s001r04_500ms.svg' | relative_url }})

That is a statement about the analysis representation of this selected recording, not evidence that an annotation caused a spectral feature. The annotations provide task timing, not exact oscillatory ground truth, and a single subject/run cannot support a population or clinical claim.

## What the moving Fourier measurement can and cannot say

The STFT is not a different species of transform. It is the Fourier transform repeatedly applied after a moving multiplication. That multiplication makes time localization possible and necessarily convolves the spectrum with the window response.

Window duration, hop size, FFT size, and window shape control different parts of the result:

- $L/f_s$ controls how much measured time contributes to one coefficient.
- The window spectrum controls main-lobe and sidelobe behaviour.
- $H/f_s$ controls spacing between frame coordinates, not intrinsic resolution.
- $f_s/N_{\rm FFT}$ controls the evaluated frequency grid; padding adds no observations.
- Normalization controls what magnitude or power values mean and whether different windows can be compared.

The uncertainty relation gives a lower bound for Fourier-pair variances, not a shortcut for predicting a particular peak detector. Practical resolution must be declared and measured. The synthetic experiment can supply exact onset and frequency truth; the EEG recording supplies realism without pretending that its annotations answer a question they were not designed to answer.

That distinction is the purpose of the article's experiment. A spectrogram is persuasive because it is visual. It becomes an engineering measurement only when its window, hop, scaling, boundary policy, estimator, and ground truth are explicit.

{% include references.html %}
