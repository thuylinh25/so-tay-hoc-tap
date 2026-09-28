---
name: knowledge-graph-manager
description: Create and maintain SciencePedia entities and typed relationships — the knowledge graph that drives internal links, learning paths, related concepts and category placement. Use when adding an entity, linking concepts, building a learning path, or auditing graph integrity.
---

# Knowledge Graph Manager

Step 5 of the article chain, and the backbone every other structure projects from: internal links, clusters, learning paths, related concepts, breadcrumbs.

## Entity types
`Concept` `Phenomenon` `Organism` `Substance` `Object` `Process` `Theory` `Law` `Method` `Person` `Event` `Mission` `Dataset` `Quantity`

## Relationship types (typed and directional)
| Type | Meaning | Used for |
|---|---|---|
| `is-a` | taxonomic parent | category placement, breadcrumbs |
| `part-of` | composition | hub structure |
| `prerequisite-of` | must understand first | learning paths |
| `causes` | causal link | mechanism sections |
| `measured-by` | quantity → instrument/method | key facts |
| `discovered-by` | concept → person | history sections |
| `applies-to` | theory → domain | applications |
| `contrasts-with` | commonly confused | disambiguation |
| `example-of` | instance | illustrations |

## Procedure — add an entity
1. Search for an existing entity or alias. If found, **merge, do not duplicate**.
2. Assign the canonical name, entity type and aliases.
3. Reconcile externally: Wikidata QID, DOI, taxon ID, IAU designation — or record why not possible.
4. Add `is-a` and `part-of` edges to place it in the graph.
5. Add `prerequisite-of` edges — what must a reader understand first?
6. Add lateral edges: `contrasts-with`, `applies-to`, `example-of`.
7. Run the integrity check before committing.

## Procedure — build a learning path
1. Take the target concept, walk `prerequisite-of` edges backwards to foundations.
2. Topologically sort — the graph must be acyclic.
3. Verify every step has a published article; gaps become topic-queue items.
4. Emit the ordered path with an estimated reading time.

## Integrity checks (run on every change)
- No cycles in `prerequisite-of`
- No duplicate entities or colliding aliases
- No orphan entities (zero edges)
- No untyped edges
- Every published article maps to exactly one entity
- Every edge points at an entity that exists

## Output
Updated `content/graph/entities.yaml` and `content/graph/relationships.yaml`, plus the integrity report. Persisted through `supabase-manager` into `entities` and `relationships`.

## Rules
1. **One concept, one entity.** Aliases redirect; duplicates get merged.
2. **No untyped relationships.** A generic "related" edge is rejected — typed edges are what make links meaningful and paths computable.
3. **The prerequisite graph stays acyclic,** always. A cycle means the model is wrong.
4. **Edges are directional and asserted deliberately** — not inferred from co-occurrence or text similarity.
5. **Reconcile externally** or record the reason it is impossible.
6. **The graph leads, pages follow.** Internal links, categories and paths are derived from it, never hand-maintained separately.

## Fails when
An integrity check fails, or an entity cannot be placed without inventing a taxonomy branch. Stop and escalate to `knowledge-architect`.
