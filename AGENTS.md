<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Content verification uses a `verification_status` field (verified/under_review/draft) on services, topics, FAQs and glossary; "verified" means linked to a verified official source. Why: one trust signal for dashboards and reviewers.
- CMS→KB sync copies the record's active official source URL onto its knowledge document. Why: AI citations need a real link.
- Category accent colours live in `src/lib/category-colors.ts` as the single source of truth; components resolve them via `getCategoryColor`/`categoryTint` inline styles. Why: Tailwind cannot generate classes from runtime category names.
- Colours come only from semantic tokens in `src/styles.css` (`primary`, `secondary-strong`, `legal`, `status-*`, `navy` = charcoal); no hardcoded colour utilities in components. Why: bright blue is reserved for links/CTAs and the palette must stay themeable.
