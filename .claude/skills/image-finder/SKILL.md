---
name: image-finder
description: Find, licence-verify and prepare scientific figures and images for SciencePedia articles. Use when an article needs a figure, diagram or photo, or when auditing existing images for licence and attribution correctness.
---

# Image Finder

Step 8 of the article chain. Every image must be scientifically useful **and** legally clean.

## Preferred sources (in order)
1. **Public domain agencies** — NASA, NOAA, USGS, NIH, ESA, ESO (check per-image terms; NASA is generally PD, ESA is not always)
2. **Wikimedia Commons** — verify the specific file's licence, not the site's
3. **CC-BY / CC-BY-SA** from universities, museums, journals
4. **Open-access papers** — CC-BY figures, with the paper cited
5. **Generated diagrams** — SVG built from sourced data when nothing suitable exists

Never: Google Images results, stock sites without a verified licence, or anything whose licence cannot be named.

## Procedure
1. Read the article's figure requirements from the draft.
2. For each: search the tiers above, prefer a diagram that explains a mechanism over a decorative photo.
3. **Verify the licence on the file's own page.** Record licence type, holder, source URL and required attribution string.
4. Check scientific correctness — an outdated or mislabelled diagram is a factual error, not a design issue.
5. Write the caption: what it shows, why it matters, and any scale or units.
6. Write alt text: describe the scientific content, not "diagram of photosynthesis".
7. Prepare the asset: AVIF/WebP, ≥1200px wide for figures, explicit dimensions recorded.
8. If nothing suitable exists, record `no_figure: <reason>` — that is a valid outcome.

## Output
`content/figures/<slug>.yaml`: file, source URL, licence, attribution string, caption, alt text, dimensions, and the claim the figure supports.

## Rules
1. **No image without a named, verified licence.** "Probably fine" is not a licence.
2. **Attribution is rendered on the page,** not just stored.
3. **Every image earns its bytes** — scientific or navigational value only, no decorative stock.
4. **A wrong diagram is a factual error.** Route it to `science-editor`, not to design.
5. **Alt text describes the science.**
6. **Record dimensions** so the page reserves space and CLS stays at zero.

## Fails when
No correctly licensed, scientifically accurate image exists. Record the reason and publish without one — never publish an image with an unverified licence.
