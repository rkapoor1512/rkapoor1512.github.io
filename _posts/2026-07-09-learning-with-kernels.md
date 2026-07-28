---
title: 'Learning with Kernels'
date: 2026-07-09
permalink: /posts/2026/07/learning-with-kernels/
excerpt: "A set of study notes on the mathematics of kernels: reproducing kernel Hilbert spaces, kernelized learning algorithms, and their connection to kernel integral operators."
tags:
  - kernel-methods
  - machine-learning
  - rkhs
  - functional-analysis
---

*These are a set of study notes on the mathematics of kernels. They are largely based on Schölkopf and Smola's *Learning with Kernels* [1]. They study the theory of reproducing kernel Hilbert spaces, and kernelized algorithms for machine learning, and connect these to kernel integral operators and their regularization properties.*

## 1. Support Vector Machines

*Let's start at the very beginning, a very good place to start.*

The simplest learning problem we can start with is classifying datapoints into two buckets. Here, we imagine our data lives in $\mathcal{X}$ (drawn as $\mathbb{R}^2$), and the 'true' categories live in $\mathcal{Y} = \\{+1,-1\\}$, drawn as blue and red dots respectively.

<figure>
  <img src="/images/fig_svm_linear.png" alt="Two linearly separable classes with a maximum-margin separating line and its margins.">
  <figcaption>Linearly separable two-class data, together with the maximum-margin separating hyperplane and its margins (dashed).</figcaption>
</figure>

This problem is fairly easy to solve. A hyperplane is specified by

$$
\mathbf{w}^\top x + b = 0.
$$

So we want to find a hyperplane $\mathbf{w}, b$ such that the distance between

$$
\mathbf{w}^\top x + b = +1 \quad \text{and} \quad \mathbf{w}^\top x + b = -1
$$

is maximal. We set up the following optimization problem, and fit the optimal $\mathbf{w}, b$ using various techniques in convex optimization (we solve the dual problem using Lagrange multipliers):

$$
\begin{aligned}
\text{minimize} \quad & \|\mathbf{w}\|^2 \\
\text{subject to} \quad & y_i(\mathbf{w}^\top x_i + b) \geq 1.
\end{aligned}
$$

This setup does not allow us to misclassify even a single data point: the hard constraints mean that if even a single data point is too noisy, the model will have no output. In practice we allow for some loosening according to a hyperparameter $\lambda$. The second term below is known as the **hinge loss**:

$$
\text{Loss} = \|\mathbf{w}\|^2 + \lambda \sum_i \max\{0,\, 1 - y_i(\mathbf{w}^\top x_i + b)\}.
$$

Choosing $\lambda = \infty$ recovers the hard-classification problem.

A much harder problem to solve, however, is the following.

<figure>
  <img src="/images/fig_svm_circles.png" alt="Two classes arranged as concentric rings, which no straight line can separate.">
  <figcaption>Concentric-circle data. The two classes are separated by a circle, not a line, so no hyperplane in the original coordinates can separate them.</figcaption>
</figure>

To our eyes, this problem is simple: we can quickly see that the classifying curve is a circle between the two classes. However, this is where the nonlinearity becomes a problem: our technique only allows us to learn a hyperplane.

The trick is to define a feature map $\varphi(x_1,x_2) = (x_1, x_2, x_1^2 + x_2^2)$, and lift to a higher-dimensional space, where the classification problem is completely linear.

<figure>
  <img src="/images/fig_svm_lift3d.png" alt="The concentric-ring data lifted into three dimensions, where a flat plane separates the two classes.">
  <figcaption>The lift $\varphi(x_1,x_2) = (x_1, x_2, x_1^2 + x_2^2)$. In the third coordinate the two classes sit at different heights, so a flat plane now separates them.</figcaption>
</figure>

In this new picture, the data is again linearly separable, with the separating hyperplane now being $2$-dimensional instead of $1$-dimensional.

The issue, of course, is that in this example, we knew the 'correct' feature map. In practice, for data that is naturally much higher-dimensional and scattered, we can't read off the 'correct' feature map just by looking at it.

Another option is to simply try a huge dictionary and let the model learn a large number of zero weights. For example, we could try a much more general feature map like

$$
\varphi(x_1,x_2) = (1, x_1, x_2, x_1^2, x_2^2, x_1 x_2),
$$

which has all polynomial terms of degree $2$. This approach is promising, and would indeed work on our second example: we would learn some hyperplane that depends on $x_1^2 + x_2^2$ and be done. Let us do some back-of-the-envelope math to see if this method generalizes. Assume our data comes from a $d$-dimensional space (in our toy example, $d = 2$), and as a heuristic for our feature space, we choose all monomials of degree at most $n$ (in the previous example, $n = 2$). The number of monomials is then

$$
\binom{n+d}{d} \approx \frac{d^n}{n!},
$$

which grows very fast in $d$. The features soon become too vast to compute efficiently. Just throwing in more and more features runs into the curse of dimensionality very quickly.

What we would like is a method to pick small feature maps based on how important we think they will be, in a data-driven way. The kernel trick provides a way to systematically construct such feature maps, without ever explicitly choosing features by hand.

## 2. The Kernel Trick

The basic kernel trick is as follows: assume our data $\\{x_i\\}$ comes from a set $X$. We place no structure on $X$: it need not have any inner product or linear structure. We then define a **kernel** $k(x,y) : X \times X \to \mathbb{R}$. We require some mild assumptions on $k$, in particular that it be a positive-semidefinite function (which we shall define later). Under these assumptions, the kernel implicitly defines a feature map $\varphi : X \to \mathcal{H}$: there exists some Hilbert space $\mathcal{H}$ such that

$$
k(x,y) = \langle \varphi(x), \varphi(y) \rangle_{\mathcal{H}}.
$$

This avoids the curse of dimensionality, since we never actually have to compute $\varphi$ explicitly: the choice of kernel lets us compute inner products in this space without it.

Designing good kernels is as much an art as a science, but the heuristic is that, since it behaves like a cosine similarity, the kernel should measure 'similarity' in a sense that is useful to us, and the associated feature map will then find a high-dimensional embedding that is useful to us.

The "kernel trick" means different things to different people. Here are a few benefits of working with kernels, all of which are often referred to as the 'kernel trick':

1. A choice of kernel lets us implicitly choose a dictionary of feature maps, rather than doing so explicitly, which might be better adapted to the problem at hand.
2. It solves the curse-of-dimensionality problem in picking a large dictionary.
3. It lets us lift a lower-dimensional problem to a higher-dimensional one.
4. It lets us put linear structure on problems that might not have any natural linear structure (string or image kernels).
5. Any algorithm that only accesses the data through inner products can be reinterpreted as a kernelized algorithm.

These notes work through each of these benefits in detail.

## 3. Reproducing Kernel Hilbert Spaces

The previous section begs the question: what is this magical high-dimensional $\mathcal{H}$ into which our kernel is embedding the data? The answer is that it is a *reproducing kernel Hilbert space*, which we define and prove some basic facts about below. For this section, we work with vector spaces over $\mathbb{R}$ for simplicity.

**Definition 3.1.** A **reproducing kernel Hilbert space** (RKHS) is a Hilbert space $H$ where point evaluation is continuous: for each $x$, the map $f \mapsto f(x)$ is bounded, i.e. $\lvert f(x)\rvert \leq M_x \|f\|_H$.

Then $f(x) = \langle f, K_x\rangle$ by the Riesz Representation Theorem, where $K_x(\cdot) = K(x, \cdot)$.

Not every Hilbert space is an RKHS. For example, $L^2([0,1])$ is not a reproducing kernel Hilbert space, since a function $f \in L^2([0,1])$ can be unbounded at any single point while remaining square-integrable.

We can define $k(x,y) = \langle K_y, K_x\rangle$ to be the kernel of this space. This function is symmetric and positive-definite, since inner products are symmetric and positive-definite in their arguments. The important fact is that the converse also holds.

**Theorem 3.2 (Moore–Aronszajn).** For any symmetric positive-definite kernel $k(x,y) : \mathcal{X} \times \mathcal{X} \to \mathbb{R}$, there exists a unique RKHS $H$ for which $k$ is the reproducing kernel.

*Proof.* We define a vector space $H_0$ as

$$
H_0 = \text{span}\{k(x,\cdot) : x \in \mathcal{X}\},
$$

with the inner product

$$
\left\langle \sum_{i=1}^n \alpha_i k(x_i, \cdot),\ \sum_{j=1}^m \beta_j k(x_j, \cdot)\right\rangle = \sum_{i=1}^n \sum_{j=1}^m \alpha_i \beta_j\, k(x_i, x_j).
$$

This is a well-defined inner product, due to the symmetric, positive-definite nature of the kernel. We then define $H$ to be the closure of $H_0$ in the induced norm. We can interpret $H$ as the space of functions $f : \mathcal{X} \to \mathbb{R}$ of the form $f(x) = \sum_{i=1}^n \alpha_i k(x_i, x)$. Almost by construction, $H$ has the reproducing property.

To see uniqueness, suppose there is another Hilbert space $H'$ for which $k$ is the reproducing kernel. Define $\iota : H \to H'$ to be the linear map sending $K_x = K(x,\cdot) \in H_0$ to $K_x = K(x,\cdot) \in H'$. This is injective, and the inner product on $H'$ must agree with that on $H$ by linearity. Since $H'$ is complete, taking closures gives $H \subseteq H'$.

Now let $g \in H'$ with $g \perp H$, so that $\langle g, K_x \rangle_{H'} = 0$ for all $x \in X$. By the reproducing property of $H'$, $g(x) = 0$ for all $x$, i.e. $g$ is the zero function. Thus $\iota$ is an isometric isomorphism. $\square$

In this space, the feature map $\varphi : \mathcal{X} \to H$ is given by $x \mapsto k(x, \cdot)$. This is a complete, precise, and unique characterization of the Hilbert space, but it is not so useful for reasoning geometrically about the feature space. To do so, we add some more assumptions and give a second characterization.

## 4. Mercer's Theorem

Now we assume more structure on our state space $X$: let $X$ be a compact metric space with a probability measure $\mu$, and let $L^2(X, \mu)$ denote the square-integrable functions.

Suppose $k(x,y) : X \times X \to \mathbb{R}$ is symmetric, and let its **kernel integral operator** be $T_k f(x) = \int_X k(x,y) f(y)\, d\mu(y)$. Then $T_k$ is self-adjoint, since for any $f, g$,

$$
\langle T_k f, g\rangle = \int_X \int_X k(x,y) f(x) g(y)\, d\mu(x)\, d\mu(y) = \langle f, T_k g \rangle.
$$

One can further show that $k$ being positive-semidefinite implies $T_k$ is a positive operator, i.e. $\langle T_k f, f\rangle \geq 0$ for all $f$. We claim $T_k$ is compact when $k$ is continuous.

**Theorem 4.1.** Let $k : X \times X \to \mathbb{R}$ be continuous. Then $T_k$ is compact.

*Proof.* Let $B = \\{f \in L^2(\mu) : \lVert f\rVert = 1\\}$ be the unit ball in $L^2(X, \mu)$. We show that $T_k(B)$ is pointwise bounded and equicontinuous, so that by Arzelà–Ascoli it is relatively compact in the uniform topology of $C(X)$. Since the inclusion $C(X) \hookrightarrow L^2(X,\mu)$ is continuous, this suffices.

For pointwise boundedness,

$$
T_k f(x) = \int k(x,y) f(y)\, d\mu(y) \leq \int k(x,y)\, d\mu(y) \int f(y)\, d\mu(y) \leq \int k(x,y)\, d\mu(y) \leq \sup_{X \times X} k.
$$

For equicontinuity, let $\varepsilon > 0$. Then

$$
T_k f(x) - T_k f(y) = \int (k(x,t) - k(y,t)) f(t)\, d\mu(t) \leq \int |k(x,t) - k(y,t)|\, d\mu(t).
$$

Since $k$ is continuous on a compact set, it is uniformly continuous, and hence so is $(x,y) \mapsto \int \lvert k(x,t) - k(y,t)\rvert\, d\mu(t)$. $\square$

Since $T_k$ is compact and self-adjoint, it has an orthonormal basis of eigenvectors $\psi_i$ with eigenvalues $\lambda_i$ satisfying $\lvert\lambda_i\rvert \to 0$. Since $T_k$ is positive, each $\lambda_i \geq 0$.

**Theorem 4.2 (Mercer).** For a symmetric positive-definite kernel $k(x,y) : X \times X \to \mathbb{R}$,

$$
k(x,y) = \sum_{i=1}^\infty \lambda_i \psi_i(x)\, \psi_i(y),
$$

where the sum on the right converges absolutely, and if $k$ is continuous, uniformly.

*Proof (sketch).* We prove this in two stages. First, we show that $\sum_{i=1}^\infty \lambda_i \psi_i(x) \psi_i(y)$ converges absolutely to a kernel $k_0$. Then, we show that the map $k \mapsto T_k$ is injective; since $k$ and $k_0$ induce the same kernel integral operator, they must coincide. The starting point is the identity $\lambda_i \psi_i(x) = T_k \psi_i(x) = \int k(x,y) \psi_i(y)\, d\mu(y)$. *(The remaining convergence estimates are still being written up.)*

## 5. Risk Minimization

**Definition 5.1.** A **loss function** is a map $c : X \times Y \times Y \to [0, \infty)$ that takes an input $x$, an observation $y$, and a prediction $f(x)$ to a nonnegative real number, satisfying $c(x,y,y) = 0$.

There are a number of common loss functions. The first three are used for **classification**, where $Y = \\{-1, +1\\}$, and it is natural to express the loss in terms of the **margin** $y f(x)$: a positive margin means $f$ predicts the correct sign, and a larger margin means a more confident correct prediction.

- **Binary (0–1) loss.** This simply counts misclassifications:

$$
c(x,y,f(x)) = \mathbf{1}[\,y f(x) < 0\,] = \tfrac{1}{2}\,\lvert\,\operatorname{sgn} f(x) - y\,\rvert \quad (f(x) \neq 0).
$$

  It is the loss we truly care about, but it is non-convex and discontinuous, so in practice we minimize a convex **surrogate** that upper-bounds it. The next two are the most common such surrogates.

- **Soft margin (hinge) loss.** Penalizes any point whose margin falls short of $1$:

$$
c(x,y,f(x)) = \max\{0,\, 1 - y f(x)\}.
$$

  This is the loss underlying the support vector machine of Section 1.

- **Logistic loss.** A smooth surrogate arising from logistic regression:

$$
c(x,y,f(x)) = \log\!\left(1 + e^{-y f(x)}\right).
$$

<figure>
  <img src="/images/fig_loss_classification.png" alt="Zero-one, hinge and logistic losses plotted against the margin.">
  <figcaption>Classification losses as a function of the margin $yf(x)$. The convex hinge and logistic losses both upper-bound the $0/1$ loss.</figcaption>
</figure>

The remaining two are used for **regression**, where $Y = \mathbb{R}$, and depend on the residual $f(x) - y$.

- **Squared (mean-square) loss.** $c(x,y,f(x)) = (f(x)-y)^2$. Smooth and strongly convex, but sensitive to outliers.
- **$L^1$ loss.** $c(x,y,f(x)) = \lvert f(x)-y\rvert$. More robust to outliers, but not differentiable at $0$.

<figure>
  <img src="/images/fig_loss_regression.png" alt="Squared and absolute-value losses plotted against the residual.">
  <figcaption>Regression losses as a function of the residual $f(x) - y$.</figcaption>
</figure>

Each of these satisfies the axiom $c(x,y,y) = 0$: a perfect prediction incurs no loss.

In practice we assume our data comes from some probability distribution $P(x,y)$ on $X \times Y$, and we want to minimize the expected loss over this distribution to find a function $f_\ast$. We fix a function space $\mathcal{F}$ in which to optimize, and solve

$$
f_* = \arg\min_{f \in \mathcal{F}} \mathbb{E}_P[c(x,y,f(x))] = \arg\min_{f \in \mathcal{F}} \int_{X \times Y} c(x,y,f(x))\, dP(x,y).
$$

Of course, in practice we do not have access to the full distribution $P(x,y)$. We instead have a training set of size $n$, which we write as

$$
dP_{\text{emp}}(x,y) = \frac{1}{n} \sum_{i=1}^n \delta_{x_i}(x)\, \delta_{y_i}(y).
$$

We are thus forced to minimize the **empirical risk**,

$$
f_* = \arg\min_{f \in \mathcal{F}} \int_{X \times Y} c(x,y,f(x))\, dP_{\text{emp}}(x,y) = \arg\min_{f \in \mathcal{F}} \frac{1}{n} \sum_{i=1}^n c(x_i,y_i,f(x_i)).
$$

We call the function being minimized the **empirical risk functional** $R(f) = \frac{1}{n} \sum_{i=1}^n c(x_i,y_i,f(x_i))$.

In theory we want $\mathcal{F}$ as rich as possible. But this leads to problems. First, adding more functions to our optimization space can make the problem numerically ill-conditioned. Second, we risk overfitting: the empirical minimizer perfectly remembers the training data but performs badly out of sample. It is also possible that we have some prior (in the Bayesian sense) about what the solution should look like. In any case, it is often useful to add a **regularization** term of the form $\Omega(f)$, where $\Omega$ is some (generally convex) positive functional that builds in the properties we want. The problem we solve becomes

$$
f_* = \arg\min_{f \in \mathcal{F}} R(f) + \lambda\, \Omega(f).
$$

Here $\lambda$ is the **regularization parameter**: small $\lambda$ regularizes weakly, large $\lambda$ regularizes strongly. We now leave statistical learning theory aside and focus on the mathematical problem of actually solving this.

## 6. The Representer Theorem

Reproducing kernel Hilbert spaces are in general infinite-dimensional, and optimizing over an infinite-dimensional space sounds hard. However — and this is the heart of the kernel trick — the representer theorem tells us that it is tractable: the best fit to the data $\\{x_i\\}$ is a ***finite*** linear combination of the feature vectors $K(x_i, \cdot)$. We therefore only need to learn finitely many coefficients.

**Theorem 6.1 (Representer Theorem).** Given a training sample $(x_1, y_1), \ldots, (x_n, y_n) \in X \times \mathbb{R}$, a loss function $L : X \times \mathbb{R} \times \mathbb{R} \to \mathbb{R}$, and a strictly increasing $\Omega$, the minimizer in $H$ of

$$
\sum_{i=1}^n L(x_i, y_i, f(x_i)) + \lambda\, \Omega(\lVert f\rVert_H)^2
$$

is of the form

$$
f^*(x) = \sum_{i=1}^n a_i\, K(x_i, x).
$$

Proof. Let 

$$
H_n = \text{span}\{K(x_i, \cdot)\}_{i=1}^n
$$

Since this is finite-dimensional it is closed, so the projection onto it and its orthogonal complement are well-defined. Write $f = f_\parallel + f_\perp$ with $f_\parallel \in H_n$ and $f_\perp \perp H_n$. Then

$$
f(x_j) = \langle f, K(x_j, \cdot)\rangle = \langle f_\parallel, K(x_j, \cdot)\rangle = f_\parallel(x_j),
$$

so the loss term depends only on $f_\parallel$:

$$
\sum_i L(x_i, y_i, f(x_i)) = \sum_i L(x_i, y_i, f_\parallel(x_i)).
$$

But $\lVert f\rVert_H^2 = \lVert f_\parallel\rVert_H^2 + \lVert f_\perp\rVert_H^2 \geq \lVert f_\parallel\rVert_H^2$. Thus the first term of the risk depends only on $f_\parallel$, while the regularization term is only increased by a nonzero $f_\perp$. Hence $\lVert f_\perp\rVert = 0$ for the optimal $f$, which means $f \in \text{span}\\{K(x_i, \cdot)\\}_i$. $\square$

## 7. Regularization Operators

Here we present a third perspective on kernel methods: viewing them as a regularization operator in some space. This ultimately connects, via Bochner's theorem, to a picture of translation-invariant kernels as regularizers in the frequency domain.

A **regularization operator** $\Upsilon$ from a space of functions $\mathcal{F}$ into a Hilbert space $\mathcal{H}$ is an operator such that the regularization term is $\Omega(f) = \langle \Upsilon f, \Upsilon f \rangle_{\mathcal{H}}$. Without loss of generality we may assume $\Upsilon$ is positive: if it is not, we replace it by $\Upsilon' = (\Upsilon^\ast \Upsilon)^{1/2}$, which has the same property and exists as the positive square root of a positive operator.

## 8. Kernel Mean Embedding

Until now, we have worked on lifting single data points into a reproducing kernel Hilbert space. We can work one level higher, and embed entire probability distributions into RKHSs. Here we assume $M$ is compact and the kernel $k$ is continuous. By $P(M)$ we denote the space of finite Borel measures on $M$. The **kernel mean embedding** induced by a kernel $k$ is the map $E : P(M) \to \mathcal{H}$ given by

$$
E(\mu)(x) = \int_M k(x,y)\, d\mu(y).
$$

We say that a kernel $k(x,y)$ is **characteristic** if the induced map $E$ is injective on probability distributions. In practice we assume a stronger property on our kernels: that they are in fact universal.

**Definition 8.1.** A kernel $k : M \times M \to \mathbb{R}$ is **universal** if the reproducing kernel Hilbert space $\mathcal{H}$ is dense in $C_b(M)$: for every $f \in C_b(M)$ and every $\varepsilon > 0$ there exists $h \in \mathcal{H}$ with $\lVert h - f\rVert_\infty < \varepsilon$.

This embedding induces a pseudometric on the space of probability measures: given $\mu_1, \mu_2$, set

$$
d(\mu_1, \mu_2) = \lVert E(\mu_1) - E(\mu_2)\rVert_{\mathcal{H}}.
$$

This is known as the **maximum mean discrepancy** (MMD). To see its relationship to other metrics on the space of probability distributions, we define the notion of an integral probability metric.

**Definition 8.2.** Given two probability measures $\mu_1$ and $\mu_2$ on a measurable space $\mathcal{X}$, an **integral probability metric** (IPM) is

$$
\gamma[\mathcal{F}, \mu_1, \mu_2] = \sup_{f \in \mathcal{F}} \left\{ \int f(\mathbf{x})\, d\mu_1(\mathbf{x}) - \int f(\mathbf{y})\, d\mu_2(\mathbf{y}) \right\},
$$

where $\mathcal{F}$ is a space of real-valued bounded measurable functions on $\mathcal{X}$.

The function class $\mathcal{F}$ fully characterizes the IPM $\gamma[\mathcal{F}, \mu_1, \mu_2]$, and there is an obvious trade-off in choosing it. On one hand, the class must be rich enough that $\gamma[\mathcal{F}, \mu_1, \mu_2]$ vanishes if and only if $\mu_1 = \mu_2$. On the other, the larger the class, the harder $\gamma[\mathcal{F}, \mu_1, \mu_2]$ is to estimate. For example, taking $\mathcal{F}$ to be all bounded continuous functions on $\mathcal{X}$ does give a metric on probability distributions.

Since $C_b(\mathcal{X})$ is difficult to work with in practice, we use more restrictive classes:

- Taking $\mathcal{F}_{\mathrm{TV}} = \\{ f : \lVert f\rVert_\infty \leq 1 \\}$, where $\lVert f\rVert_\infty = \sup_{\mathbf{x} \in \mathcal{X}} \lvert f(\mathbf{x})\rvert$, gives $\gamma[\mathcal{F}_{\mathrm{TV}}, \mu_1, \mu_2] = \lVert \mu_1 - \mu_2\rVert_1$, the **total variation distance**.
- Writing $\lVert f\rVert_L := \sup\\{ \lvert f(\mathbf{x}) - f(\mathbf{y})\rvert / \rho(\mathbf{x}, \mathbf{y}) : \mathbf{x} \neq \mathbf{y} \in \mathcal{X} \\}$ for the Lipschitz semi-norm with respect to a metric $\rho$ on $\mathcal{X}$, and taking $\mathcal{F}_{\mathrm{W}} = \\{ f : \lVert f\rVert_L \leq 1 \\}$, yields the **Wasserstein $W_1$ distance** (sometimes called the earthmover distance).

## 9. Random Fourier Features

In Section 6 we saw that optimizing over an infinite-dimensional RKHS $\mathcal{H}$ reduces to learning a finite number of coefficients $\\{\alpha_i\\}$, one per data point:

$$
f_*(x) = \sum_{i=1}^N \alpha_i k(x_i, x).
$$

Mathematicians tend to be quite happy with reducing a possibly infinite-dimensional problem to a finite one. However, in modern machine learning datasets are enormous, and it is not practical to learn as many coefficients as you have data points. So instead of evaluating the kernel at every data point, we use a random approximation to $k(x_i, x)$ built from $D$ functions, indexed by $\omega_j$ and chosen independently of the data:

$$
k(x,x') \approx \sum_{j=1}^D z(x, \omega_j)\, z(\omega_j, x').
$$

Since a linear combination of a linear combination is just another linear combination, we can write

$$
f_* = \sum_{i=1}^D \beta_i\, z(x, \omega_i),
$$

reducing the problem to learning a relatively small number of coefficients. The question is how to build that approximation well. To do so, we restrict to translation-invariant kernels.

**Definition 9.1.** A **translation-invariant** kernel is a kernel $k(x,y)$ that depends only on $x - y$. With a slight abuse of notation, we write $k(x,y) = k(x-y)$.

Such kernels admit an abstract characterization via Bochner's theorem.

**Theorem 9.2 (Bochner).** A (normalized) translation-invariant kernel $k(x-y)$ can be written as the Fourier transform of a finite Borel probability measure: there exists a measure $\Lambda(\omega)$ such that

$$
k(x-y) = \int e^{i \omega \cdot (x-y)}\, d\Lambda(\omega).
$$

This measure $\Lambda$ is called the **spectral measure**. It gives us a way to write randomized kernel algorithms: draw samples $\\{\omega_j\\}_{j=1}^D \sim d\Lambda$ and approximate the integral by a sum,

$$
k(x - y) \approx \frac{1}{D} \sum_{j=1}^D e^{i \omega_j \cdot (x-y)}.
$$

This relies on being able to compute and sample from the spectral measure. Luckily, most commonly used kernels have easily computed spectral measures. For example, the Gaussian kernel $k(x-y) = \exp\!\left(-\lVert x-y\rVert^2 / 2\sigma^2\right)$ on $\mathbb{R}^K$ has spectral measure

$$
d\Lambda(\omega) = \left(\frac{\sigma^2}{2\pi}\right)^{K/2} \exp\!\left(-\sigma^2\lVert \omega\rVert^2 / 2\right) d\omega,
$$

which is just another Gaussian, and very easy to sample from.

We can further use Hoeffding's inequality to bound the approximation error, which decays like $O(1/\sqrt{D})$ in the number $D$ of random features. In practice we can do much better than this bound and get away with far fewer features: 'random features' form a perfectly good (random) basis by themselves, and can be used directly. The interested reader is referred to [2].

It is also worth noting that this perspective can be used to understand neural networks rigorously. A neural network with a single hidden layer tends, in the infinite-width limit, to a kernel machine. That limit corresponds precisely to taking infinitely many random features, so a real-world finite-width single-layer network can be understood as a random Fourier features method. This is particularly interesting because ML theory lacks a rigorous understanding of real-world neural networks, and this is a useful toy model for them.

## References

[1] B. Schölkopf and A. J. Smola, *Learning with Kernels: Support Vector Machines, Regularization, Optimization, and Beyond*, MIT Press, 2002.

[2] A. Rahimi and B. Recht, "Random Features for Large-Scale Kernel Machines," *Advances in Neural Information Processing Systems*, 2007.
