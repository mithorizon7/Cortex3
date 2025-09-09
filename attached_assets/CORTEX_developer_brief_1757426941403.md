Below is a **clear developer brief** for the first release of the CORTEX website—focused, pragmatic, and scoped to the features we agreed to ship now.

---

# 1) What this program is (conceptual overview)

**CORTEX** is an executive AI‑readiness program. It helps leadership teams quickly:

1. understand their organization’s AI context and constraints,
2. assess current readiness across six domains (C‑O‑R‑T‑E‑X), and
3. receive concise, credible guidance on what matters and how to improve.

**Key principles**

* **Useful > flashy.** Leaders should leave with insight they trust, not just a chart.
* **Context‑aware, score‑neutral.** We tailor guidance to the org’s context, but we **never** manipulate the assessment scores.
* **Fast & honest.** Short inputs, clear outputs, transparent logic.

---

# 2) What we are building now (this website, v1)

A simple, high‑trust workflow:

1. **Onboarding + Context Profile (CCP)** – \~4 minutes
   A short questionnaire (12 items) that captures the organization’s operating context (e.g., regulatory intensity, data sensitivity, clock‑speed, latency needs, build readiness).

2. **Pulse Check (18 Yes/No)** – \~6–8 minutes
   The universal CORTEX v3.2 pulse: three binary items per pillar (C, O, R, T, E, X). Binary is deliberate: fast and decisive.

3. **Results & Guidance**

   * **Honeycomb Radar** visualization (six hexes × 4 stages) with **equal‑area rings**.
   * **Domain cards** that explain:

     * *Why this pillar matters* (business‑impact framing, not jargon),
     * *What “good” looks like* (clear, observable practices),
     * *How to improve* (2–4 practical suggestions), lightly tailored by the context profile.
   * **Context‑driven “Gates”** (non‑negotiables) called out at the top if applicable (e.g., “Because your Safety=High, implement Human‑in‑the‑Loop before scaling high‑impact use‑cases”). These are informational in v1 (no workflows).

4. **Export**
   One‑click PDF (and JSON) that includes the context profile summary, the radar, domain guidance, and any gates.

**Out of scope for v1**

* Buy‑vs‑Build Navigator / DECIDE scorecard
* Governance Hub, Portfolio Gate, RACI builder, budgeting, scenario planning
* Deep planning workflows or task management

---

# 3) High‑level instructions (what to build and why)

## A) Onboarding + Context Profile (CCP)

* Render **12 inputs** (sliders 0–4 for 10 items + 2 yes/no).
* Store as a compact vector (integers/booleans).
* After submit, compute **informational gates** (predicate rules) and save for display on the Results page.
* **Do not** change pillar scores based on profile.

**CCP dimensions (0–4 unless noted):**

1. Regulatory intensity
2. Data sensitivity & residency
3. Safety/mission criticality
4. Brand/PR exposure
5. Market/tech clock‑speed
6. Latency/edge dependence
7. Scale/throughput
8. Proprietary data advantage
9. Build readiness
10. FinOps priority
11. Procurement constraints (Yes/No)
12. Edge operations (Yes/No)

**Gates (informational in v1; show as callouts if triggered)**

* HITL required (high regulation or safety)
* Assurance cadence (monthly fairness/privacy/drift + annual governance review if regulated)
* Data residency/retention guardrails (high sensitivity)
* Latency fallback/SLO (high edge/latency)
* Scale hardening (load tests, rate limits, dual region/vendor)
* Build readiness gate (low readiness → advise Buy→RAG before Heavy Build)
* Procurement/public sector nudges
* OT/Edge ops security nudges

> **Important:** For every gate, display a brief “because” explanation tied to the triggering profile dimensions.

---

## B) Pulse Check (18 Yes/No)

* Three binary items per pillar (C, O, R, T, E, X) from v3.2.
* Optional **Confidence** selector (Low/Med/High) per answer is nice-to-have (helps trust calibration), but you can omit if it complicates v1.
* Compute a stage score 0–3 for each pillar: 1 point per “Yes.”

---

## C) Honeycomb Radar (equal‑area hex rings)

* Six large hexes arranged around a central hub.
* Each hex shows maturity **0–3** with **equal‑area** concentric steps to avoid area illusions.

**Equal‑area ring math (use this):**
If `r_max` is the outer radius and you have **N=4** stages, radius for stage `k` (k∈{0..3}) is:

```
r_k = r_max * sqrt(k / 3)   // if 0..3 is the *filled* level
```

Or, if you prefer strictly 1..4 steps, adapt to:

```
r_k = r_max * sqrt(k / 4)
```

* Include labels and a clean legend.
* Provide an **alt-table** view (six rows with numeric stage values) for accessibility/export.

---

## D) Results & Guidance (insight-first, not hand-holding)

**Top section: Context Gates (if any)**

* Show 0–3 concise callouts: “Because your profile shows X, before scaling we recommend Y.”
* Each callout links to a short micro‑guide (300–500 words).

**Main section: Honeycomb Radar + Domain Cards**
For each pillar, show a **Domain Card** with:

1. **Why this matters** (business impact in plain English)
2. **What good looks like** (observable, credible)
3. **How to improve** (2–4 practical suggestions, lightly tailored by profile)

> Keep suggestions specific but not prescriptive workflows. Think: “Turn on drift alerts; publish a 1‑page incident runbook; define a use‑case intake template.”

**Micro‑guides library (lightweight content routing)**

* Each gate and each pillar pulls a relevant micro‑guide.
* Tailor by context tags (e.g., `regulated`, `high_sensitivity`, `edge`, `low_readiness`) to swap examples/KPIs.

**Export**

* PDF: logo, org name, date, CCP summary (sliders), radar, gates, domain cards, links to micro‑guides.
* JSON: profile vector, pillar scores, gate flags, and IDs of the micro‑guides included.

---

# 4) Core site sections (for v1)

1. **Welcome / Onboarding**

   * Explain what CORTEX is and how results are used.
   * Context Profile (12 items) → Save → brief profile summary.

2. **Pulse Check**

   * 18 Yes/No items → scores computed inline.

3. **Results**

   * Honeycomb Radar (equal‑area).
   * Context Gates (if triggered) with links to micro‑guides.
   * Six Domain Cards with “why / what good looks like / how to improve.”
   * Export (PDF + JSON).

4. **Glossary & FAQs** (static)

   * Define CoE, BU, HITL, MLOps, SLA, RACI, RAG, etc.

*(No Buy‑vs‑Build, no governance hub, no planning flows in v1.)*

---

# 5) Interaction patterns (to make it sticky)

* **Progress markers:** “Step 1 of 3,” “Step 2 of 3,” etc., with estimated time remaining.
* **Inline tooltips** for jargon; keep language plain.
* **“Because…” transparency:** all gates and tailored tips reveal *why* (which profile answers triggered them).
* **Reflection prompts** at the bottom of Results: “What surprised you? Which two domains feel most important?” (No tasks yet—just reflection.)
* **Save & resume** link; email the export to self (optional).
* **Gentle nudge** to return quarterly: “Re‑take in 90 days to track progress.”

---

# 6) Guardrails for real usefulness

* **Do not alter scores** with the profile—scores come only from the Pulse.
* **Use equal‑area rings** to avoid visual distortion.
* **Accessibility:** WCAG AA; alt‑table for the radar; keyboard/ARIA for forms; avoid color‑only cues.
* **Plain language everywhere;** no acronyms without tooltips.
* **Privacy:** store profile as integers/booleans; avoid free‑text PII; secure any file links.
* **Transparency:** show exactly why a gate or suggestion appeared (no black boxes).
* **Performance:** render radar smoothly on mobile; avoid heavy libraries; precompute hex paths.
* **No fake benchmarks.** If we don’t have cohort data yet, don’t show benchmarks.

---

# 7) First release scope (MVP that still wows)

**Must‑haves**

* Onboarding + full **Context Profile** (12 Q)
* **Pulse 18** (with immediate scoring)
* **Honeycomb Radar** with **equal‑area** math + alt‑table
* **Context Gates** callouts (info only)
* **Domain Cards** with tailored micro‑guides (per pillar)
* **Export** (PDF + JSON)

**Nice‑to‑haves (if time permits)**

* Optional **Confidence** selector per pulse item
* Minimal **evidence attachment** (URL field only) on Results
* “Re‑take in 90 days” reminder toggle

**Deliberately out for v1 (later releases)**

* Buy‑vs‑Build Navigator / DECIDE
* Governance Hub (SLA builders, incident runbooks authoring)
* Portfolio Gate / intake workflows
* Team alignment heatmaps / multi‑user compare
* Scenario planning, budgets, target states, RACI builder

---

# 8) Suggested high‑level tech choices (you decide specifics)

* **Frontend:** React (or your preferred modern framework). Canvas or SVG for the radar; Canvas is smoother; SVG is easier for crisp labels—either is fine.
* **State & API:** Minimal REST endpoints; local state for form steps; persist profile + pulse + computed results.
* **PDF export:** Client‑side (html‑to‑pdf) or server‑side render—your call; ensure prints cleanly.
* **Internationalization:** Keep copy strings centralized for future i18n.

---

# 9) Acceptance criteria (v1)

1. User can complete the **Context Profile** and see a short profile summary.
2. User can complete the **Pulse** and see pillar scores (0–3 each).
3. **Honeycomb Radar** renders with equal‑area rings and is legible on mobile and desktop; alt‑table view exists.
4. **Context Gates** appear only when triggered and include a transparent “Because…” explanation.
5. Each pillar shows a **Domain Card** with **why / what good looks like / how to improve**; content is lightly tailored by profile tags.
6. Export generates a **single PDF** and **JSON** snapshot with profile, scores, gates, and domain insights.
7. No benchmarks, no planning flows, no score manipulation by profile.

---

## Appendix: Domain Card content (tone & structure)

Each card should be \~120–180 words, split as:

* **Why this matters:** tie to cost/revenue/risk/customer trust.
* **What good looks like:** 3–5 observable statements (e.g., “Quarterly board review of AI OKRs”).
* **How to improve:** 2–4 suggestions (e.g., “Publish a one‑page use‑case intake template”).

**Tailoring by profile**
Swap examples/kickers with simple tags like `regulated`, `high_sensitivity`, `edge`, `low_readiness`, `data_advantage`.

---

### Final note

Keep it **clean, fast, and honest**. Leaders will forgive missing bells and whistles if the **logic is transparent**, the **radar is truthful**, and the **guidance is practical**. This v1 should feel complete in under an hour and good enough to share with a board.
