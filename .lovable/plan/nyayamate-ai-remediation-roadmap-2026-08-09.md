# NyayaMate AI — Remediation Roadmap

Derived from the production audit. Nothing here is built yet; approve to start Phase 1.

## Phase 1 — Must fix before Demo

1. **Drain the failed ingestion queue.** 192 jobs failed with embedding 429s. Add retry with exponential backoff and a serialized job runner so only one embedding request is in flight, plus an admin "Retry failed jobs" action on the KB Sync page.
2. **Improve chunking depth.** Current average chunk is 505 characters, ~1 per record. Compose richer markdown per CMS record (include procedures, required documents, eligibility, fees, official links) and split at ~800–1200 characters with overlap.
3. **Attach official sources to all 8 legal topics.** Map each topic to an existing verified source so trust badges and citations are actually backed.
4. **Seed complaint templates.** Populate the empty table with the core consumer, police, RTI and grievance templates the feature already renders.
5. **Run link verification across all 32 sources** and fix or retire anything broken; 6 have never been checked.
6. **Smoke-test the AI path end to end** on 15 representative questions and record the results, so answer quality has evidence behind it.

## Phase 2 — Before Beta launch

7. Scheduled link verification (weekly) instead of manual-only, moved off the request path.
8. Batch the link checker so it cannot exceed serverless CPU/time limits as sources grow.
9. JSON-LD structured data: `FAQPage` on FAQs, `GovernmentService` on service detail, `BreadcrumbList` on all detail routes.
10. Expand content toward credible coverage: target 40 services, 25 legal topics, 20 schemes, 80 FAQs, 60 glossary terms.
11. Consolidate the duplicated admin surfaces (`knowledge-health` appears twice; `content-health` overlaps `content-ops`).
12. Split `src/routes/api/chat.ts` (635 lines) into retrieval, ranking, prompt, and logging modules.
13. Decide the intended audience for `match_chunks` and lock its EXECUTE grant to match; today anon can run it.
14. Rotate the kb-sync webhook off the publishable key onto a dedicated secret, since the publishable key is browser-exposed.
15. Add a feedback prompt after AI answers so the review queue receives real signal.

## Phase 3 — Production scale

16. Trigram or full-text indexes on FAQs, schemes, glossary, services and topics; replace `ilike` scanning in global search.
17. Cache public CMS reads (stale-while-revalidate) instead of hitting Postgres per visit.
18. Trim unused UI dependencies (carousel, chart, day-picker if unused) and audit bundle size.
19. Add a test suite covering auth, search, chat rate limiting, and the sync engine.
20. Paid embedding tier or a queue with a rate budget, so ingestion throughput stops being the ceiling.

## Technical notes

- Ingestion retry belongs in `src/lib/kb-sync.server.ts`, surfaced through `src/routes/_authenticated/admin/kb-sync.tsx`.
- Chunk composition also lives in `kb-sync.server.ts`; re-sync is required after changing it so existing documents are re-chunked.
- Link checker batching affects `src/lib/contentops.functions.ts` (`verifyOfficialLinks`, currently up to 500 URLs at concurrency 6 in a single call).
- Source attachment for legal topics is a data migration, not a code change.
- Grant and secret changes are migrations plus one env secret; no schema changes needed.
