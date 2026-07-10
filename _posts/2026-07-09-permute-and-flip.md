---
title: 'Differentially Private Selection'
date: 2026-07-09
permalink: /posts/2026/07/permute-and-flip/
excerpt: "A study of the permute-and-flip mechanism for differentially private selection."
tags:
  - differential-privacy
  - algorithms
  - mechanism-design
---

In Winter 2026, I took an excellent class on differential privacy taught by Dr. Phyllis Ju. As a part of that course, I presented on two papers. The first was on the permute-and-flip mechanism for differentially private selection, as introduced by McKenna and Sheldon [1]. The second was on this methods' equivalence with Report Noisy Max under exponential noise, following Ding, Durfee, Kifer, Rogers, and Zhang [2]. I hope to, at some later point, add a preamble that provides a gentler introduction to differential privacy in general. As of now, these notes assume a bit of background knowledge in the field of differential privacy, and the standard terminology in the field. 

Given a database $D$ and a finite set of candidate outputs, each of which comes with a quality score, we would like to release the "best" output — the one with the highest score — while preserving the privacy of individuals in $D$. This is the **differentially private selection** problem. The classical solution is the **exponential mechanism**, which samples output $r$ with probability proportional to $\exp(\varepsilon\, q(D, r) / (2\Delta))$. The permute-and-flip mechanism, introduced in 2020, does at least as well as the exponential mechanism on every input, and strictly better on most.

These notes:

1. Set up the private selection problem and the notion of a **regular mechanism**.
2. Present permute-and-flip and prove its optimality among regular mechanisms.
3. Show its equivalence to **Report Noisy Max** with exponential noise, via the memoryless property of the exponential distribution.

## 1. Setup and Notation

**Definition 1.1 (Selection mechanism).** Let $R$ be a finite set of outputs (the **range**), with $\lvert R \rvert = n$. A **quality score function** assigns to each database $D$ and output $r \in R$ a real-valued score $q(D, r) \in \mathbb{R}$. A **selection mechanism** is a randomized map $M : \mathcal{D} \to R$ that, given a database $D$, returns some output $r \in R$.

**Definition 1.2 (Sensitivity).** The **sensitivity** of the quality score function is

$$
\Delta = \max_{D, D' \text{ neighboring}} \max_{r \in R} \lvert q(D, r) - q(D', r) \rvert.
$$

Recall that $D$ and $D'$ are **neighbors** if they differ in the entry of exactly one individual.

**Example 1.3 (Pricing).** Suppose we survey $4$ people, asking each one *all* the prices they would be willing to pay for a product. The database is

$$
D = \bigl(\lbrace1\rbrace,\; \lbrace1,2\rbrace,\; \lbrace1,2,3\rbrace,\; \lbrace1,2,3,4,5\rbrace\bigr).
$$

The set of possible prices (outputs) is $R = \lbrace1, 2, 3, 4, 5\\}$. A neighboring database $D'$ differs from $D$ in exactly one person's response, e.g. replacing person 4's entry:

$$
D' = \bigl(\lbrace1\rbrace,\; \lbrace1,2\rbrace,\; \lbrace1,2,3\rbrace,\; \lbrace1,2,3\rbrace\bigr).
$$

We consider two natural quality-score functions.

**Score function 1: number of buyers.** Define $q_1(D, r)$ as the number of people willing to pay price $r$:

$$
q_1(D, r) = \lvert \lbrace i : r \in D_i\rbrace\rvert.
$$

For our database $D$:

$$
q_1(D, 1) = 4, \quad q_1(D, 2) = 3, \quad q_1(D, 3) = 2, \quad q_1(D, 4) = 1, \quad q_1(D, 5) = 1.
$$

The sensitivity is $\Delta_1 = 1$: changing one person's set of acceptable prices can change the count at any single price by at most $1$.

**Score function 2: total profit.** Define $q_2(D, r) = r \cdot q_1(D, r)$, the total revenue at price $r$:

$$
q_2(D, 1) = 4, \quad q_2(D, 2) = 6, \quad q_2(D, 3) = 6, \quad q_2(D, 4) = 4, \quad q_2(D, 5) = 5.
$$

The sensitivity is $\Delta_2 = \max_r r \cdot 1 = 5$: at price $r$, changing one person's response can change the revenue by at most $r$, and the maximum price is $5$.

## 2. Regular Mechanisms

To prove optimality, we restrict to mechanisms whose behavior depends on the score vector in a natural way. A mechanism $M$ is called **regular** if it satisfies the following three properties.

**Definition 2.1 (Symmetric).** The mechanism depends only on the multiset of quality scores, not on the labeling of outputs. For any permutation $\sigma$ of $R$,

$$
\Pr[M(q) = r] = \Pr[M(q \circ \sigma^{-1}) = \sigma(r)].
$$

**Definition 2.2 (Shift-invariant).** The mechanism depends only on the *differences* between quality scores, not their absolute values. For any constant $c$,

$$
\Pr[M(q + c) = r] = \Pr[M(q) = r].
$$

**Definition 2.3 (Monotone).** For two score vectors $q, q'$ with $q_r \geq q'_r$ and $q_s \leq q'_s$ for all $s \neq r$ (only the score at $r$ improved),

$$
\Pr[M(q) = r] \geq \Pr[M(q') = r].
$$

Both the exponential mechanism and permute-and-flip satisfy all three properties.

**The objective.** As usual in private selection, the goal is to minimize the expected error

$$
\mathcal{E} = \mathbb{E}[q_* - q(D, M(D))], \qquad q_* = \max_{r \in R} q(D, r),
$$

subject to the mechanism $M$ being $\varepsilon$-differentially private.

## 3. The Permute-and-Flip Algorithm

The mechanism is remarkably simple. Given the score vector, we shuffle the outputs, walk through them in the shuffled order, and, for each one, flip a biased coin whose bias grows with the score. We return the first output whose coin comes up heads.

**Algorithm (Permute-and-Flip).**

*Input:* database $D$, quality score function $q$, privacy parameter $\varepsilon$, sensitivity $\Delta$, output set $R$.

*Output:* a differentially private output $r \in R$.

1. Randomly permute the list of outputs $R$.
2. Let $q_* = \max_{r \in R} q(D, r)$.
3. For each output $r$ in the permuted order:
   - Flip a coin with heads probability $\exp\!\left(\dfrac{\varepsilon\,(q(D, r) - q_*)}{2\Delta}\right)$.
   - If heads, return $r$.

Note that the maximizer always has coin probability $1$, so the algorithm always terminates (worst case, at the last position in the shuffle).

## 4. Optimality of Permute-and-Flip

We now argue that permute-and-flip is optimal among regular $\varepsilon$-differentially private mechanisms.

### 4.1 Worst-case scores

The proof proceeds by analyzing the worst case for the quality scores. By monotonicity, the worst case occurs when the scores take the form

$$
q'(r) = q(r) + \Delta, \qquad q'(s) = q(s) - \Delta \quad \text{for all } s \neq r.
$$

Indeed, $q' - q = 2\Delta\, e_r - \Delta\, \mathbf{1}$; by shift-invariance, adding the constant $\Delta$ to every coordinate does not change the distribution, so this case is identical to $q' = q + 2\Delta\, e_r$.

### 4.2 Derivation via tight inequalities

The $\varepsilon$-differential privacy constraint requires, for score vectors $q, q' = q + 2\Delta\, e_r$ and all $r \in R$,

$$
\Pr[M(q) = r] \geq e^{-\varepsilon} \cdot \Pr[M(q + 2\Delta\, e_r) = r].
$$

This gives $\lvert R \rvert$ inequalities. To maximize the probability of selecting the highest-quality output, we

1. **Make the inequalities tight** for outputs with $q_r < q_*$: assign them the lowest probability consistent with differential privacy.
2. **Distribute the remaining probability evenly** among all outputs achieving $q_*$ (by symmetry).

Thus, we can solve the linear program given by the following $n = \lvert R \rvert$ equations:

$$
\Pr[M(\vec{q}) = r] =
\begin{cases}
\exp(-\varepsilon)\,\Pr[M(\vec{q} + 2\Delta\, \vec{e}_r) = r] & q_r \leq q_* - 2\Delta, \\
\dfrac{1}{n_*}\left(1 - \displaystyle\sum_{s :\, q_s < q_*} \Pr[M(\vec{q}) = s]\right) & q_r = q_*,
\end{cases}
$$

where $n_* = \lvert \\{r : q_r = q_*\\} \rvert$. Iterating the tight inequality $(q_* - q_r)/(2\Delta)$ times raises the score at $r$ all the way to $q_*$, giving the equivalent closed form

$$
\Pr[M(\vec{q}) = r] = \exp\!\left(\frac{\varepsilon}{2\Delta}(q_r - q_*)\right)\Pr[M(\vec{q}^{(r)}) = r], \qquad q_r < q_*,
$$

where $\vec{q}^{(r)}$ denotes $\vec{q}$ with its $r$-th entry raised to $q_*$.

In general, this optimization can be solved in $O(n \log n)$ time by sorting the scores. Permute-and-flip achieves this optimum in closed form.

### 4.3 Optimality statement

**Theorem 4.1.** The permute-and-flip mechanism is optimal among regular $\varepsilon$-differentially private mechanisms. That is, for any regular $\varepsilon$-differentially private mechanism $M'$,

$$
\mathbb{E}[q(D, M_{\mathrm{PF}}(D))] \geq \mathbb{E}[q(D, M'(D))].
$$

Moreover, permute-and-flip **stochastically dominates** the exponential mechanism.

**Theorem 4.2.** $M_{\mathrm{PF}}$ is never worse than $M_{\mathrm{EM}}$: for all $\vec{q} \in \mathbb{R}^n$ and all $t \geq 0$,

$$
\mathbb{E}[\mathcal{E}(M_{\mathrm{PF}}, \vec{q})] \leq \mathbb{E}[\mathcal{E}(M_{\mathrm{EM}}, \vec{q})], \qquad \Pr[\mathcal{E}(M_{\mathrm{PF}}, \vec{q}) \geq t] \leq \Pr[\mathcal{E}(M_{\mathrm{EM}}, \vec{q}) \geq t].
$$

## 5. Equivalence with Report Noisy Max

### 5.1 Report Noisy Max

The **Report Noisy Max** mechanism adds i.i.d. noise to each quality score and returns the argmax.

**Algorithm (Report Noisy Max with exponential noise).**

*Input:* database $D$, quality score function $q$, privacy parameter $\varepsilon$, sensitivity $\Delta$, output set $R$.

*Output:* a differentially private output $r \in R$.

1. For each output $r \in R$: sample $\eta_r \sim \mathrm{Exp}(\varepsilon / (2\Delta))$ and set $\tilde{q}(r) \gets q(D, r) + \eta_r$.
2. Return $\arg\max_{r \in R} \tilde{q}(r)$.

Here $\mathrm{Exp}(\lambda)$ denotes the exponential distribution with rate $\lambda$.

### 5.2 Why they are equivalent

The equivalence between permute-and-flip and Report Noisy Max with exponential noise follows from the **memoryless property** of the exponential distribution. To make this precise, we introduce two intermediate algorithms.

**Intermediate algorithm $A$.**

1. Compute $q_* = \max_i q(D, \omega_i)$.
2. For each $i$: set $v_i = q(D, \omega_i) + \mathrm{Exp}(\varepsilon/(2\Delta))$.
3. Form $S = \\{i : v_i \geq q_*\\}$.
4. Return a uniformly random element of $S$.

Algorithm $A$ adds exponential noise to each score, collects the outcomes whose noisy score reaches the true maximum $q_*$, and then selects uniformly at random from this set.

**Intermediate algorithm $B$.**

1. Compute $q_* = \max_i q(D, \omega_i)$.
2. For each $i$: set $\tilde{v}_i = \min\\{q_*,\; q(D, \omega_i) + \mathrm{Exp}(\varepsilon/(2\Delta))\\}$ and $z_i = \mathrm{Exp}(\varepsilon/(2\Delta))$.
3. Form $S' = \\{i : \tilde{v}_i = q_*\\}$.
4. Return $\arg\max_{i \in S'}(\tilde{v}_i + z_i)$, which equals $\arg\max_{i \in S'} z_i$ since $\tilde{v}_i = q_*$ on $S'$.

Algorithm $B$ **truncates** each noisy score at $q_*$, then adds fresh exponential noise $z_i$ and returns the argmax among the elements that reached the threshold.

**Theorem 5.1.** Permute-and-flip and Report Noisy Max with exponential noise produce identical output distributions.

*Sketch.* We chain four equivalences.

*(i) Permute-and-flip $\Leftrightarrow$ Algorithm $A$.* In Algorithm $A$, the probability that outcome $i$ enters $S$ (i.e. that $v_i \geq q_*$) equals $\exp(\varepsilon(q(D, \omega_i) - q_*) / (2\Delta))$, which is exactly the coin-flip probability in permute-and-flip. To see this, recall that for $X \sim \mathrm{Exp}(\lambda)$, $\Pr(X > x) = e^{-\lambda x}$. Setting $\lambda = \varepsilon/(2\Delta)$ and $x = q_* - q_r$ recovers the flip probability. Returning a uniformly random element of $S$ is equivalent to shuffling and returning the first element that lands in $S$.

*(ii) Algorithm $A$ $\Leftrightarrow$ Algorithm $B$.* The set $S' = \\{i : \tilde{v}_i = q_*\\}$ is exactly $S$ from Algorithm $A$. By the independence of the second noise process from the first, adding fresh exponential noise $z_i$ and taking the argmax is equivalent to picking a uniformly random element of $S'$.

*(iii) Algorithm $B$ $\Leftrightarrow$ Report Noisy Max.* Algorithm $B$ effectively adds exponential noise to every score and outputs the argmax; it just adds the noise in a conditional way, splitting it into a truncated piece and a fresh piece. This works because of the **memoryless property** of the exponential: for $X \sim \mathrm{Exp}(\lambda)$ and any $s, t \geq 0$,

$$
\Pr(X > t) = \Pr(X > t + s \mid X > s).
$$

Consequently the "chop and add fresh noise" procedure produces the same distribution as the original noise above the threshold. $\square$

## 6. Summary

The permute-and-flip mechanism is an optimal regular mechanism for $\varepsilon$-differentially private selection. It achieves a factor-of-two improvement in the exponent of the privacy-utility tradeoff compared to the classical exponential mechanism, and stochastically dominates it. Moreover, it is equivalent — as a randomized algorithm — to Report Noisy Max with exponential noise, via the memoryless property of the exponential distribution.

## References

[1] R. McKenna and D. Sheldon, "Permute-and-Flip: A New Mechanism for Differentially Private Selection," *Advances in Neural Information Processing Systems (NeurIPS)*, 2020.

[2] Z. Ding, D. Durfee, D. Kifer, R. M. Rogers, and L. Zhang, "The Permute-and-Flip Mechanism is Identical to Report-Noisy-Max with Exponential Noise," arXiv:2105.07260, 2021.
