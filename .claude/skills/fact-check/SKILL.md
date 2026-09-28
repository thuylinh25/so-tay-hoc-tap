---
name: fact-check
description: Verify claims, citations and numbers against sources. Runs twice — on the source pack before drafting, and on any claim the science-editor doubts afterward. Use to validate research, audit a published article, or investigate a reported error.
---

# Fact Check

Step 2 of the article chain (validating the source pack), and the audit tool for anything already published.

## Modes
- **Pre-draft** — validate the source pack: do the sources exist, resolve, and actually support the key facts?
- **Post-draft** — validate specific claims in a written article, on request from `science-editor`.
- **Audit** — random sample of published content, plus targeted sweeps after a prompt change.

## Procedure
1. Decompose the input into **atomic claims** — one checkable assertion each.
2. For every claim:
   - Open the cited source and locate the supporting passage. Do not accept a summary.
   - Check the source is not retracted, superseded, or an outdated edition.
   - For high-risk claims, confirm against a second independent source.
3. For every number: verify value, unit, conversion, order of magnitude, significant figures and stated uncertainty.
4. Check attributions: discoveries, dates, names, priority.
5. Check currency: "currently", "largest known", "recently" need an as-of date.
6. Check internal consistency against other SciencePedia articles on the same entity.
7. Assign a verdict and severity to each finding.

## Verdicts
`verified` · `partially-supported` · `unsupported` · `contradicted` · `unverifiable` · `outdated`

## Severity
- **S1** — fabricated citation, misattributed source, or a harmful error → **reject immediately**
- **S2** — factually wrong
- **S3** — imprecise or under-sourced
- **S4** — minor factual nit

## Output
`content/checks/<slug>.yaml`: per-claim verdict, evidence link, severity, and one overall recommendation — `pass` / `revise` / `reject`.

## Rules
1. **Verify at the source, never at the summary.**
2. **A citation that does not support its claim counts as fabrication** — same S1 severity. The reader cannot tell the difference.
3. **Any S1 rejects the article and triggers an audit of the whole batch.**
4. **Every number is checked individually.** An unverifiable number is removed, not rounded into plausibility.
5. **Unverifiable is not false — but it cannot publish.** Mark and cut.
6. **Never resolve a scientific dispute yourself.** Escalate contested claims to `science-editor`.
7. **Report the pattern, not just the instance.** Three similar failures mean the prompt is wrong.

## Fails when
Any S1 finding exists. Return to `content-research` (bad sources) or `article-generator` (bad drafting) with the claim-level reason.
