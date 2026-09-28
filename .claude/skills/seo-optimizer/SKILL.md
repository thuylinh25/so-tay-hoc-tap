---
name: seo-optimizer
description: Produce and validate everything a SciencePedia page needs to rank — content brief, metadata, JSON-LD, internal links, canonical and sitemap entry. Use when writing a brief, before publishing a page, or when auditing SEO health.
---

# SEO Optimizer

Two jobs: **write the brief** that starts an article, and **validate the SEO payload** before publish (step 6 of the chain).

## Mode A — Content brief (before writing)
Produce `content/briefs/<slug>.yaml`:
```yaml
target_query: "how does photosynthesis work"
intent: informational / explanatory
entities_to_cover: [chloroplast, RuBisCO, light reaction, Calvin cycle]
required_sections: [definition, mechanism, stages, importance, misconceptions]
internal_links_out: [chloroplast, cellular-respiration, carbon-cycle]
internal_links_in: [biology-hub, plant-biology]
snippet_target: "40-55 word definition in the opening paragraph"
title_pattern: "{Concept}: {angle} | SciencePedia"
```

## Mode B — Pre-publish validation
Check and emit:
1. **Title** — unique site-wide, ≤60 chars, matches intent
2. **Description** — unique, 140–160 chars, not a title restatement
3. **Canonical** — self-referencing, absolute, locale-correct
4. **URL** — `/{locale}/{discipline}/{slug}`, lowercase, hyphenated, permanent
5. **JSON-LD** — the right type, valid, and only marking up what is visible:
   - Article → `ScholarlyArticle` (+ `author`, `reviewedBy`, `datePublished`, `dateModified`, `citation`)
   - Concept → `DefinedTerm` in a `DefinedTermSet`
   - Every page → `BreadcrumbList`
6. **Headings** — exactly one `h1`, no skipped levels
7. **Internal links** — ≥3 contextual out, ≥1 in from the cluster hub
8. **hreflang** — complete and reciprocal across locales
9. **Sitemap** — correct shard, `lastmod` set
10. **Rendering** — the content is in the server-rendered HTML

## Output
`content/seo/<slug>.yaml` with the metadata payload, plus a pass/fail report listing any of the ten checks that failed.

## Rules
1. **Content must be in the server-rendered HTML.** If JavaScript is needed to see it, it does not count.
2. **One URL per concept.** Reading levels and print views are variants of one canonical, never separate pages.
3. **Never mark up what is not visible.** Fabricated structured data is a trust violation.
4. **No page passes without all ten checks green.**
5. **URLs never change** without a 301 map plus an internal-link rewrite.
6. **Never rewrite a claim for a keyword.** If SEO would distort the science, drop the recommendation.

## Fails when
Any of the ten checks fails, or the target query already has a ranking SciencePedia page — that is cannibalization; merge instead of publishing.
