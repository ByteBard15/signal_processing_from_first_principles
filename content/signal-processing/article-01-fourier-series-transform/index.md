---
title: "From Harmonics to Spectra: Deriving the Fourier Series and Fourier Transform"
subtitle: Why oscillations form coordinates for signals
slug: harmonics-to-spectra
permalink: /articles/harmonics-to-spectra/
description: "Recovering frequencies through orthogonality, following harmonic energy through convergence, and deriving a continuous spectrum by letting the period grow."
series: Signal Processing from First Principles
article_number: 1
date: 2026-10-11
updated: 2026-10-11
reading_time: 30
tags: [Fourier analysis, mathematics, engineering, interactive research]
interactive: true
next_page: /articles/samples-to-spectra/
next_title: From Samples to Spectra
references: [R1, R2]
---

## Why frequency?

Consider a measurement that follows

$$x(t)=\cos(2\pi\,2t)+0.5\cos(2\pi\,5t).$$

The time trace has unequal peaks and a shape that changes within each cycle. Yet its construction is short: a 2 Hz oscillation plus half as much of a 5 Hz oscillation. In a vibration measurement, those two frequencies might distinguish two mechanical sources; in an electrical measurement, one might be the intended signal and the other an interference component. The time trace combines their effects at each instant. A frequency description keeps the causes separate.

{% include interactive-figure.html id="fig-sinusoid-composer" experiment="composer" title="Build a waveform from oscillations" description="Change amplitude, frequency, phase, or oscillator type; add components and compare each one with their sum." caption="The sum is complicated because simple oscillations reinforce and cancel at different times. Phase changes the timing of that interference." %}

Suppose we receive only the bottom trace. **Can we determine which frequencies produced it?** Recognizing a curve by eye is fragile. We need a measurement that responds to one oscillation while rejecting others. That requirement leads to orthogonality.

For now, assume the signal repeats. Components at integer multiples of a common frequency fit into a single period; arbitrary frequencies need not share one. This distinction matters: the finite-period coordinates developed next are harmonic coordinates, not a promise that every sum in the composer has a short fundamental period.

## Functions as vectors: what does a projection measure?

In ordinary vector geometry,

$$\mathbf v=a\mathbf e_1+b\mathbf e_2.$$

If the basis vectors are orthogonal, then

$$\mathbf v\cdot\mathbf e_1=a\|\mathbf e_1\|^2,
\qquad a=\frac{\mathbf v\cdot\mathbf e_1}{\|\mathbf e_1\|^2}.$$

The dot product adds agreement along all coordinates. For functions, replace that sum by an integral over a common interval. On $[0,T]$, define

$$\langle f,g\rangle=\int_0^T f(t)\overline{g(t)}\,dt,
\qquad \|f\|^2=\int_0^T |f(t)|^2\,dt.$$

The bar means complex conjugation. For real functions it changes nothing; for complex functions it makes $\langle f,f\rangle$ a real, nonnegative quantity. We use an inner product linear in its first argument.

Two real waveforms are orthogonal when their product has as much positive signed area as negative signed area. Orthogonality does not mean that they never overlap in time. It means their **accumulated agreement is zero**.

Set $\omega_0=2\pi/T$. The product identity

$$\sin(m\omega_0t)\sin(n\omega_0t)
=\frac12\left[\cos((m-n)\omega_0t)-\cos((m+n)\omega_0t)\right]$$

explains the cancellation. For distinct positive integers $m,n$, both cosines complete an integer number of cycles on $[0,T]$, so both integrals vanish. When $m=n$, the first term is the constant 1, giving

$$\int_0^T\sin^2(n\omega_0t)\,dt=\frac T2.$$

The same calculation gives $T/2$ for cosine self-products and zero for distinct cosine harmonics and all sine–cosine products. The constant function is also orthogonal to every nonzero harmonic.

{% include interactive-figure.html id="fig-frequency-probe" experiment="probe" title="A coefficient as a frequency measurement" description="Sweep the cosine probe frequency and change the integration interval; watch the product accumulate." caption="The hidden signal is cos(2π·3t) + 0.5 sin(2π·5t). A cosine probe finds the 3 Hz term but is blind to the 5 Hz sine quadrature over integer-second intervals." %}

At 3 Hz, multiplying by the probe produces a constant positive contribution as well as oscillatory terms. At a different integer frequency, only cancelling terms remain. At a noninteger frequency, cancellation over one second is generally incomplete. Orthogonality belongs to a **basis and interval together**; it is not a property of any two unequal real frequencies over any finite record.

A single cosine probe can also miss a present frequency because of phase. A sine probe provides the other quadrature. Later, a complex probe will measure both simultaneously.

## Deriving the Fourier series

For a $T$-periodic signal, try coordinates in the trigonometric family:

$$x(t)=\frac{a_0}{2}+\sum_{n=1}^{\infty}
\left[a_n\cos(n\omega_0t)+b_n\sin(n\omega_0t)\right].$$

Why these coefficients? Begin with a finite sum, where exchanging sums and integrals is unproblematic. Multiply by $\cos(m\omega_0t)$ and integrate over one period. Every sine, the constant, and every cosine except the $m$th disappear:

$$\int_0^T x(t)\cos(m\omega_0t)\,dt=a_m\frac T2.$$

Therefore, for $m\ge1$,

$$a_m=\frac2T\int_0^T x(t)\cos(m\omega_0t)\,dt,
\qquad b_m=\frac2T\int_0^T x(t)\sin(m\omega_0t)\,dt.$$

Integrating against the constant function gives

$$a_0=\frac2T\int_0^T x(t)\,dt.$$

Thus $a_0/2$ is the average value. The division by $T/2$ in the other coefficients is exactly the division by squared basis length in vector projection.

For an infinite representation, we need more than orthogonality. An orthogonal family could omit an entire direction. The trigonometric family is **complete in $L^2[0,T]$**: finite harmonic sums are dense among square-integrable periodic functions. This is the mathematical reason the projection residual can be made arbitrarily small in mean square. One route to that result approximates continuous periodic functions by trigonometric polynomials (for example through averaged Fourier sums), then uses the density of continuous functions in $L^2$. We use this completeness result without developing approximation theory. [R1](#r1)

For a smooth check, take

$$x(t)=1+0.8\cos(\omega_0t)-0.3\sin(2\omega_0t).$$

Projection returns $a_0=2$, $a_1=0.8$, $b_2=-0.3$, with all other coefficients zero. Nothing was fitted by a nonlinear optimizer: each coefficient was recovered independently.

Now consider a unit square wave on a symmetric period:

$$x(t)=\begin{cases}-1,&-T/2<t<0,\\1,&0<t<T/2,\end{cases}
\qquad x(t+T)=x(t).$$

Odd symmetry makes every $a_n$ zero, including the mean. Since the sine product is even,

$$\begin{aligned}
b_n&=\frac4T\int_0^{T/2}\sin(n\omega_0t)\,dt\\
&=\frac4{Tn\omega_0}\left[1-\cos(n\pi)\right]\\
&=\frac2{n\pi}\left[1-(-1)^n\right].
\end{aligned}$$

Only odd harmonics survive:

$$x(t)\sim\frac4\pi\left[\sin(\omega_0t)+\frac13\sin(3\omega_0t)+\frac15\sin(5\omega_0t)+\cdots\right].$$

The symbol $\sim$ is deliberate until we say what equality/convergence means at a jump. A square wave's fundamental alone is not its shape. Its higher odd frequencies construct the transition and flatten the plateau.

## Reconstructing a waveform from its coordinates

Define the partial sum using harmonic indices through $N$:

$$S_N(t)=\frac{a_0}{2}+\sum_{n=1}^N
\left[a_n\cos(n\omega_0t)+b_n\sin(n\omega_0t)\right].$$

For the square wave, even coefficients are zero. Increasing $N$ from 7 to 8 therefore changes nothing; $N$ is the highest permitted index, not the number of nonzero terms.

{% include interactive-figure.html id="fig-fourier-reconstruction" experiment="series" title="Reconstruct with increasingly fine harmonics" description="Increase the highest harmonic or switch between square, triangle, and sawtooth targets." caption="The period is one second. The approximation uses the exact analytic sine coefficients for each target, without numerical curve fitting." %}

The triangle option has

$$b_n=\begin{cases}\dfrac8{\pi^2n^2}(-1)^{(n-1)/2},&n\text{ odd},\\0,&n\text{ even},\end{cases}$$

for the triangle that rises from zero to 1 at $T/4$. The centered rising sawtooth has $b_n=2(-1)^{n+1}/(\pi n)$. These examples separate two effects: the presence of a jump and the rate of coefficient decay. A continuous triangle has slope corners but its $1/n^2$ coefficients decrease faster than the $1/n$ coefficients of either discontinuous waveform. A few triangle harmonics can already give a strong approximation.

## What does convergence mean?

At a fixed time $t$, **pointwise convergence** means $S_N(t)$ approaches a specific value as $N$ grows. For periodic functions with bounded variation, including our piecewise-smooth examples, the Fourier series approaches

$$\frac{x(t^-)+x(t^+)}2.$$

At a continuous point that is $x(t)$. At the square wave's rising jump, it is zero, irrespective of how we chose to define the isolated sample $x(0)$. This is one reason a discontinuous function should not be described as uniformly approximated by continuous harmonic sums. [R1](#r1)

**Mean-square convergence** asks a different question:

$$\frac1T\int_0^T |x(t)-S_N(t)|^2\,dt\longrightarrow0.$$

It controls the total squared error over a period rather than the worst error at any instant. Changing a function at a single point changes neither its Fourier integrals nor this error. “Almost everywhere” means except on a set of zero measure; our finite set of jumps is an example. We do not need a general pointwise-convergence theorem for arbitrary $L^2$ functions here.

For engineering, mean-square convergence says the retained harmonics increasingly capture the signal's mean-square content. It does **not** say the largest transient error decreases to zero. For a smooth finite harmonic signal, reconstruction can become exact. For a square wave, a narrow region near each jump continues to behave differently from the plateau.

## Gibbs: a narrower error is not a smaller peak

{% include interactive-figure.html id="fig-gibbs" experiment="gibbs" title="Zoom into a discontinuity" description="Increase harmonic count and narrow the time interval around the rising edge; compare peak height with ringing width." caption="The square wave jumps from −1 to +1. Overshoot is reported as a fraction of that jump, not as a fraction of the upper plateau." %}

The overshoot approaches about **8.95% of the jump**, so the upper peak tends toward approximately $1+2(0.08949)=1.17898$. More harmonics compress the ringing toward the discontinuity. They do not drive this moving peak to 1. At every fixed point away from the jump, the limiting behavior is still correct. [R1](#r1)

We can see where the constant comes from. For our square-wave partial sum,

$$S_N(t)=\frac4\pi\sum_{\substack{1\le n\le N\\n\text{ odd}}}\frac{\sin(2\pi nt/T)}n.$$

Inspect a shrinking neighborhood by setting $t=T\alpha/(2\pi N)$. With odd harmonic spacing approximately $2/N$, the sum approaches

$$\frac2\pi\int_0^1\frac{\sin(\alpha u)}u\,du
=\frac2\pi\operatorname{Si}(\alpha).$$

Its first maximum is at $\alpha=\pi$, since the derivative is $(2/\pi)\sin\alpha/\alpha$. The peak is $2\operatorname{Si}(\pi)/\pi\approx1.17898$. The position moves like $1/N$, but its height has a nontrivial limit. This moving-neighborhood calculation reconciles persistent overshoot with pointwise convergence.

A bandwidth limit cannot reproduce an infinitely sharp transition. The abrupt truncation of Fourier coordinates also introduces oscillatory reconstruction behavior. Ringing in actual measurement/filtering chains depends on their response, so the exact Gibbs constant is not a universal instrument specification; the useful connection is that sharp edges and bandwidth restrictions demand attention to transients.

## Why complex exponentials?

Euler's identity packages both quadratures into rotation:

$$e^{j\theta}=\cos\theta+j\sin\theta,$$

$$\cos\theta=\frac{e^{j\theta}+e^{-j\theta}}2,
\qquad \sin\theta=\frac{e^{j\theta}-e^{-j\theta}}{2j}.$$

Substitute these into each trigonometric term. The positive and negative exponentials have coefficients

$$C_n=\frac{a_n-jb_n}{2},\qquad C_{-n}=\frac{a_n+jb_n}{2},\qquad C_0=\frac{a_0}{2}.$$

We obtain one family instead of separate sine and cosine families:

$$x(t)=\sum_{k=-\infty}^{\infty}C_k e^{jk\omega_0t}.$$

Their inner products are particularly short:

$$\int_0^T e^{jk\omega_0t}\overline{e^{jm\omega_0t}}\,dt
=\int_0^T e^{j(k-m)\omega_0t}\,dt
=\begin{cases}T,&k=m,\\0,&k\ne m.\end{cases}$$

Projecting and dividing by $T$ therefore gives

$$C_k=\frac1T\int_0^T x(t)e^{-jk\omega_0t}\,dt.$$

The real part of this integral measures cosine agreement; the negative imaginary part measures sine agreement. The complex coefficient stores both amplitude and phase.

{% include interactive-figure.html id="fig-complex-frequency" experiment="complex" title="Opposite rotations make a real oscillation" description="Sweep rotation phase and follow the positive and negative phasors and their projections." caption="The conjugate average (e^{jθ}+e^{−jθ})/2 is real. The phase slider supplies a controllable clock without automatic animation." %}

Positive frequency rotates counterclockwise in the complex plane; negative frequency rotates clockwise. A real cosine is the average of both rotations. There is no negative number of physical cycles passing a sensor. The sign identifies the direction of a mathematical rotation whose projection can be a real measurement.

If $x(t)$ is real, conjugating the coefficient integral gives

$$\overline{C_k}=\frac1T\int_0^T x(t)e^{jk\omega_0t}\,dt=C_{-k}.$$

Thus negative coefficients are redundant for real signals, but retaining them makes algebra uniform. A real cosine of amplitude $A$ and phase $\phi$ has $C_1=(A/2)e^{j\phi}$ and $C_{-1}=(A/2)e^{-j\phi}$. Mistaking either coefficient magnitude $A/2$ for the full cosine amplitude loses a factor of two.

## Parseval: frequency coordinates preserve mean-square content

For a finite complex sum, multiply it by its conjugate and average over a period:

$$\begin{aligned}
\frac1T\int_0^T|S_N(t)|^2\,dt
&=\sum_{k=-N}^N\sum_{m=-N}^N C_k\overline{C_m}
\frac1T\int_0^T e^{j(k-m)\omega_0t}\,dt\\
&=\sum_{k=-N}^N|C_k|^2.
\end{aligned}$$

Orthogonality eliminates all cross terms. Completeness and mean-square convergence extend this to

$$\frac1T\int_0^T|x(t)|^2\,dt
=\sum_{k=-\infty}^{\infty}|C_k|^2
=\frac{a_0^2}{4}+\frac12\sum_{n=1}^{\infty}(a_n^2+b_n^2)$$

for real $x$. This is mean-square amplitude, often proportional to average physical power after the relevant impedance/unit conversion. A nonzero periodic waveform normally has infinite total energy on the entire time axis, so we use **power per period**, not finite total energy.

{% include interactive-figure.html id="fig-parseval" experiment="parseval" title="Account for power harmonic by harmonic" description="Include more square-wave harmonics and compare individual power contributions with their cumulative sum." caption="A ±1 square wave has mean-square amplitude 1. The first harmonic alone carries 8/π² ≈ 0.811 of that total." %}

Because the residual is orthogonal to retained coordinates,

$$\frac1T\int_0^T |x-S_N|^2\,dt
=\frac1T\int_0^T |x|^2\,dt-\sum_{k=-N}^N|C_k|^2.$$

The cumulative bar display therefore measures captured content, not just visual resemblance. It also makes the convergence/Gibbs distinction quantitative: missing energy tends to zero while a local peak remains.

## What if the signal never repeats?

Take a localized pulse $x(t)$ that vanishes outside a fixed finite interval. Place it in $[-T/2,T/2]$, with $T$ larger than its support, and repeat that interval periodically. Call the result $x_T(t)$.

Its complex coefficients are

$$C_k^{(T)}=\frac1T\int_{-T/2}^{T/2}x(t)e^{-j\omega_k t}\,dt,
\qquad \omega_k=k\Delta\omega,\quad\Delta\omega=\frac{2\pi}{T}.$$

For the compactly supported pulse, the integral is already over its entire nonzero domain. Define

$$X(\omega)=\int_{-\infty}^{\infty}x(t)e^{-j\omega t}\,dt.$$

Then $C_k^{(T)}=X(\omega_k)/T$. Reinsert that relation into the series:

$$\begin{aligned}
x_T(t)&=\sum_{k=-\infty}^{\infty}\frac1T X(\omega_k)e^{j\omega_k t}\\
&=\frac1{2\pi}\sum_{k=-\infty}^{\infty}X(\omega_k)e^{j\omega_k t}\,\Delta\omega.
\end{aligned}$$

This is a Riemann-sum form. Increasing $T$ does two things together: the pulse replicas move apart in time, and the frequency grid spacing $\Delta\omega$ decreases. On a fixed observation interval, the periodic waveform eventually contains only the central pulse. In frequency, the increasingly dense sum motivates

$$\boxed{x(t)=\frac1{2\pi}\int_{-\infty}^{\infty}X(\omega)e^{j\omega t}\,d\omega.}$$

{% include interactive-figure.html id="fig-fourier-limit" experiment="limit" title="Let the period grow toward infinity" description="Increase T; watch pulse copies separate and spectral lines fill the transform envelope. Toggle the limiting curve." caption="The pulse has width one second. Lines show T C_k = X(kΔω); their spacing is Δω = 2π/T. This scaling keeps the limiting envelope visible." %}

The Fourier series has countably many harmonic coordinates. The Fourier transform has a continuous frequency variable: $X(\omega)$ is a density of complex amplitude, and $d\omega/(2\pi)$ supplies the reconstruction weight. A single value of $X$ is not the amplitude of a finite-width frequency band.

This argument motivates the limit; arbitrary improper integrals cannot be interchanged without hypotheses. For sufficiently well-behaved integrable signals and transforms, inversion is an ordinary integral. For a rectangular pulse, whose transform is not absolutely integrable, interpret inversion through symmetric frequency cutoffs; it recovers the midpoint at a jump. For general finite-energy signals, the transform/inverse extend in the $L^2$ sense. Pure eternal sinusoids require a distributional transform, not a convergent ordinary integral. [R2](#r2)

Our convention throughout the series is

$$X(\omega)=\int x(t)e^{-j\omega t}\,dt,
\qquad x(t)=\frac1{2\pi}\int X(\omega)e^{j\omega t}\,d\omega.$$

Here $\omega$ is in **rad/s**, and $f=\omega/(2\pi)$ is in **Hz**. If we plot $X(2\pi f)$ against Hz, inversion instead integrates $X(2\pi f)e^{j2\pi ft}\,df$. The axis conversion changes the measure; it is not an extra amplitude factor in the forward transform.

## Two transform pairs worth reasoning through

### Rectangle: a time edge creates a broad sinc

For a centered unit-height pulse of width $\tau$,

$$\begin{aligned}
X(\omega)&=\int_{-\tau/2}^{\tau/2}e^{-j\omega t}\,dt\\
&=\frac{e^{j\omega\tau/2}-e^{-j\omega\tau/2}}{j\omega}
=\frac{2\sin(\omega\tau/2)}{\omega}\\
&=\tau\operatorname{sinc}\!\left(\frac{\omega\tau}{2\pi}\right),
\end{aligned}$$

where $\operatorname{sinc}(u)=\sin(\pi u)/(\pi u)$ and $\operatorname{sinc}(0)=1$. The DC value is its area $\tau$. The zeros occur at $\omega=2\pi m/\tau$ for nonzero integer $m$. Increasing pulse width compresses the spectrum; the jump edges produce a slowly decaying $1/|\omega|$ envelope.

{% include interactive-figure.html id="fig-rectangle-transform" experiment="rectangle" title="Pulse width, spectral width, and shift phase" description="Change pulse width and move its center in time; compare transform magnitude with real and imaginary parts." caption="A time shift multiplies the transform by e^{−jωt₀}. The magnitude stays fixed even though the real and imaginary parts change." %}

### Gaussian: smooth in time, smooth in frequency

Let $g(t)=e^{-t^2/(2\sigma^2)}$. We can derive its transform without integrating a complex completed square. Write $G(\omega)=\int g(t)e^{-j\omega t}\,dt$. Since $g'(t)=-t g(t)/\sigma^2$ and the boundary terms vanish,

$$\mathcal F\{g'\}=j\omega G,
\qquad G'(\omega)=-j\int t g(t)e^{-j\omega t}\,dt=-\sigma^2\omega G(\omega).$$

Solving this differential equation and using the Gaussian area $G(0)=\sqrt{2\pi}\sigma$ gives

$$G(\omega)=\sqrt{2\pi}\sigma e^{-\sigma^2\omega^2/2}.$$

The transform decays exponentially in $\omega^2$. A narrow Gaussian still needs a broad spectrum, but its smooth tails are qualitatively different from a rectangle's sidelobes. Neither pulse is perfectly bandlimited; an engineering bandwidth must include a stated tolerance.

{% include interactive-figure.html id="fig-gaussian-transform" experiment="gaussian" title="Smoothness and frequency translation" description="Change Gaussian width and apply real cosine modulation; observe how the envelope moves into two spectral copies." caption="Multiplication by cos(Ωt) gives [G(ω−Ω)+G(ω+Ω)]/2. Real modulation needs a conjugate pair of shifts." %}

## Properties to carry into a measurement system

Each property is a consequence of the same integral, not an independent rule to memorize.

**Linearity.** Pulling constants and sums through the integral gives $\mathcal F\{ax+by\}=aX+bY$. It lets us predict a composite signal from its component spectra.

**Time shift.** Substitute $u=t-t_0$:

$$\int x(t-t_0)e^{-j\omega t}\,dt
=e^{-j\omega t_0}\int x(u)e^{-j\omega u}\,du.$$

Delay changes phase, not magnitude. A magnitude-only display therefore loses timing information.

**Frequency shift.** Combining exponentials shows

$$\mathcal F\{x(t)e^{j\Omega t}\}=X(\omega-\Omega).$$

The Gaussian experiment uses the real-cosine version, a sum of two such shifts. This is the basic geometry of modulation.

**Time scaling.** With $u=at$ and the orientation accounted for when $a<0$,

$$\mathcal F\{x(at)\}=\frac1{|a|}X(\omega/a),\qquad a\ne0.$$

Compressing a pulse expands its spectral width and reduces its area. The prefactor is essential; scaling the frequency axis alone gives the wrong DC value.

**Conjugation and reality.** Directly conjugating the integral gives

$$\mathcal F\{\overline{x(t)}\}=\overline{X(-\omega)}.$$

For real $x$, $X(-\omega)=\overline{X(\omega)}$. Magnitude is even; phase is odd wherever a consistent phase is defined.

**Energy.** Insert the inverse transform into the inner product and use the forward definition to obtain, under appropriate integrability or by $L^2$ extension,

$$\int_{-\infty}^{\infty}|x(t)|^2\,dt
=\frac1{2\pi}\int_{-\infty}^{\infty}|X(\omega)|^2\,d\omega.$$

This is the finite-energy counterpart of periodic Parseval. The $1/(2\pi)$ follows our convention. For a rectangle, time energy is $\tau$; integrating the squared sinc with this factor gives the same result.

**Differentiation.** Integration by parts, with vanishing boundary terms, gives $\mathcal F\{x'\}=j\omega X$. Smoothness constrains high-frequency content: where enough derivatives are integrable, repeated integration by parts supplies faster decay. The rectangle lacks an ordinary integrable first derivative; its jumps explain why that smooth argument fails.

{% include callout.html type="note" title="Going further: complex frequency" content="The bilateral Laplace transform inserts exponential weighting and extends the frequency variable to a complex quantity. A Fourier transform corresponds to the imaginary-axis evaluation only when the relevant convergence conditions hold. See [NIST's integral-transform reference](https://dlmf.nist.gov/1.14) for the broader formulation." %}

## The unresolved measurement problem

We now know why projections extract harmonics, why complex coordinates preserve phase, and why increasing the period produces a continuous spectrum. But all the integrals assumed access to a continuous function over an ideal mathematical domain.

A measurement system gives us something smaller: an ADC's samples, a finite buffer, and a sampling clock. What becomes of the spectrum when time itself becomes discrete? Do frequency coordinates still distinguish different analog sources?

[From Samples to Spectra]({{ '/articles/samples-to-spectra/' | relative_url }}) begins with that loss of information, then follows its consequences through aliasing, the periodic DTFT, the DFT, and practical FFT analysis.

{% include references.html %}
