---
title: "From Harmonics to Spectra: Deriving the Fourier Series and Fourier Transform"
subtitle: Why oscillations form coordinates for signals
slug: harmonics-to-spectra
permalink: /articles/harmonics-to-spectra/
description: "Recovering frequencies through orthogonality, deriving waveform expansions and their convergence, and following a continuous spectrum through a measurement response."
series: Signal Processing from First Principles
article_number: 1
date: 2026-10-11
updated: 2026-10-12
reading_time: 45
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

But why should an idea from perpendicular arrows apply to a continuous waveform? A dot product adds agreement across a vector's coordinates. A function has a value at every time in an interval, so the analogous operation integrates that agreement across time.

Take **two functions**, $f(t)$ and $g(t)$, defined on the same interval. They are separate inputs: $g$ is not assumed to be $f$, nor to be the conjugate of $f$. In a frequency measurement, $f$ could be the unknown signal and $g$ a sinusoid we deliberately choose as a probe. On $[0,T]$, define

$$\langle f,g\rangle=\int_0^T f(t)\overline{g(t)}\,dt,
\qquad \|f\|^2=\int_0^T |f(t)|^2\,dt.$$

The notation $\langle f,g\rangle$ names the result of that comparison. Inside the integral, we multiply $f(t)$ by the **conjugate of the second function**, $\overline{g(t)}$. The conjugation is an operation applied to $g$; it does not define what $g$ must be.

For real functions, conjugation changes nothing. When we choose $g=f$, the product becomes $f(t)\overline{f(t)}=\lvert f(t)\rvert ^2$, making $\langle f,f\rangle$ real and nonnegative. This is the function version of squared vector length. Its square root is the norm:

$$\|f\|_2=\left(\int_0^T|f(t)|^2\,dt\right)^{1/2}.$$

We use an inner product linear in its first argument. For example, if $f(t)=e^{j\omega_0t}$ and we choose $g(t)=e^{j\omega_0t}$, the integrand is $e^{j\omega_0t}e^{-j\omega_0t}=1$, and the inner product is $T$. Choosing a different harmonic as $g$ will instead produce cancellation.

Two real waveforms are orthogonal when their product has as much positive signed area as negative signed area. Orthogonality does not mean that they never overlap in time. It means their **accumulated agreement is zero**.

Set $\omega_0=2\pi/T$. The product identity

$$\sin(m\omega_0t)\sin(n\omega_0t)
=\frac12\left[\cos((m-n)\omega_0t)-\cos((m+n)\omega_0t)\right]$$

explains the cancellation. For distinct positive integers $m,n$, both cosines complete an integer number of cycles on $[0,T]$, so both integrals vanish. When $m=n$, the first term is the constant 1, giving

$$\int_0^T\sin^2(n\omega_0t)\,dt=\frac T2.$$

For a concrete check with $T=1$ s, the 3 Hz and 5 Hz sines satisfy

$$\begin{aligned}
\int_0^1\sin(6\pi t)\sin(10\pi t)\,dt
&=\frac12\int_0^1[\cos(4\pi t)-\cos(16\pi t)]\,dt\\
&=\left[\frac{\sin(4\pi t)}{8\pi}-\frac{\sin(16\pi t)}{32\pi}\right]_0^1=0.
\end{aligned}$$

Compare that with $\int_0^1\sin^2(6\pi t)\,dt=1/2$: a harmonic agrees with itself. The same calculation gives $T/2$ for cosine self-products and zero for distinct cosine harmonics and all sine–cosine products. The constant function is also orthogonal to every nonzero harmonic. The [short proofs section](#short-proofs-and-coefficient-checks) collects these remaining identities and a worked coefficient calculation.

{% include interactive-figure.html id="fig-frequency-probe" experiment="probe" title="A coefficient as a frequency measurement" description="Sweep probe frequency, switch between cosine and sine, and change the integration interval; watch the product accumulate." caption="The hidden signal is cos(2π·3t) + 0.5 sin(2π·5t). Over one second the 3 Hz cosine probe accumulates 0.5; the 5 Hz sine probe accumulates 0.25." %}

At 3 Hz over one second, the cosine probe produces $\int_0^1 x(t)\cos(6\pi t)dt=1/2$. At 4 Hz it gives zero. At 5 Hz a cosine probe also gives zero, although a 5 Hz sine is present: its phase is in the other quadrature. A sine probe would give $\int_0^1x(t)\sin(10\pi t)dt=1/4$.

At a noninteger frequency, cancellation over one second is generally incomplete. Orthogonality belongs to a **basis and interval together**; it is not a property of any two unequal real frequencies over any finite record.

A single cosine probe can also miss a present frequency because of phase. A sine probe provides the other quadrature. Later, a complex probe will measure both simultaneously.

## Deriving the Fourier series

For a $T$-periodic signal, try coordinates in the trigonometric family:

$$x(t)=\frac{a_0}{2}+\sum_{n=1}^{\infty}
\left[a_n\cos(n\omega_0t)+b_n\sin(n\omega_0t)\right].$$

Why these coefficients? Begin with a finite sum, where exchanging sums and integrals is unproblematic. Multiply by $\cos(m\omega_0t)$ and integrate over one period. Every sine, the constant, and every cosine except the $m$th disappear:

$$\int_0^T x(t)\cos(m\omega_0t)\,dt=a_m\frac T2.$$

Multiplying by $\sin(m\omega_0t)$ instead leaves $b_m T/2$: all cosines and the other sines integrate to zero. Therefore, for $m\ge1$,

$$a_m=\frac2T\int_0^T x(t)\cos(m\omega_0t)\,dt,
\qquad b_m=\frac2T\int_0^T x(t)\sin(m\omega_0t)\,dt.$$

What about the zero-frequency coefficient? Integrating the series without a sinusoidal multiplier kills every oscillatory term:

$$\int_0^T x(t)\,dt=\int_0^T\frac{a_0}{2}\,dt=\frac{a_0T}{2}.$$

Hence

$$a_0=\frac2T\int_0^T x(t)\,dt.$$

Thus $a_0/2$ is the average value. There is no independent $b_0$ to recover: $\sin(0\omega_0t)=0$ everywhere, so a zero-index sine contributes nothing. The convention starts $b_n$ at $n=1$; assigning $b_0=0$ is only bookkeeping. The division by $T/2$ in the other coefficients is exactly the division by squared basis length in vector projection.

### Is an orthogonal family enough?

Two perpendicular vectors in three-dimensional space still miss the third direction. Likewise, being able to isolate each harmonic does not yet show that harmonics can represent every signal we care about. **Orthogonality separates coordinates; completeness says there are enough coordinates.**

The relevant space is $L^2[0,T]$: functions whose squared magnitude has a finite integral over a period. Functions that differ only on a set of zero measure represent the same element of this space, since integrals cannot distinguish them. A change at one isolated instant is an example.

The family

$$1,\quad\cos(\omega_0t),\quad\sin(\omega_0t),\quad\cos(2\omega_0t),\quad\sin(2\omega_0t),\quad\ldots$$

is complete in this space. This means that for every such $x$ and every $\varepsilon>0$, some finite trigonometric polynomial $p$ satisfies

$$\|x-p\|_2<\varepsilon.$$

That statement is also called **density**. It does not assert that one finite sum equals an arbitrary waveform; it asserts that no nonzero error direction remains permanently beyond the family.

Why does this justify the particular Fourier partial sums, rather than merely some approximation? $S_N$ is the orthogonal projection onto the harmonics through $N$, so it has the smallest squared error among all sums using those harmonics. Once $N$ includes the degree of $p$, $\|x-S_N\|_2\le\|x-p\|_2<\varepsilon$. Thus the Fourier partial sums converge in this norm. The [projection proof](#why-projection-gives-the-smallest-squared-error) spells out this step.

One route to completeness approximates continuous periodic functions uniformly with trigonometric polynomials, for example through **Fejér means**, which average successive partial sums. Continuous periodic functions are themselves dense in $L^2$, extending the approximation result to square-integrable data. We accept that completeness theorem here; it supplies a precise guarantee without turning this article into approximation theory. [R1](#r1)

For a smooth check, take

$$x(t)=1+0.8\cos(\omega_0t)-0.3\sin(2\omega_0t).$$

Projection returns $a_0=2$, $a_1=0.8$, $b_2=-0.3$, with all other coefficients zero. Nothing was fitted by a nonlinear optimizer: each coefficient was recovered independently.

### Worked example: define the square wave before expanding it

Let $s_\square(t)$ be a unit square wave on a symmetric period:

$$s_\square(t)=\begin{cases}-1,&-T/2<t<0,\\0,&t=0\text{ or }t=\pm T/2,\\1,&0<t<T/2,\end{cases}
\qquad s_\square(t+T)=s_\square(t).$$

The zeros at jumps choose their midpoints; changing those isolated values would leave every coefficient unchanged. The notation $s_\square$ names the target signal, while $S_N^\square$ will name a finite approximation.

Odd symmetry gives $a_0=(2/T)\int_{-T/2}^{T/2}s_\square(t)dt=0$. Since a cosine is even, $s_\square(t)\cos(n\omega_0t)$ is odd, giving $a_n=0$. A sine is odd, so the sine product is even. Therefore

$$\begin{aligned}
b_n&=\frac4T\int_0^{T/2}\sin(n\omega_0t)\,dt\\
&=\frac4{Tn\omega_0}\left[1-\cos(n\pi)\right]\\
&=\frac2{n\pi}\left[1-(-1)^n\right].
\end{aligned}$$

Only odd harmonics survive:

$$s_\square(t)\sim\frac4\pi\sum_{r=0}^{\infty}\frac{\sin((2r+1)\omega_0t)}{2r+1}
=\frac4\pi\left[\sin(\omega_0t)+\frac13\sin(3\omega_0t)+\frac15\sin(5\omega_0t)+\cdots\right].$$

The symbol $\sim$ is deliberate until we say what equality/convergence means at a jump. A square wave's fundamental alone is not its shape. Its higher odd frequencies construct the transition and flatten the plateau.

## Reconstructing a waveform from its coordinates

Define the partial sum using harmonic indices through $N$:

$$S_N(t)=\frac{a_0}{2}+\sum_{n=1}^N
\left[a_n\cos(n\omega_0t)+b_n\sin(n\omega_0t)\right].$$

For the square wave, even coefficients are zero. Increasing $N$ from 7 to 8 therefore changes nothing; $N$ is the highest permitted index, not the number of nonzero terms.

{% include interactive-figure.html id="fig-fourier-reconstruction" experiment="series" title="Reconstruct with increasingly fine harmonics" description="Increase the highest harmonic or switch between square, triangle, and sawtooth targets." caption="The period is one second. The approximation uses the exact analytic sine coefficients for each target, without numerical curve fitting." %}

### Worked example: a continuous triangle

The triangle option is a different target. Define it on one centered period by

$$s_\triangle(t)=\begin{cases}
-2-4t/T,&-T/2\le t<-T/4,\\
4t/T,&-T/4\le t\le T/4,\\
2-4t/T,&T/4<t\le T/2,
\end{cases}\qquad s_\triangle(t+T)=s_\triangle(t).$$

It passes through $0,-1,0,+1,0$ at $-T/2,-T/4,0,T/4,T/2$. It is odd and continuous, so again $a_0=a_n=0$. This time the positive half-period consists of two ramps:

$$b_n=\frac4T\left[\int_0^{T/4}\frac{4t}{T}\sin(n\omega_0t)\,dt
+\int_{T/4}^{T/2}\left(2-\frac{4t}{T}\right)\sin(n\omega_0t)\,dt\right].$$

Write $\lambda=n\omega_0$. Integration by parts replaces the ramps with their constant slopes; the endpoint terms vanish at $0,T/2$ and cancel at $T/4$:

$$\begin{aligned}
b_n&=\frac{16}{T^2\lambda}\left[\int_0^{T/4}\cos(\lambda t)dt-\int_{T/4}^{T/2}\cos(\lambda t)dt\right]\\
&=\frac{16}{T^2\lambda^2}\left[2\sin(\lambda T/4)-\sin(\lambda T/2)\right]\\
&=\frac8{\pi^2n^2}\sin(n\pi/2).
\end{aligned}$$

Since $\sin(n\pi/2)$ alternates between $1,0,-1,0$, this is

$$b_n=\begin{cases}\dfrac8{\pi^2n^2}(-1)^{(n-1)/2},&n\text{ odd},\\0,&n\text{ even},\end{cases}$$

and the full expansion is

$$s_\triangle(t)=\frac8{\pi^2}\sum_{r=0}^{\infty}\frac{(-1)^r}{(2r+1)^2}\sin((2r+1)\omega_0t).$$

The coefficients are absolutely summable, so this series converges uniformly to the continuous triangle. A slope corner is less demanding than a jump: coefficients decrease as $1/n^2$, rather than the square wave's $1/n$.

If we instead mean a **right-triangular ramp with a reset**, that is the sawtooth option: $s_{\rm ramp}(t)=2t/T$ for $-T/2<t<T/2$, repeated periodically. The [ramp calculation](#a-ramp-with-a-reset) gives $b_n=2(-1)^{n+1}/(\pi n)$. The reset is a jump, so its spectral tail resembles the square wave's more than the continuous triangle's. The waveform definition, not the word “triangle,” determines the coefficients.

## What does convergence mean?

Adding harmonics improves the reconstruction, but “improves” needs a target. Are we checking one voltage at one instant, the average squared error across a period, or the worst error anywhere? Those are different questions, and a signal can satisfy one requirement while failing another.

### Pointwise: stay at one instant

Choose a time $t_\ast$ and keep it fixed as $N$ grows. **Pointwise convergence** asks whether $S_N(t_\ast)$ tends to the target value at that instant. For periodic functions with bounded variation, including our piecewise-smooth examples,

$$\lim_{N\to\infty}S_N(t)=\frac{x(t^-)+x(t^+)}2.$$

Here $x(t^-)$ and $x(t^+)$ are the limiting values from the left and right. At a continuous point both equal $x(t)$. At the square wave's rising jump, the limit is $(-1+1)/2=0$. It does not depend on whether we assigned $x(0)$ to be 0, 1, or something else: a single point contributes no area to the coefficient integrals. [R1](#r1)

Try $t_\ast=T/4$, on the square wave's positive plateau. The partial sums there approach 1, although successive errors need not decrease monotonically. Now try $t_\ast=0$: every sine term is zero, so every partial sum is already zero. Neither experiment follows a moving overshoot peak.

### Mean-square: account for error over the whole period

Define

$$E_N=\frac1T\int_0^T |x(t)-S_N(t)|^2\,dt.$$

The difference is the error at each instant. Squared magnitude makes every contribution nonnegative: errors of $+2$ and $-2$ contribute 4 each, instead of cancelling. Integration adds the contributions across a period, and division by $T$ makes this a mean. In norm notation, $E_N=\|x-S_N\|_2^2/T$.

**Mean-square convergence** is $E_N\to0$. Completeness gives this guarantee for square-integrable periodic signals. It does not imply that the error at every individual time decreases, or that the largest error becomes small. Near a square-wave jump, a sizable error can occupy an increasingly narrow region and contribute increasingly little to the integral. Later, Parseval will let us calculate $E_N$ from the omitted harmonics.

Changing isolated values affects neither this integral nor the coefficients. “Almost everywhere” means except on a set of zero measure; a finite collection of jumps is one such set. For our piecewise-smooth examples, the pointwise limit equals the original waveform almost everywhere. We need not invoke a general pointwise theorem for arbitrary $L^2$ functions to analyze these examples.

### Uniform: require one bound to work everywhere

Uniform convergence demands

$$\sup_{t\in[0,T]}|x(t)-S_N(t)|\longrightarrow0.$$

The supremum is the worst attainable or arbitrarily approachable error. This stronger requirement cannot hold for a discontinuous square wave: every finite harmonic sum is continuous, and a uniform limit of continuous functions is continuous. We give the short continuity argument [below](#why-a-jump-rules-out-uniform-convergence).

| Requirement | What stays fixed or is measured? | Engineering question |
| --- | --- | --- |
| Pointwise | One chosen instant | Is this particular sample-time value approached? |
| Mean-square | Integrated squared error over a period | Is the remaining mean-square content small? |
| Uniform | Worst error over all instants | Can one tolerance bound every transient? |

A signal that is already a finite harmonic sum can be reproduced exactly once the required harmonics are included. The continuous triangle can converge uniformly. A square wave converges in mean square and to the appropriate pointwise values, while retaining a difficult boundary layer around each jump. That is a precise description of what the approximation can achieve, not a defect in the coefficient calculation.

## Gibbs: a narrower error is not a smaller peak

{% include interactive-figure.html id="fig-gibbs" experiment="gibbs" title="Zoom into a discontinuity" description="Increase harmonic count and narrow the time interval around the rising edge; compare peak height with ringing width." caption="The square wave jumps from −1 to +1. Overshoot is reported as a fraction of that jump, not as a fraction of the upper plateau." %}

The overshoot approaches about **8.95% of the jump**, so the upper peak tends toward $1+2(0.08949)=1.17898$. Its excess above the plateau is 0.17898: about 17.9% of the plateau magnitude, but 8.95% of the jump from −1 to +1. These percentages describe the same excess with different denominators. More harmonics compress the ringing toward the discontinuity. They do not drive this moving peak to 1. [R1](#r1)

But which distance shrinks, and where does the number 1.17898 come from? We can derive both rather than infer them from a graph.

### Find the finite sum's first peak

Our slider's $N$ remains the **highest permitted harmonic index**. Let $M=\lceil N/2\rceil$ be the number of retained odd harmonics. Then

$$S_N^\square(t)=\frac4\pi\sum_{r=0}^{M-1}\frac{\sin((2r+1)\theta)}{2r+1},\qquad\theta=\omega_0t.$$

Differentiating with respect to $\theta$ cancels each denominator:

$$\frac{dS_N^\square}{d\theta}=\frac4\pi\sum_{r=0}^{M-1}\cos((2r+1)\theta)
=\frac2\pi\frac{\sin(2M\theta)}{\sin\theta}.$$

The cosine-sum identity follows by summing a finite geometric progression of exponentials. Just to the right of the jump, the derivative is positive; at $\theta=\pi/(2M)$ it first becomes zero and then negative. Thus, for this square-wave partial sum, the first peak has the **exact** position

$$\theta_{\rm peak}=\frac\pi{2M},\qquad d_N=t_{\rm peak}=\frac{T}{4M}.$$

The first trough is at $-d_N$, so the trough-to-peak distance is $2d_N=T/(2M)$. This distance characterizes the first pair of extrema, not the entire range of all smaller oscillations.

For $T=1$ s:

| Highest harmonic $N$ | Odd harmonics $M$ | Jump-to-peak distance $d_N$ |
| --- | --- | --- |
| 1 | 1 | 0.250 s |
| 5 | 3 | 0.08333 s |
| 25 | 13 | 0.01923 s |
| 101 | 51 | 0.004902 s |

For odd $N$, $2M=N+1$, so $d_N=T/[2(N+1)]$. It shrinks like $1/N$. Keeping track of whether a symbol counts all harmonic indices or only odd terms prevents apparently contradictory peak-position formulas.

### Follow the shrinking neighborhood to obtain the sine integral

To follow the peak, introduce the dimensionless coordinate $z=2M\theta$, so $t=Tz/(4\pi M)$. The exact peak stays at $z=\pi$ as $M$ grows.

Set

$$u_r=\frac{2r+1}{2M},\qquad\Delta u=\frac1M.$$

The $u_r$ are the midpoints of $M$ equal subintervals of $[0,1]$. Because $1/(2r+1)=\Delta u/(2u_r)$,

$$\begin{aligned}
S_N^\square\!\left(\frac{Tz}{4\pi M}\right)
&=\frac4\pi\sum_{r=0}^{M-1}\frac{\sin(zu_r)}{2M u_r}\\
&=\frac2\pi\sum_{r=0}^{M-1}\frac{\sin(zu_r)}{u_r}\,\Delta u.
\end{aligned}$$

For fixed $z$, this is a midpoint Riemann sum. The integrand has a removable value $z$ at $u=0$, so the limit is

$$G(z)=\frac2\pi\int_0^1\frac{\sin(zu)}u\,du
=\frac2\pi\int_0^z\frac{\sin v}v\,dv
=\frac2\pi\operatorname{Si}(z).$$

The second step substitutes $v=zu$. The last step **defines** the sine integral $\operatorname{Si}(z)$; it was not an unexplained function inserted into the derivation.

Ordinary calculus now gives

$$G'(z)=\frac2\pi\frac{\sin z}{z}.$$

The derivative is positive on $(0,\pi)$ and negative on $(\pi,2\pi)$, so the first maximum is at $z=\pi$. Its value is

$$G(\pi)=\frac2\pi\operatorname{Si}(\pi)\approx1.17898,\qquad
\frac{G(\pi)-1}{2}\approx0.08949.$$

### Stay at a point, or follow the peak?

At a fixed $t_\ast>0$ away from a jump, $S_N^\square(t_\ast)\to1$. If instead we follow $t_N=T/(4M)$, then $t_N\to0$ but $S_N^\square(t_N)\to1.17898$. Pointwise convergence holds a time fixed; this second experiment changes the time with $N$. The two limits ask different questions.

Also distinguish the **plateau overshoot** from the **worst error over the whole period**. The excess 0.17898 is not the global supremum error. For every finite $N$, $S_N^\square(t)\to0$ as $t\to0^+$ while the target there is 1, so errors arbitrarily close to 1 occur immediately beside the jump. Both facts rule out uniform convergence, even while their narrow error regions permit mean-square convergence.

A bandwidth limit cannot reproduce an infinitely sharp transition. The abrupt truncation of Fourier coordinates also introduces oscillatory reconstruction behavior. Ringing in actual measurement/filtering chains depends on their response, so the exact Gibbs constant is not a universal instrument specification; the useful connection is that sharp edges and bandwidth restrictions demand attention to transients.

## Why complex exponentials?

Euler's identity packages both quadratures into rotation:

$$e^{j\theta}=\cos\theta+j\sin\theta,$$

$$\cos\theta=\frac{e^{j\theta}+e^{-j\theta}}2,
\qquad \sin\theta=\frac{e^{j\theta}-e^{-j\theta}}{2j}.$$

Start from the full trigonometric series rather than skipping directly to the compact answer:

$$x(t)=\frac{a_0}{2}+\sum_{n=1}^{\infty}\left[a_n\cos(n\omega_0t)+b_n\sin(n\omega_0t)\right].$$

Insert the two exponential identities, retaining both terms:

$$\begin{aligned}
x(t)&=\frac{a_0}{2}+\sum_{n=1}^{\infty}\left[
\frac{a_n}{2}\big(e^{jn\omega_0t}+e^{-jn\omega_0t}\big)
+\frac{b_n}{2j}\big(e^{jn\omega_0t}-e^{-jn\omega_0t}\big)\right]\\
&=\frac{a_0}{2}+\sum_{n=1}^{\infty}\left[
\frac{a_n-jb_n}{2}e^{jn\omega_0t}
+\frac{a_n+jb_n}{2}e^{-jn\omega_0t}\right].
\end{aligned}$$

Here $1/j=-j$. Define

$$C_n=\frac{a_n-jb_n}{2},\qquad C_{-n}=\frac{a_n+jb_n}{2},\qquad C_0=\frac{a_0}{2}.$$

For a real signal, $a_n,b_n$ are real, so $C_{-n}=\overline{C_n}$ and $e^{-jn\omega_0t}=\overline{e^{jn\omega_0t}}$. The two terms are conjugate partners. We can write them as separate sums:

$$x(t)=C_0+\sum_{n=1}^{\infty}C_n e^{jn\omega_0t}
+\sum_{n=1}^{\infty}C_{-n}e^{-jn\omega_0t}.$$

In the last sum, replace the index $n$ by $k=-n$. As $n$ runs through $1,2,3,\ldots$, $k$ runs through $-1,-2,-3,\ldots$. Include $k=0$ and the positive indices, and all three pieces become

$$\boxed{x(t)=\sum_{k=-\infty}^{\infty}C_k e^{jk\omega_0t}.}$$

Negative indices therefore **retain the opposite-rotation terms under one indexing rule**. They do not discard a conjugate or add an extra physical oscillation. Infinite sums here inherit the convergence interpretation of the trigonometric series; we understand the partial sums symmetrically through $-N\le k\le N$.

Their inner products are particularly short:

$$\int_0^T e^{jk\omega_0t}\overline{e^{jm\omega_0t}}\,dt
=\int_0^T e^{j(k-m)\omega_0t}\,dt
=\begin{cases}T,&k=m,\\0,&k\ne m.\end{cases}$$

Projecting and dividing by $T$ therefore gives

$$C_k=\frac1T\int_0^T x(t)e^{-jk\omega_0t}\,dt.$$

### What does a complex coefficient measure?

Expand the probe in the coefficient integral:

$$C_k=\frac1T\int_0^T x(t)\cos(k\omega_0t)dt
-\frac jT\int_0^T x(t)\sin(k\omega_0t)dt.$$

For real $x$, the real part measures cosine agreement and the negative imaginary part measures sine agreement. If $C_k=\lvert C_k\rvert e^{j\phi_k}$, pairing it with its conjugate gives

$$C_k e^{jk\omega_0t}+C_{-k}e^{-jk\omega_0t}
=2|C_k|\cos(k\omega_0t+\phi_k),\qquad k>0.$$

Thus $2\lvert C_k\rvert $ is the real harmonic's amplitude and $\phi_k$ its cosine phase. The coefficient is a coordinate recovered by an inner product, not just a label saying “this frequency is present.”

{% include interactive-figure.html id="fig-complex-frequency" experiment="complex" title="Opposite rotations make a real oscillation" description="Sweep rotation phase and follow the positive and negative phasors and their projections." caption="The conjugate average (e^{jθ}+e^{−jθ})/2 is real. The phase slider supplies a controllable clock without automatic animation." %}

Positive frequency rotates counterclockwise in the complex plane; negative frequency rotates clockwise. A real cosine is the average of both rotations. There is no negative number of physical cycles passing a sensor. The sign identifies the direction of a mathematical rotation whose projection can be a real measurement.

If $x(t)$ is real, conjugating the coefficient integral gives

$$\overline{C_k}=\frac1T\int_0^T x(t)e^{jk\omega_0t}\,dt=C_{-k}.$$

Thus negative coefficients are redundant for real signals, but retaining them makes algebra uniform. A real cosine of amplitude $A$ and phase $\phi$ has $C_1=(A/2)e^{j\phi}$ and $C_{-1}=(A/2)e^{-j\phi}$. Mistaking either coefficient magnitude $A/2$ for the full cosine amplitude loses a factor of two.

### The same square wave in complex coordinates

For $s_\square$, $a_n=0$ and $b_n=4/(\pi n)$ for positive odd $n$. Consequently,

$$C_k=\begin{cases}-\dfrac{2j}{\pi k},&k\text{ odd},\\0,&k\text{ even, including }0.\end{cases}$$

The formula includes negative odd $k$: $C_1=-2j/\pi$ and $C_{-1}=+2j/\pi$. Pairing them recovers the first sine:

$$-\frac{2j}{\pi}e^{j\omega_0t}+\frac{2j}{\pi}e^{-j\omega_0t}
=-\frac{2j}{\pi}\left(e^{j\omega_0t}-e^{-j\omega_0t}\right)
=\frac4\pi\sin(\omega_0t).$$

The same pairing works for every positive odd index, so the complete representation is

$$s_\square(t)\sim\sum_{\substack{k\in\mathbb Z\\k\text{ odd}}}
-\frac{2j}{\pi k}e^{jk\omega_0t}.$$

For example, $C_3\approx-0.2122j$ corresponds to a real sine of amplitude $2\lvert C_3\rvert \approx0.4244$; its cosine phase is $-\pi/2$. The two descriptions reconstruct the same waveform. Complex coordinates make the phase bookkeeping shorter.

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

What should replace $C_k$ when the grid becomes continuous? First remove its average-over-a-period factor. Define a frequency-dependent integral

$$A_T(\omega)=\int_{-T/2}^{T/2}x(t)e^{-j\omega t}\,dt.$$

At a harmonic frequency, $A_T(\omega_k)=T C_k^{(T)}$. For our compactly supported pulse, once the window contains the pulse, this integral already includes its entire nonzero domain. Its limit is therefore

$$X(\omega)=\int_{-\infty}^{\infty}x(t)e^{-j\omega t}\,dt.$$

More generally, for an absolutely integrable signal, $A_T(\omega)\to X(\omega)$ as the integration interval grows. The continuous transform is the unnormalized projection integral; a Fourier-series coefficient also divides that integral by the period. Thus

$$C_k^{(T)}=\frac{X(\omega_k)}T
=\frac{\Delta\omega}{2\pi}X(\omega_k)$$

for the compact pulse. Reinsert that relation into the series:

$$\begin{aligned}
x_T(t)&=\sum_{k=-\infty}^{\infty}\frac1T X(\omega_k)e^{j\omega_k t}\\
&=\frac1{2\pi}\sum_{k=-\infty}^{\infty}X(\omega_k)e^{j\omega_k t}\,\Delta\omega.
\end{aligned}$$

This is a Riemann-sum form. Increasing $T$ does two things together: the pulse replicas move apart in time, and the frequency grid spacing $\Delta\omega$ decreases. On a fixed observation interval, the periodic waveform eventually contains only the central pulse. In frequency, the increasingly dense sum motivates

$$\boxed{x(t)=\frac1{2\pi}\int_{-\infty}^{\infty}X(\omega)e^{j\omega t}\,d\omega.}$$

{% include interactive-figure.html id="fig-fourier-limit" experiment="limit" title="Let the period grow toward infinity" description="Increase T; watch pulse copies separate and spectral lines fill the transform envelope. Toggle the limiting curve." caption="The pulse has width one second. Lines show T C_k = X(kΔω); their spacing is Δω = 2π/T. This scaling keeps the limiting envelope visible." %}

For the figure's unit-height, one-second pulse, the DC coefficient is its average: $C_0^{(T)}=1/T$. At $T=2,4,8$ s it is $0.5,0.25,0.125$, while $T C_0^{(T)}=1$ s stays fixed. The amplitudes shrink as the number of closely spaced coordinates grows. It would be incorrect to turn $C_k$ itself into the transform without compensating for the changing frequency spacing.

The Fourier series has countably many harmonic coordinates. The Fourier transform has a continuous frequency variable: $X(\omega)$ is a density of complex amplitude, and $d\omega/(2\pi)$ supplies the reconstruction weight. A single value of $X$ is not the amplitude of a finite-width frequency band.

To separate the two limiting operations, first retain only frequencies $\lvert \omega_k\rvert \le\Omega$ for a fixed finite cutoff. Letting $T\to\infty$ makes that finite-range sum approach $(1/2\pi)\int_{-\Omega}^{\Omega}X(\omega)e^{j\omega t}d\omega$. Then let $\Omega\to\infty$ under the appropriate inversion conditions. Densifying a bounded frequency grid and extending the frequency range are distinct steps.

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

where $\operatorname{sinc}(u)=\sin(\pi u)/(\pi u)$ and $\operatorname{sinc}(0)=1$. The DC value is its area $\tau$. The zeros occur at $\omega=2\pi m/\tau$ for nonzero integer $m$. Increasing pulse width compresses the spectrum; the jump edges produce a slowly decaying $1/\lvert \omega\rvert $ envelope.

{% include interactive-figure.html id="fig-rectangle-transform" experiment="rectangle" title="Pulse width, spectral width, and shift phase" description="Change pulse width and move its center in time; compare transform magnitude with real and imaginary parts." caption="A time shift multiplies the transform by e^{−jωt₀}. The magnitude stays fixed even though the real and imaginary parts change." %}

### Gaussian: smooth in time, smooth in frequency

Let $g(t)=e^{-t^2/(2\sigma^2)}$. We can derive its transform without integrating a complex completed square. Write $G(\omega)=\int g(t)e^{-j\omega t}\,dt$. Since $g'(t)=-t g(t)/\sigma^2$ and the boundary terms vanish,

$$\mathcal F\{g'\}=j\omega G,
\qquad G'(\omega)=-j\int t g(t)e^{-j\omega t}\,dt=-\sigma^2\omega G(\omega).$$

Solving this differential equation and using the Gaussian area $G(0)=\sqrt{2\pi}\sigma$ gives

$$G(\omega)=\sqrt{2\pi}\sigma e^{-\sigma^2\omega^2/2}.$$

The transform decays exponentially in $\omega^2$. A narrow Gaussian still needs a broad spectrum, but its smooth tails are qualitatively different from a rectangle's sidelobes. Neither pulse is perfectly bandlimited; an engineering bandwidth must include a stated tolerance.

{% include interactive-figure.html id="fig-gaussian-transform" experiment="gaussian" title="Smoothness and frequency translation" description="Change Gaussian width and apply real cosine modulation; observe how the envelope moves into two spectral copies." caption="Multiplication by cos(Ωt) gives [G(ω−Ω)+G(ω+Ω)]/2. Real modulation needs a conjugate pair of shifts." %}

## What does a response do to a signal?

So far we have changed representations without changing the signal. A measurement front end can also change the waveform itself. Suppose a brief input disturbance produces a spread-out response. How do the responses to all the different parts of an input combine?

Let $h(t)$ be a black box's response to a unit-area impulse applied at zero. We need two assumptions for the following construction: scaling and adding inputs scales and adds responses (**linearity**), and shifting an input shifts its response by the same amount (**time invariance**). A clipping circuit or a time-varying gain need not obey these assumptions; knowing its response to one impulse would not suffice.

An impulse applied at time $\tau$ then produces $h(t-\tau)$. Here $\tau$ is an input-time variable; $T$ remains our earlier period. Using the impulse's integration rule, decompose the input as

$$x(t)=\int_{-\infty}^{\infty}x(\tau)\delta(t-\tau)\,d\tau.$$

The small contribution $x(\tau)d\tau$ at time $\tau$ produces $x(\tau)h(t-\tau)d\tau$. Add these shifted responses to obtain

$$\boxed{y(t)=(x*h)(t)=\int_{-\infty}^{\infty}x(\tau)h(t-\tau)\,d\tau.}$$

This is **convolution**. To measure one output value, hold $t$ fixed, shift the response across the input-time axis, multiply the aligned values, and integrate. The argument $t-\tau$ records how much time has elapsed since each contribution entered the box.

For a concrete smoothing response, choose

$$h(t)=\begin{cases}\dfrac1{\tau_r}e^{-t/\tau_r},&t\ge0,\\0,&t<0,\end{cases}\qquad \tau_r>0.$$

Its area is 1; $\tau_r$ is a response time in seconds. For a unit pulse $x(t)=1$ on $0<t<a$, zero otherwise, only input times $0\le\tau\le\min(t,a)$ contribute. Integrating the exponential gives

$$y(t)=\begin{cases}
0,&t<0,\\
1-e^{-t/\tau_r},&0\le t\le a,\\
(1-e^{-a/\tau_r})e^{-(t-a)/\tau_r},&t>a.
\end{cases}$$

The output rises while input contributions arrive, then decays after the pulse ends. Changing $\tau_r$ changes the smoothing and the duration of the tail.

{% include interactive-figure.html id="fig-continuous-response" experiment="response" title="Add the shifted responses from a pulse" description="Change response time and the observation instant; inspect the shifted kernel, its weighted area, and the resulting output." caption="A one-second unit pulse enters a normalized causal exponential response. The area under the weighted contribution equals the output at the selected instant; the frequency panel shows the same response as a multiplier." %}

### What does convolution become in Fourier coordinates?

For integrable $x,h$, the double integral is absolutely integrable, so we may exchange its order. Set $u=t-\tau$:

$$\begin{aligned}
Y(\omega)&=\int_t\left[\int_\tau x(\tau)h(t-\tau)d\tau\right]e^{-j\omega t}dt\\
&=\int_\tau x(\tau)e^{-j\omega\tau}d\tau\int_u h(u)e^{-j\omega u}du\\
&=X(\omega)H(\omega).
\end{aligned}$$

Each integral is over the whole real line. **Convolution in time becomes multiplication in frequency.** With our convention there is no extra factor in $Y=XH$; the $1/(2\pi)$ remains in the inverse transform. [R2](#r2)

For the chosen response,

$$H(\omega)=\int_0^\infty\frac1{\tau_r}e^{-t/\tau_r}e^{-j\omega t}dt
=\frac1{1+j\omega\tau_r},\qquad |H(\omega)|=\frac1{\sqrt{1+(\omega\tau_r)^2}}.$$

Low frequencies pass with magnitude near 1; higher frequencies are reduced. The pulse edge becomes rounded because its broad high-frequency content is suppressed. The same response that is a weighted accumulation in time is a frequency-dependent multiplier in Fourier coordinates. This is enough systems machinery for our purpose.

The complementary operation will matter for finite measurements: multiplication $x(t)w(t)$ becomes

$$\mathcal F\{xw\}(\omega)=\frac1{2\pi}\int_{-\infty}^{\infty}X(\nu)W(\omega-\nu)\,d\nu.$$

The [short derivation](#why-time-multiplication-spreads-a-spectrum) explains the factor. In Article 2, $w$ will describe the finite interval in which we retain observations; spreading the spectrum will then have an immediate measurement consequence.

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

## Short proofs and coefficient checks

These short calculations show the cancellations and error bounds used above. Each starts from its assumptions and can be read independently.

### The remaining real orthogonality identities

For a nonzero integer $q$,

$$\int_0^T\cos(q\omega_0t)dt=\left[\frac{\sin(q\omega_0t)}{q\omega_0}\right]_0^T=0,
\qquad \int_0^T\sin(q\omega_0t)dt=0.$$

Together with the sine–sine identity already worked through, use

$$\cos(m\omega_0t)\cos(n\omega_0t)=\tfrac12[\cos((m-n)\omega_0t)+\cos((m+n)\omega_0t)],$$

$$\sin(m\omega_0t)\cos(n\omega_0t)=\tfrac12[\sin((m+n)\omega_0t)+\sin((m-n)\omega_0t)].$$

For distinct positive $m,n$, every resulting integral is zero. For $m=n$, the cosine–cosine product includes a constant $1/2$, so its integral is $T/2$; the sine–cosine product still integrates to zero. Integrating a single nonzero harmonic against 1 also gives zero. These are the cancellations used to recover each coefficient.

### A complete coefficient check, including the mean

Take the earlier smooth signal with $T=1$ s:

$$x(t)=1+0.8\cos(2\pi t)-0.3\sin(4\pi t).$$

Compute the projections explicitly:

$$\begin{aligned}
a_0&=2\int_0^1x(t)dt=2(1+0+0)=2,\\
a_1&=2\int_0^1x(t)\cos(2\pi t)dt=2(0+0.8/2+0)=0.8,\\
b_2&=2\int_0^1x(t)\sin(4\pi t)dt=2(0+0-0.3/2)=-0.3.
\end{aligned}$$

All remaining $a_n,b_n$ for $n\ge1$ vanish by the identities above. Reinserting the nonzero coefficients gives

$$a_0/2+a_1\cos(2\pi t)+b_2\sin(4\pi t)=x(t)$$

exactly. This checks the normalization, the constant term, and the sign of a sine coefficient together.

### A ramp with a reset

For the odd periodic ramp $s_{\rm ramp}(t)=2t/T$ on $(-T/2,T/2)$, $a_0=a_n=0$. Write $\lambda=n\omega_0$. Integration by parts gives

$$\begin{aligned}
b_n&=\frac8{T^2}\int_0^{T/2}t\sin(\lambda t)dt\\
&=\frac8{T^2}\left[-\frac{t\cos(\lambda t)}\lambda+\frac{\sin(\lambda t)}{\lambda^2}\right]_0^{T/2}\\
&=\frac{2(-1)^{n+1}}{\pi n}.
\end{aligned}$$

Its expansion is

$$s_{\rm ramp}(t)\sim\frac2\pi\sum_{n=1}^{\infty}\frac{(-1)^{n+1}}n\sin(n\omega_0t),$$

with midpoint values at its resets. All integer harmonics can appear, unlike the square wave's odd-only pattern.

### Why projection gives the smallest squared error

Let $p$ be any sum of the harmonics through $N$. The residual $r=x-S_N$ is orthogonal to every retained basis function by the coefficient definitions; hence it is orthogonal to $S_N-p$. Expanding the squared norm gives

$$\begin{aligned}
\|x-p\|_2^2&=\|r+(S_N-p)\|_2^2\\
&=\|r\|_2^2+\|S_N-p\|_2^2
+2\operatorname{Re}\langle r,S_N-p\rangle\\
&=\|x-S_N\|_2^2+\|S_N-p\|_2^2\ge\|x-S_N\|_2^2.
\end{aligned}$$

This is the Pythagorean theorem for functions. Completeness supplies approximating polynomials; this inequality shows that Fourier projections perform at least as well as those polynomials in squared error.

### Why a jump rules out uniform convergence

Suppose continuous $S_N$ converged uniformly to $x$. For any $\varepsilon>0$, choose one $N$ so $\lvert x(t)-S_N(t)\rvert <\varepsilon/3$ at every $t$. Continuity of that $S_N$ gives, for $t$ sufficiently near a chosen $t_0$, $\lvert S_N(t)-S_N(t_0)\rvert <\varepsilon/3$. Then

$$|x(t)-x(t_0)|\le|x(t)-S_N(t)|+|S_N(t)-S_N(t_0)|+|S_N(t_0)-x(t_0)|<\varepsilon.$$

So $x$ would be continuous at $t_0$. A square wave is not continuous at its jumps, contradicting the assumption. Mean-square convergence has no such implication because it controls an integral, not a single bound at all times.

### Why time multiplication spreads a spectrum

Under conditions that allow inversion and exchange of integrals, insert the inverse transform of $w$:

$$\begin{aligned}
\mathcal F\{xw\}(\omega)
&=\int_t x(t)e^{-j\omega t}\frac1{2\pi}\int_\nu W(\nu)e^{j\nu t}d\nu\,dt\\
&=\frac1{2\pi}\int_\nu W(\nu)\left[\int_t x(t)e^{-j(\omega-\nu)t}dt\right]d\nu\\
&=\frac1{2\pi}\int_{-\infty}^{\infty}W(\nu)X(\omega-\nu)d\nu.
\end{aligned}$$

For example, take $x$ integrable and $W$ absolutely integrable so this interchange is justified. Finite-window cases can require the broader inversion interpretation described earlier. The $1/(2\pi)$ comes directly from the inverse transform; swapping the convolution variable gives the form used in the response section.

## The unresolved measurement problem

We now know why projections extract harmonics, what convergence guarantees, why complex coordinates preserve phase, and how growing the period produces a continuous spectrum. A response can reshape that spectrum through multiplication. But the analysis still assumes access to a continuous function over an ideal mathematical domain.

A measurement system gives us something smaller: an ADC's samples, a finite buffer, and a sampling clock. What becomes of the spectrum when time itself becomes discrete? Do frequency coordinates still distinguish different analog sources?

[From Samples to Spectra]({{ '/articles/samples-to-spectra/' | relative_url }}) begins with that loss of information, then follows its consequences through aliasing, the periodic DTFT, the DFT, and practical FFT analysis.

{% include references.html %}
