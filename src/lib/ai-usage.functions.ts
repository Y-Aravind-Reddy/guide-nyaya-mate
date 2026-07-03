import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const DAILY_LIMIT_REGISTERED = 100;

function startOfDayIso(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 3600 * 1000);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - 5.5 * 3600 * 1000).toISOString();
}

function startOfMonthIso(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 3600 * 1000);
  ist.setUTCDate(1);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - 5.5 * 3600 * 1000).toISOString();
}

async function isAdmin(context: { supabase: any; userId: string }): Promise<boolean> {
  try {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return Boolean(data);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- my usage
export const myAiUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const admin = await isAdmin(context);
    const { count } = await sb
      .from("ai_usage_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("event_type", "chat")
      .eq("rate_limited", false)
      .gte("created_at", startOfDayIso());
    const used = count ?? 0;
    const limit = admin ? null : DAILY_LIMIT_REGISTERED;
    const remaining = limit === null ? null : Math.max(0, limit - used);
    return {
      isAdmin: admin,
      used,
      limit,
      remaining,
      limitReached: limit !== null && used >= limit,
    };
  });

// ---------------------------------------------------------------- admin dashboard
export const adminAiUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context))) throw new Error("Forbidden: admin access required");
    const sb = context.supabase as any;

    // Pull a 30-day window (bounded) for aggregation + table.
    const windowStart = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { data: events, error } = await sb
      .from("ai_usage_events")
      .select(
        "id, user_id, event_type, model, prompt_tokens, completion_tokens, total_tokens, response_time_ms, succeeded, rate_limited, cost_estimate, created_at",
      )
      .gte("created_at", windowStart)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);

    const rows = (events ?? []) as any[];
    const todayStart = startOfDayIso();
    const monthStart = startOfMonthIso();

    const chatRows = rows.filter((r) => r.event_type === "chat" && !r.rate_limited);
    const todayRequests = rows.filter(
      (r) => r.event_type === "chat" && !r.rate_limited && r.created_at >= todayStart,
    ).length;
    const monthRequests = rows.filter(
      (r) => r.event_type === "chat" && !r.rate_limited && r.created_at >= monthStart,
    ).length;
    const succeededRows = chatRows.filter((r) => r.succeeded);
    const avgResponseMs = succeededRows.length
      ? Math.round(
          succeededRows.reduce((s, r) => s + (r.response_time_ms || 0), 0) / succeededRows.length,
        )
      : 0;
    const totalTokens = rows.reduce((s, r) => s + (r.total_tokens || 0), 0);
    const embeddingRequests = rows.filter((r) => r.event_type === "embedding").length;
    const failedRequests = rows.filter((r) => !r.rate_limited && !r.succeeded).length;
    const rateLimitHits = rows.filter((r) => r.rate_limited).length;
    const totalCost = Number(rows.reduce((s, r) => s + Number(r.cost_estimate || 0), 0).toFixed(4));
    const avgCost = chatRows.length ? Number((totalCost / chatRows.length).toFixed(5)) : 0;

    // Top users
    const byUser = new Map<string, { requests: number; tokens: number }>();
    for (const r of chatRows) {
      if (!r.user_id) continue;
      const cur = byUser.get(r.user_id) ?? { requests: 0, tokens: 0 };
      cur.requests += 1;
      cur.tokens += r.total_tokens || 0;
      byUser.set(r.user_id, cur);
    }
    const topIds = [...byUser.entries()]
      .sort((a, b) => b[1].requests - a[1].requests)
      .slice(0, 10);
    let profiles: any[] = [];
    if (topIds.length) {
      const { data: profs } = await sb
        .from("profiles")
        .select("id, full_name, email")
        .in("id", topIds.map(([id]) => id));
      profiles = profs ?? [];
    }
    const topUsers = topIds.map(([id, v]) => {
      const p = profiles.find((x) => x.id === id);
      return {
        userId: id,
        name: p?.full_name ?? null,
        email: p?.email ?? null,
        requests: v.requests,
        tokens: v.tokens,
      };
    });

    // 14-day trend (IST day buckets)
    const trendMap = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 3600 * 1000 + 5.5 * 3600 * 1000);
      trendMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const r of chatRows) {
      const key = new Date(new Date(r.created_at).getTime() + 5.5 * 3600 * 1000)
        .toISOString()
        .slice(0, 10);
      if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) || 0) + 1);
    }
    const trend = [...trendMap.entries()].map(([date, count]) => ({ date, count }));

    return {
      summary: {
        todayRequests,
        monthRequests,
        avgResponseMs,
        totalTokens,
        embeddingRequests,
        failedRequests,
        rateLimitHits,
        avgCost,
        totalCost,
      },
      topUsers,
      trend,
      events: rows.slice(0, 500).map((r) => ({
        id: r.id,
        userId: r.user_id,
        eventType: r.event_type,
        model: r.model,
        totalTokens: r.total_tokens,
        responseTimeMs: r.response_time_ms,
        succeeded: r.succeeded,
        rateLimited: r.rate_limited,
        costEstimate: r.cost_estimate,
        createdAt: r.created_at,
      })),
    };
  });
