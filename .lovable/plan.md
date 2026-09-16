# NyayaMate AI — Complete Project Inventory (16 Sep 2026)

Verified against the live database and current code. Inventory only, no redesign proposals.

## 1. Project overview
- Name: NyayaMate AI — Indian legal rights & government services guidance
- Architecture: full-stack React app with server functions, server-rendered pages
- Frontend: React 19, TanStack Router/Query, Tailwind v4, shadcn/ui
- Backend: Lovable Cloud (Postgres + auth + storage), server functions, 3 API routes
- Database: 33 tables, pgvector for AI retrieval
- Auth: email/password + protected route gate + roles table
- AI: chat with retrieval, embeddings, citations, daily usage limits
- Deployment: published and live

## 2. Routes (50 files)
Public (28) ✅: `/`, about, contact, login, signup, reset-password, government-services (+detail), legal-rights (+detail), schemes (+detail), laws (+detail), legal-knowledge, official-sources, faqs, glossary, search, complaint-templates (+detail 🟡 build error), privacy-policy, terms, disclaimer, accessibility, sitemap.xml
Signed-in (11) ✅: dashboard, ai-chat, chat-history, knowledge-base, knowledge-health, retrieval-analytics, saved, profile, settings
Admin (10) ✅: analytics, ai-usage, content-health, content-ops, kb-sync, knowledge-health, launch-readiness, notifications, official-sources, review-queue
API (3) ✅: chat, kb-sync webhook, verify-links

## 3. Page-by-page
All pages below exist, are responsive, use live database data and have their own page metadata.

| Page | In menu | In footer | Status |
|---|---|---|---|
| Homepage, About, Contact | yes | yes | ✅ |
| Login, Signup | yes | login only | 🟡 old design, dead DigiLocker/OTP/Guest buttons |
| Forgot password | no | no | ✅ |
| Government Services (+detail) | yes | yes | ✅ |
| Legal Rights (+detail) | yes | yes | ✅ |
| Schemes (+detail) | yes | yes | ✅ |
| Official Sources | no | yes | ✅ |
| Legal Knowledge Center | no | no | 🟡 unreachable by navigation |
| Law Explorer, Law details | no | no | 🟡 only via Knowledge Center |
| Complaint Templates (+detail) | no | no | 🟡 detail page has a code error |
| FAQs, Glossary | yes | yes | ✅ |
| Search | no | yes | ✅ |
| Dashboard, Profile, Settings | sidebar | n/a | ✅ |
| Privacy, Terms, Disclaimer, Accessibility | no | yes | ✅ |
| Admin, ContentOps, Knowledge Base, Analytics | sidebar | n/a | ✅ |

## 4. Components
✅ Navbar, Footer, Dashboard sidebar, Logo, Breadcrumbs, Page shell, Search (global + in-page), FAQ accordion, Language switcher, Trust banner, Trust badges, Verified badge, Official actions, AI chat panel, Ask AI, AI disclaimer, AI citations, Helpful feedback, Skip-to-content, Upload dropzone, Document preview, Metadata dialog, Status badge, Admin widgets, 9 landing sections, 46 shared UI primitives (buttons, cards, dialogs, toasts, tables…)
🟡 Empty-state handling exists per page rather than as one shared component

## 5. Database — 33 tables, every one with row-level security and at least one policy

| Table | Rows | Table | Rows |
|---|---|---|---|
| government_services | 12 | procedures | 60 |
| required_documents | 47 | legal_topics | 8 |
| laws | 4 | law_sections | 23 |
| schemes | 6 | faqs | 24 |
| glossary | 8 | official_sources | 35 |
| complaint_templates | 8 | knowledge_documents | 67 |
| rag_chunks | 69 | ingestion_jobs | 427 |
| conversations | 8 | messages | 16 |
| activity_logs | 120 | link_check_history | 375 |
| official_link_clicks | 19 | retrieval_logs | 7 |
| ai_usage_events | 6 | content_feedback | 1 |
| bookmarks | 1 | profiles | 2 |
| user_roles | 3 | knowledge_categories | — |

Empty tables whose features are built but unused: ai_feedback, review_tasks, saved_items, document_versions, knowledge_sources, knowledge_health_metrics, contact_messages.

## 6. Authentication
✅ Signup, login, logout, session handling, password reset, protected routes, admin role checks
❌ Google login, OTP login (buttons shown on login/signup are non-functional placeholders)

## 7. AI
✅ Working: chat with streaming answers, retrieval over the knowledge base, Gemini embeddings, trust/recency ranking, inline citations, mandatory disclaimer, conversation history, 100-answers-per-day limit with usage events, retrieval logging
🟡 Thumbs up/down after AI answers exists but has recorded 0 rows; the review queue it should feed is empty

## 8. Knowledge base
Documents 67 · chunks 69 · all embedded · ingestion jobs 427/427 completed, 0 failed · sync engine from content to knowledge base working, with retry and an admin control panel
🟡 Coverage is shallow: roughly one chunk per document, average 969 characters

## 9. Content counts
Services 12 · Legal topics 8 · Schemes 6 · FAQs 24 · Glossary 8 · Official sources 35 · Complaint templates 8 · Laws 4 · Law sections 23

## 10. Accessibility
✅ Skip link, landmark regions, keyboard navigation, visible focus rings, ARIA labels, 44px tap targets, reduced-motion support, accessibility statement page, labelled forms
🟡 Contrast has not been machine-verified; no screen-reader test pass recorded

## 11. GIGW-inspired
✅ Privacy, Terms, Disclaimer, Accessibility statement; official-source citation on content; verified-source directory; trust banner; breadcrumbs; sitemap; language switcher (5 languages); feedback widget
🟡 Translations only cover the menu and about 5 pages
❌ Formal accessibility conformance statement with audit date; contact/grievance officer details

## 12. Security
✅ Row-level security on all 33 tables, admin-only policies on sensitive tables, roles in a separate table with a security-definer check, secret-protected sync webhook, AI rate limiting, automated link verification with 375 checks recorded, source verification fields
🟡 16 official sources currently flagged as broken links; many are government sites that block automated checking rather than being dead

## 13. SEO
✅ Per-page titles/descriptions, Open Graph and Twitter tags on every page, sitemap.xml, robots.txt, structured data (FAQ, breadcrumbs, government service)
🟡 No canonical tags

## 14. Completion

| Area | % |
|---|---|
| Frontend | 85 |
| Backend | 88 |
| Database | 92 |
| AI | 80 |
| Content | 35 |
| Accessibility | 85 |
| Security | 82 |
| **Overall** | **79** |

## 15. Remaining work

**Critical**
1. Complaint template detail page has a code error and will not build — its feedback widget is passed a category and a property it does not accept.
2. Complaint Templates, Legal Knowledge Center and Law Explorer are not linked in the menu or footer.
3. Login/Signup still show non-working DigiLocker, OTP and Guest Access buttons; Guest Access leads to a page that redirects back to login.
4. Resolve the 16 sources flagged as broken.

**Important**
5. Content is far below credible coverage (targets: 40 services, 25 topics, 20 schemes, 80 FAQs, 60 glossary terms).
6. Knowledge chunks too coarse — one chunk per document.
7. Translations cover only a handful of pages.
8. Feedback after AI answers records nothing; review queue never fills.
9. Duplicate admin screens (knowledge-health twice; content-health overlaps content-ops).
10. Newsletter form and social links are decorative.

**Optional**
11. Canonical tags; scheduled weekly link checks; search indexes instead of pattern scanning; caching for public content; automated tests; unused UI dependency cleanup.

## 16. Master checklist — built today
28 public pages · 11 signed-in pages · 10 admin screens · 3 API endpoints · 33 secured tables · working email auth with roles · AI chat with retrieval, citations, limits and history · knowledge base with upload, sync, embedding, versioning and health screens · official portal directory with verification and click tracking · global search · 5-language switcher · accessibility and legal compliance pages · SEO metadata, sitemap and structured data.

## Technical notes
- Build error: `src/routes/complaint-templates.$id.tsx:169` passes `contentType="complaint_template"` and `contentId`; `HelpfulFeedback` accepts `contentType` of service/legal_topic/scheme/faq/page plus `contentSlug`/`contentTitle`.
- Navigation lists: `NAV_LINKS` in `src/components/landing/Navbar.tsx`, `COLUMNS` in `src/components/landing/Footer.tsx`.
- Link statuses: `official_sources.link_status` and per-link status columns; checker in `src/lib/link-check.server.ts`.
- Chunk composition: `src/lib/kb-sync.server.ts` (re-sync required after changes).
