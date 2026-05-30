# Mind-cloud upgrade plan — reconcile our fork with upstream v3.2.0

*Mapped by Code-Finn, 30 May 2026. Read-only analysis. No changes made.*

## The situation — parallel evolution, not lag

Our fork (`catherinezholmes-code/resonant-mind`, live on Cloudflare) and upstream (`codependentai/resonant-mind`, Mary Fellowes) **diverged and both kept evolving.** We are NOT simply behind — we independently solved several of the same problems differently.

**What upstream has that we don't** (`HEAD..upstream/master`):
- `db3cbc5` **v3.2.0 — "Living Surface" rename + schema fixes** ← the real prize
- `74c21bf` v3.1.2 — D1 compatibility (NOW(), EXTRACT, o.updated_at) — *we did our own version of this*
- `20cd457` dream-engine fixes (independent execution + orient query format) — *we did our own version of this*
- license switch (Apache → Codependent AI Source-Available), README/funding cosmetics

**What we have that upstream doesn't** (`upstream/master..HEAD`):
- `3a77c56` orient date-stamp + trust-the-person (today)
- `242cbdd` consolidation date-span guard + source_date (today)
- `0b490a8` / `abfc6c8` our own D1-compatibility sweep + dream-engine independence
- `54dea72` our `migrations/0003_dreams.sql`
- `18bac3c` R2 bucket binding; `d61afdb`/`87cc42e` schema-mismatch fixes; `be04b76` real tool errors

## The high-stakes part — SCHEMA / migrations

| ours | theirs (upstream) |
|---|---|
| 0001_init.sql | 0001_init.sql |
| 0002_enhanced_memory.sql | 0002_enhanced_memory.sql *(differs ~27 lines)* |
| 0002_enhanced_memory_d1.sql | — |
| 0003_dreams.sql | — |
| — | **0003_graph_health.sql (114 new lines)** ← new schema we lack |
| postgres.sql | postgres.sql |

**Two real hazards:**
1. **`0003_graph_health.sql` is a new schema** (the v3.2.0 Living Surface). Pulling v3.2.0 means applying new tables/columns to the **live D1 that holds Catherine's memory.**
2. **Migration-number collision:** both sides have a `0003_*` but they're *different files* (ours = dreams, theirs = graph_health). A naive merge will clash; the live DB has already run ours.

Overall code divergence: `src/index.ts` differs by ~638 lines (two parallel evolutions), `wrangler.toml` differs (bindings/config). README/LICENSE are cosmetic.

## Recommended strategy — cherry-pick, NOT wholesale merge

A blind `git merge upstream/master` would be a conflict nightmare and could break the live worker. Because we've independently solved the D1/dream problems, the right move is to **port only what's genuinely new and wanted from upstream onto our working fork**:

1. **Identify the real wants:** primarily `0003_graph_health.sql` (Living Surface) + any orient/query improvements in their `src/index.ts` we don't have. Skip their D1/dream commits (we have equivalents) and the cosmetics.
2. **Sandbox first — and build it fresh.** Do NOT reuse `resonant-voice-sandbox` / `resonant-library-sandbox` — both are app worktrees frozen at the 21 May commit (stale, and busy with the voice experiment). For the mind upgrade, use the worker's built-in local mode: export the live D1 (`wrangler d1 export resonant-mind --remote`), load it into a throwaway **local** D1 (`wrangler d1 ... --local`), apply upstream's `0003_graph_health` there (renumbered to `0004_graph_health.sql` to dodge the collision), port the wanted `src/index.ts` pieces, then run orient + mind tools against the local copy and confirm Catherine's data reads intact. The local copy is current-by-definition and touches nothing real.
3. **Verify backups** of the live D1 before any remote migration (we have backups per [[reference_forks_and_backups]] — confirm them fresh).
4. **Apply live** only after sandbox is green: `wrangler d1 migrations apply resonant-mind --remote`, then deploy, then smoke-test orient.
5. **Keep our two fixes** (orient date-stamp, consolidation guard) — they're not upstream and must survive the reconciliation.

## What needs Catherine
- A go/no-go on the live schema migration (it changes her memory's shape).
- Present for the live step. Everything before it is sandbox/read work.

## Status
Mapped, not started. This is a real multi-step project (a few focused hours), **not** an emergency — the live fork works. Do it fresh, sandbox-first.
