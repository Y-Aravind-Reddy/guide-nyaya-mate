// Server-only official-link verification engine.
// Shared by the admin action and the weekly automated cron endpoint.

export type LinkState =
  | "verified"
  | "redirected"
  | "blocked"
  | "unavailable"
  | "timeout"
  | "broken"
  | "unreachable"
  | "none";

/**
 * Codes that government portals return to automated clients (WAF / bot
 * protection). The page works fine in a real browser, so these must never be
 * reported as broken links.
 */
const BOT_BLOCK_CODES = new Set([400, 401, 403, 406, 409, 418, 429]);

export type UrlCheck = {
  state: LinkState;
  code: number | null;
  redirectUrl: string | null;
  error: string | null;
};

const TIMEOUT_MS = 8000;

/** Check a single URL. Never throws. */
export async function checkUrl(url: string | null | undefined): Promise<UrlCheck> {
  if (!url || typeof url !== "string" || !/^https?:\/\//i.test(url.trim())) {
    return { state: "none", code: null, redirectUrl: null, error: null };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res: Response;
    try {
      res = await fetch(url, { method: "HEAD", redirect: "manual", signal: controller.signal });
      if (res.status === 405 || res.status === 501) {
        res = await fetch(url, { method: "GET", redirect: "manual", signal: controller.signal });
      }
    } catch {
      res = await fetch(url, { method: "GET", redirect: "manual", signal: controller.signal });
    }
    const code = res.status;
    const redirectUrl = res.headers.get("location");
    if (code >= 200 && code < 300) return { state: "verified", code, redirectUrl: null, error: null };
    if (code >= 300 && code < 400) return { state: "redirected", code, redirectUrl, error: null };
    if (BOT_BLOCK_CODES.has(code))
      return { state: "blocked", code, redirectUrl: null, error: `HTTP ${code} (automated request blocked)` };
    if (code >= 500) return { state: "unavailable", code, redirectUrl: null, error: `HTTP ${code}` };
    return { state: "broken", code, redirectUrl: null, error: `HTTP ${code}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "request failed";
    const timedOut = /abort/i.test(msg);
    return {
      state: timedOut ? "timeout" : "unreachable",
      code: null,
      redirectUrl: null,
      error: msg.slice(0, 200),
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Legacy DB enum values used by official_sources.link_status columns. */
function toLegacy(state: LinkState): string {
  if (state === "verified") return "healthy";
  if (state === "redirected") return "redirected";
  if (state === "broken") return "broken";
  if (state === "blocked") return "blocked";
  if (state === "unavailable") return "unavailable";
  if (state === "none") return "none";
  return "needs_review";
}

function overall(states: LinkState[]): LinkState {
  const real = states.filter((s) => s !== "none");
  if (!real.length) return "unreachable";
  if (real.includes("broken")) return "broken";
  if (real.includes("timeout")) return "timeout";
  if (real.includes("unreachable")) return "unreachable";
  if (real.includes("unavailable")) return "unavailable";
  if (real.includes("blocked")) return "blocked";
  if (real.includes("redirected")) return "redirected";
  return "verified";
}

export type BatchResult = {
  processed: number;
  verified: number;
  broken: number;
  redirected: number;
  needsReview: number;
  nextOffset: number | null;
  total: number;
};

/**
 * Verify a bounded batch of official sources, persisting per-URL history.
 * Resumable: returns `nextOffset` when more sources remain, so schedulers or
 * the admin UI can continue without risking a serverless timeout.
 * A single failing URL never fails the batch.
 */
export async function verifyLinkBatch(
  sb: any,
  opts: { offset?: number; limit?: number; sourceId?: string } = {},
): Promise<BatchResult> {
  const limit = Math.min(Math.max(opts.limit ?? 10, 1), 25);
  const offset = Math.max(opts.offset ?? 0, 0);

  let countQuery = sb.from("official_sources").select("id", { count: "exact", head: true });
  if (opts.sourceId) countQuery = countQuery.eq("id", opts.sourceId);
  const { count } = await countQuery;
  const total = count ?? 0;

  let q = sb
    .from("official_sources")
    .select("id, title, source_url, apply_online_url, forms_url")
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);
  if (opts.sourceId) q = q.eq("id", opts.sourceId);
  const { data: rows, error } = await q;
  if (error) throw new Error(error.message);

  const result: BatchResult = {
    processed: 0,
    verified: 0,
    broken: 0,
    redirected: 0,
    needsReview: 0,
    nextOffset: null,
    total,
  };
  const now = new Date().toISOString();
  const history: Record<string, unknown>[] = [];

  for (const r of rows ?? []) {
    try {
      const web = await checkUrl(r.source_url);
      const apply = await checkUrl(r.apply_online_url);
      const forms = await checkUrl(r.forms_url);
      const state = overall([web.state, apply.state, forms.state]);

      for (const [kind, url, check] of [
        ["website", r.source_url, web],
        ["apply", r.apply_online_url, apply],
        ["forms", r.forms_url, forms],
      ] as const) {
        if (check.state === "none" || !url) continue;
        history.push({
          source_id: r.id,
          url,
          url_kind: kind,
          status: check.state,
          http_code: check.code,
          redirect_url: check.redirectUrl,
          error_message: check.error,
          checked_at: now,
        });
      }

      await sb
        .from("official_sources")
        .update({
          link_status: toLegacy(state),
          website_link_status: toLegacy(web.state),
          apply_link_status: toLegacy(apply.state),
          forms_link_status: toLegacy(forms.state),
          website_http_code: web.code,
          apply_http_code: apply.code,
          forms_http_code: forms.code,
          links_checked_at: now,
        })
        .eq("id", r.id);

      result.processed++;
      if (state === "verified") result.verified++;
      else if (state === "broken") result.broken++;
      else if (state === "redirected") result.redirected++;
      else result.needsReview++;
    } catch (e) {
      result.processed++;
      result.needsReview++;
      console.error(
        JSON.stringify({
          event: "source_verification_failure",
          source_id: r.id,
          error: e instanceof Error ? e.message.slice(0, 200) : "unknown",
        }),
      );
    }
  }

  if (history.length) {
    await sb.from("link_check_history").insert(history as never);
  }

  const consumed = offset + (rows?.length ?? 0);
  result.nextOffset = !opts.sourceId && consumed < total ? consumed : null;

  console.log(
    JSON.stringify({
      event: "link_verification",
      offset,
      processed: result.processed,
      verified: result.verified,
      broken: result.broken,
      redirected: result.redirected,
      needs_review: result.needsReview,
      next_offset: result.nextOffset,
    }),
  );

  return result;
}
