import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { OFFICIAL_ACTION_LABELS, type OfficialActionKey } from "@/lib/official-portal";

/** Admin analytics for outbound clicks to official government portals. */
export const officialPortalAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number } | undefined) => ({ days: d?.days ?? 30 }))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const since = new Date(Date.now() - data.days * 86400_000).toISOString();
    const { data: rows, error } = await context.supabase
      .from("official_link_clicks")
      .select("action, service_title, service_slug, created_at")
      .gte("created_at", since)
      .limit(5000);
    if (error) throw new Error(error.message);

    const byAction = new Map<string, number>();
    const byService = new Map<string, number>();
    for (const r of rows ?? []) {
      byAction.set(r.action, (byAction.get(r.action) ?? 0) + 1);
      const key = r.service_title ?? r.service_slug ?? "Unknown";
      byService.set(key, (byService.get(key) ?? 0) + 1);
    }

    const actions = [...byAction.entries()]
      .map(([key, value]) => ({
        key,
        label: OFFICIAL_ACTION_LABELS[key as OfficialActionKey] ?? key,
        value,
      }))
      .sort((a, b) => b.value - a.value);

    const topServices = [...byService.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return { total: rows?.length ?? 0, days: data.days, actions, topServices };
  });
