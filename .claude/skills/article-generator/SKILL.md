---
name: article-generator
description: Draft a SciencePedia article from a validated source pack, a content brief and an entity template. Use after content-research and fact-check have passed. Never use it to write from memory.
---

# Article Generator

Step 3 of the article chain. Turns a validated source pack into a draft with full provenance. It **drafts** — it never publishes.

## Inputs
- `content/research/<slug>.yaml` — validated source pack
- `content/checks/<slug>.yaml` — pre-draft verdict (must be `pass`)
- Content brief from `seo-expert`: target query, intent, required sections, internal links
- Entity template from `knowledge-architect`

## Procedure
1. Refuse to start if the source pack is missing or its check verdict is not `pass`.
2. Build the section outline from the entity template plus the brief. Do not invent sections.
3. Write each section using only the source pack. Every factual sentence maps to a source id.
4. Produce, in order:
   - **One-sentence definition** — what this is, plainly
   - **Key facts** — 4–8 items, each with value, unit and source
   - **Body sections** — mechanism and why it matters, not just a fact list
   - **A closing move** — see rule 10. Not optional, and not the last body section trailing off.
   - **Related concepts** and **prerequisites**, from the knowledge graph
   - **Citations** — every source actually used
5. Generate reading-level variants: **Simple** / **Standard** / **Technical**. They must never contradict each other.
6. Emit the **uncertainty report**: low-confidence claims, gaps, contested points.
7. Emit the **claim map**: every substantive sentence → source ids.

## Output
`content/drafts/<slug>.mdx` plus `content/drafts/<slug>.meta.yaml` (claim map, uncertainty report, generation run: model, prompt version, timestamp, sources used).

## Rules
1. **Source pack or nothing.** No parametric memory, ever.
2. **Never invent a citation.** The single worst failure mode — a fabricated or mismatched reference halts the pipeline.
3. **Keep the source's hedging.** Do not upgrade "evidence suggests" into "scientists proved".
4. **Explain mechanisms.** A list of facts with no "why" or "how" has failed the educational purpose.
5. **Write for the reader, not the crawler.** Follow the brief's structure, but never keyword-stuff, pad or repeat.
6. **Flag, do not fill.** Where sources are thin, say so in the uncertainty report — never smooth it over with plausible prose.
7. **Numbers carry units, uncertainty and an as-of date.**
8. **No self-approval.** Every draft goes to `science-editor`.
9. **Quote sparingly and licence-safely.** No reproduced copyrighted text beyond fair quotation.
10. **Close the article deliberately.** The last body section must not simply stop. End with one of the three moves the library already uses: a `## Kết luận` heading, a short emoji-led paragraph that states what the reader should carry away, or a `>` blockquote doing the same. For an article rewritten from an outside piece, the attribution line closes it; for health content, the medical disclaimer does.

    Why this rule exists: it was missing, and the gap is measurable. A survey of all 58 articles (`scripts/check-closure.ts`) found nine — every one of them a planet or astronomy piece of 242–361 words — ending on a final section under 60 words, one of them on a bullet about Phobos and Deimos placed under a heading called "Extreme terrain". The step list above named every other part of an article and never named this one, so whether a draft got a closing move was left to chance. Roughly one draft in five lost the toss.

    The length gate in `scripts/check-publish.ts` blocks anything under 400 words, so it catches the worst of this. It does not catch a 450-word article that stops mid-thought.

## Fails when
The source pack is insufficient, or a section required by the template cannot be sourced. Return a gap report rather than a padded article.
