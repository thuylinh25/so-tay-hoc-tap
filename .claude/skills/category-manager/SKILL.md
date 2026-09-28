---
name: category-manager
description: Place articles in the SciencePedia taxonomy and keep the category tree healthy. Use when publishing an article, creating or renaming a category, resolving where a topic belongs, or auditing the tree for depth, duplication and thin branches.
---

# Category Manager

Step 7 of the article chain, plus ongoing taxonomy maintenance.

## Inputs
`content/taxonomy.yaml`, the entity record, and the article's subject matter.

## Procedure — placing an article
1. Read the entity's `is-a` and `part-of` relationships from the knowledge graph — placement follows the graph, it does not invent a new opinion.
2. Assign **one primary category** (drives the URL and breadcrumbs).
3. Assign **secondary categories** for cross-listing (never affect the URL).
4. Verify the category exists, is not a leaf-with-one-child, and is ≤5 levels deep.
5. Write the placement plus breadcrumb trail back to the article record.
6. Confirm the category hub links to the article and the article links back.

## Procedure — creating a category
1. Confirm no existing category or alias already covers it.
2. Require **≥5 articles** planned or published, or it is a tag, not a category.
3. Attach it to exactly one parent; depth ≤5.
4. Register the slug, title, description and cluster-hub page.
5. Bump the taxonomy version and record the change.

## Procedure — audit
Report: categories with <3 articles (thin), >200 articles (needs splitting), depth >5, no hub page, duplicates or near-synonyms, and any article with no category.

## Output
Updated `content/taxonomy.yaml` (versioned), the article's category assignment and breadcrumb trail, and an audit report.

## Rules
1. **One primary category per article.** Multiple primaries mean the taxonomy is wrong.
2. **Placement follows the knowledge graph,** never search volume.
3. **Five levels maximum.**
4. **Never rename a category in place** — it changes URLs. Version, migrate, 301.
5. **A category needs a hub page** with an intro and a curated list, or it is not a category.
6. **No article without a category.** Uncategorized means orphaned means invisible.

## Fails when
The right category does not exist and the branch is unmodeled. Stop and hand it to `knowledge-architect` — do not improvise a category to unblock a publish.
