---
name: translation
description: Translate SciencePedia articles into another locale with terminology control, and keep translations in sync with their source. Use when adding a locale, translating an article, or when a source article changes and its translations go stale.
---

# Translation

Step 9 of the article chain. A translation is a publication, held to the same accuracy bar as the original.

## Inputs
Approved source article, the per-locale glossary (`content/glossary/<locale>.yaml`), and the entity record with its locale aliases.

## Procedure
1. Check the source article is `reviewed` — never translate a draft.
2. Load the locale glossary: approved terms, and the do-not-translate list.
3. Translate section by section, preserving structure, claim boundaries and hedging.
4. Apply terminology: every glossary term uses its approved form, consistently.
5. Leave untranslated: binomial nomenclature, chemical formulas, SI symbols, mathematical notation, proper nouns with no established local form.
6. Localize formats: decimal separator, digit grouping, dates, unit conventions, name order.
7. Translate metadata too — title, description, slug — and register hreflang both ways.
8. Flag anything where the target language has no precise equivalent; do not guess.
9. Route to a domain reviewer in that language before publish.
10. Record `source_revision` so staleness can be detected later.

## Output
`content/translations/<locale>/<slug>.mdx` plus a metadata record with `source_revision`, terminology conformance score, reviewer and review date.

## Rules
1. **Translation is publication** — same `fact-check` and `science-editor` bar. Machine output never publishes unreviewed.
2. **Meaning over literalness.** A literal translation that misleads is a defect.
3. **Terminology is enforced, not suggested.** Inconsistent scientific terms destroy trust faster than awkward phrasing.
4. **Never partially translate a page.** Missing translation → show the source language with an honest notice.
5. **Depth before breadth.** Finish the core tier in one locale before starting another.
6. **Stale is flagged visibly.** When the source changes, mark the translation out of date until re-reviewed.
7. **hreflang must be complete and reciprocal** or locales cannibalize each other.
8. **RTL is verified with real content,** including embedded LTR formulas, before a locale launches.

## Fails when
The glossary lacks a term central to the article, or no domain reviewer is available for that language. Queue it rather than publishing unreviewed.
