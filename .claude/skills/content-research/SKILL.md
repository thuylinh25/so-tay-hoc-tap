---
name: content-research
description: Gather and rank authoritative sources for a science topic before any writing happens. Use at the start of every article, when expanding a section, or when checking whether a topic has enough sourcing to justify an article at all.
---

# Content Research

Step 1 of the article chain. Produces the **source pack** that everything downstream is built on. No drafting happens until this runs.

## Inputs
- Topic + entity type (from `knowledge-architect`)
- Content brief: target query and intent (from `seo-expert`)

## Procedure
1. Read the entity record: canonical name, aliases, external IDs (Wikidata QID, DOI, taxon ID).
2. Search tier by tier, stopping when coverage is sufficient:
   - **Tier 1** — peer-reviewed primary literature, systematic reviews
   - **Tier 2** — authoritative bodies: NASA, NOAA, NIH, CERN, IPCC, WHO, USGS, IAU, national academies
   - **Tier 3** — university and museum educational resources
   - **Tier 4** — reputable science journalism (context only, never sole support)
3. For each source record: title, author/institution, publication date, URL/DOI, tier, and the specific passages that matter.
4. Extract the **key facts** — numbers with units, dates, mechanisms, named results — each tied to its source passage.
5. Note conflicts between sources, open questions, and anything the sources hedge.
6. Check currency: is any source retracted, superseded, or past its useful date?
7. Decide: **sufficient** (≥3 independent Tier 1–2 sources) or **insufficient** → return a gap report instead of proceeding.

## Output
`content/research/<slug>.yaml`:
```yaml
topic: photosynthesis
entity_id: Q11982
sufficient: true
sources:
  - id: s1
    tier: 1
    title: "..."
    doi: "10.xxxx/xxxxx"
    date: 2023-04-11
    passages: ["...", "..."]
key_facts:
  - claim: "C3 plants fix CO2 via RuBisCO"
    sources: [s1, s3]
    confidence: high
conflicts: []
open_questions: ["..."]
gaps: []
```

## Rules
1. **Never write from memory.** Everything downstream cites this file.
2. **Minimum three independent Tier 1–2 sources.** More for health and contested topics.
3. **Record the passage, not just the URL.** A citation nobody can locate inside the source is unverifiable.
4. **Preserve hedging verbatim.** "May contribute to" stays "may contribute to".
5. **Return a gap report rather than a thin source pack.** Insufficient sourcing means no article — that is a valid, useful outcome.

## Fails when
Fewer than three qualifying sources, all sources are Tier 3–4, or the topic's key claims cannot be traced to a primary source. Report the gap to `knowledge-architect` and stop.
