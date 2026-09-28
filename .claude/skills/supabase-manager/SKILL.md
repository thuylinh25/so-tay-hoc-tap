---
name: supabase-manager
description: Manage the Supabase layer — schema, migrations, RLS policies, queries, types, storage and search indexes. Use for any database change, new table or policy, query optimization, type generation, or writing content through the publish pipeline.
---

# Supabase Manager

Step 10 of the article chain (writing the revision), and the tool for every database change.

## Core tables
```
entities(id, canonical_name, entity_type, wikidata_qid, aliases[])
relationships(from_entity, to_entity, rel_type, weight)
taxonomy_nodes(id, parent_id, slug, title, depth)
articles(id, entity_id, primary_category, slug, locale, state, current_revision)
revisions(id, article_id, body, claim_map, generation_run, created_at)
sources(id, tier, title, doi, url, retracted_at)
citations(revision_id, source_id, claim_ref)
figures(id, article_id, url, licence, attribution, alt_text)
translations(article_id, locale, source_revision, state)
```

## Procedure — schema change
1. Write a forward-only migration in `supabase/migrations/`.
2. Additive first: add column → backfill in batches → switch reads → drop later.
3. Build indexes `CONCURRENTLY`; state the lock level in the migration header.
4. Add or update the RLS policy in the same migration — never a table without one.
5. Add the adversarial test: wrong role attempts the operation, expects denial.
6. Regenerate types → `src/lib/database.types.ts`.
7. Apply to preview, verify, then production.

## Procedure — publishing an article
1. Insert a new `revisions` row (never mutate published text).
2. Write citations, figures and relationship edges.
3. Move `articles.state` to `published` and point `current_revision` at the new row.
4. Refresh affected materialized views (hub, category, sitemap shard).
5. Fire the revalidation webhook with the cache tags for page, hub, category and sitemap.

## Query patterns
- Article page: **one query**, <50ms p95 — denormalized read model, not render-time joins.
- Search: `tsvector` weighted title > summary > body, `pg_trgm` for fuzzy titles.
- Related concepts: `pgvector` ANN, pre-filtered by locale and discipline.
- Lists: keyset pagination. Never deep `OFFSET`.

## Rules
1. **RLS on every table.** Default deny. No RLS, no merge.
2. **Service-role key stays server-side** — never in a Client Component, bundle or log.
3. **Content is append-only.** Publishing creates a revision and moves a pointer.
4. **No provenance, no publish.** Every claim links to sources and its generation run.
5. **Every index justified in writing** by a real query; verify with `EXPLAIN ANALYZE` on production-sized data.
6. **No blocking locks** on tables above 1M rows.
7. **Constraints in the database,** not just in application code.
8. **No manual production changes** — migrations and reviewed code only.

## Fails when
A migration needs a destructive single step, or an RLS policy cannot be expressed. Stop and redesign with `backend-architect` rather than shipping a table without protection.
