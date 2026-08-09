import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  RefreshCw,
  Database,
  CheckCircle2,
  Clock,
  XCircle,
  Layers,
  Trash2,
  Cpu,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  kbSyncOverview,
  listSyncTargets,
  syncRecord,
  rebuildEmbeddings,
  deleteSyncedDocument,
  retryFailedSyncs,

  type SyncType,
} from "@/lib/kb-sync.functions";

export const Route = createFileRoute("/_authenticated/admin/kb-sync")({
  head: () => ({
    meta: [
      { title: "Knowledge Base Sync — NyayaMate AI" },
      {
        name: "description",
        content:
          "Sync CMS content into the AI Knowledge Base: generate documents, chunks, and embeddings for RAG.",
      },
    ],
  }),
  component: KbSyncPage,
});

type Target = {
  id: string;
  title: string;
  documentId: string | null;
  status: string;
  chunkCount: number;
  lastProcessedAt: string | null;
};

const STATUS_META: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  processed: { label: "Ready", cls: "text-secondary", icon: CheckCircle2 },
  processing: { label: "Processing", cls: "text-accent", icon: Clock },
  failed: { label: "Failed", cls: "text-destructive", icon: XCircle },
  not_synced: { label: "Pending", cls: "text-muted-foreground", icon: Clock },
};

function KbSyncPage() {
  const { isAdmin, isLoading } = useIsAdmin();

  if (isLoading) {
    return (
      <DashboardLayout title="Knowledge Base Sync">
        <div className="grid place-items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }
  if (!isAdmin) {
    return (
      <DashboardLayout title="Knowledge Base Sync">
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            You need admin access to view the Knowledge Base Sync Engine.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return <SyncEngine />;
}

function SyncEngine() {
  const queryClient = useQueryClient();
  const overviewFn = useServerFn(kbSyncOverview);
  const syncFn = useServerFn(syncRecord);
  const rebuildFn = useServerFn(rebuildEmbeddings);
  const deleteFn = useServerFn(deleteSyncedDocument);

  const [progress, setProgress] = useState<{ running: boolean; done: number; total: number; label: string }>(
    { running: false, done: 0, total: 0, label: "" },
  );

  const { data: overview, isLoading } = useQuery({
    queryKey: ["kb-sync-overview"],
    queryFn: () => overviewFn(),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["kb-sync-overview"] });
    queryClient.invalidateQueries({ queryKey: ["kb-sync-targets"] });
  };

  // Sync a set of records sequentially with a progress indicator.
  const runSync = async (items: { type: SyncType; id: string }[], label: string) => {
    if (!items.length) {
      toast.info("Nothing to sync");
      return;
    }
    setProgress({ running: true, done: 0, total: items.length, label });
    let ok = 0;
    let failed = 0;
    for (let i = 0; i < items.length; i++) {
      try {
        await syncFn({ data: items[i] });
        ok++;
      } catch (e) {
        failed++;
      }
      setProgress((p) => ({ ...p, done: i + 1 }));
    }
    setProgress({ running: false, done: 0, total: 0, label: "" });
    refresh();
    toast[failed ? "warning" : "success"](
      `${label}: ${ok} synced${failed ? `, ${failed} failed` : ""}`,
    );
  };

  const syncAll = async () => {
    const listFn = listSyncTargets;
    const call = (t: SyncType) => queryClient.fetchQuery({
      queryKey: ["kb-sync-targets", t],
      queryFn: () => listFn({ data: { type: t } }),
    });
    const all: { type: SyncType; id: string }[] = [];
    for (const row of overview?.types ?? []) {
      const targets = (await call(row.type)) as Target[];
      for (const tgt of targets) all.push({ type: row.type, id: tgt.id });
    }
    await runSync(all, "Sync all");
  };

  const totals = (overview?.types ?? []).reduce(
    (acc, t) => {
      acc.total += t.total;
      acc.synced += t.synced;
      acc.pending += t.pending;
      acc.failed += t.failed;
      return acc;
    },
    { total: 0, synced: 0, pending: 0, failed: 0 },
  );

  return (
    <DashboardLayout title="Knowledge Base Sync">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Database className="h-6 w-6 text-primary" /> Knowledge Base Sync Engine
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Convert your CMS content into AI Knowledge Documents, generate semantic chunks and
              embeddings, and power the AI Chat with grounded answers.
            </p>
          </div>
          <Button onClick={syncAll} disabled={progress.running} className="gap-2">
            {progress.running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sync All
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={Layers} label="Total Records" value={totals.total} tone="text-foreground" />
          <StatCard icon={CheckCircle2} label="Already Synced" value={totals.synced} tone="text-secondary" />
          <StatCard icon={Clock} label="Pending" value={totals.pending} tone="text-accent" />
          <StatCard icon={XCircle} label="Failed" value={totals.failed} tone="text-destructive" />
        </div>

        {(overview?.totalChunks ?? 0) >= 0 && (
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{overview?.totalChunks ?? 0}</span>{" "}
            embedding chunks are live in the RAG index and available to AI Chat.
          </div>
        )}

        {progress.running && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center justify-between text-sm font-medium text-foreground">
              <span>{progress.label}…</span>
              <span>
                {progress.done} / {progress.total}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Content type sections */}
        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {(overview?.types ?? []).map((row) => (
              <TypeSection
                key={row.type}
                row={row}
                busy={progress.running}
                onSyncType={async () => {
                  const targets = (await queryClient.fetchQuery({
                    queryKey: ["kb-sync-targets", row.type],
                    queryFn: () => listSyncTargets({ data: { type: row.type } }),
                  })) as Target[];
                  await runSync(
                    targets.map((t) => ({ type: row.type, id: t.id })),
                    `Sync ${row.label}`,
                  );
                }}
                syncFn={syncFn}
                rebuildFn={rebuildFn}
                deleteFn={deleteFn}
                onChanged={refresh}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className={cn("h-4 w-4", tone)} /> {label}
      </div>
      <p className={cn("mt-2 text-2xl font-bold", tone)}>{value}</p>
    </div>
  );
}

function TypeSection({
  row,
  busy,
  onSyncType,
  syncFn,
  rebuildFn,
  deleteFn,
  onChanged,
}: {
  row: { type: SyncType; label: string; total: number; synced: number; pending: number; failed: number };
  busy: boolean;
  onSyncType: () => Promise<void>;
  syncFn: (args: { data: { type: SyncType; id: string } }) => Promise<unknown>;
  rebuildFn: (args: { data: { documentId: string } }) => Promise<unknown>;
  deleteFn: (args: { data: { documentId: string } }) => Promise<unknown>;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const { data: targets, isLoading } = useQuery({
    queryKey: ["kb-sync-targets", row.type],
    queryFn: () => listSyncTargets({ data: { type: row.type } }),
    enabled: open,
  });

  const act = async (fn: () => Promise<unknown>, key: string, ok: string) => {
    setRowBusy(key);
    try {
      await fn();
      toast.success(ok);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setRowBusy(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-3 text-left"
        >
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
          />
          <div>
            <p className="font-semibold text-foreground">{row.label}</p>
            <p className="text-xs text-muted-foreground">
              {row.total} records · {row.synced} synced · {row.pending} pending · {row.failed} failed
            </p>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <Badge n={row.synced} tone="bg-secondary/10 text-secondary" label="Ready" />
          <Badge n={row.pending} tone="bg-accent/10 text-accent" label="Pending" />
          <Badge n={row.failed} tone="bg-destructive/10 text-destructive" label="Failed" />
          <Button size="sm" variant="outline" onClick={onSyncType} disabled={busy || row.total === 0}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Sync
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border">
          {isLoading ? (
            <div className="grid place-items-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (targets ?? []).length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No records in this section.</p>
          ) : (
            <div className="divide-y divide-border">
              {(targets as Target[]).map((t) => {
                const meta = STATUS_META[t.status] ?? STATUS_META.not_synced;
                const StatusIcon = meta.icon;
                return (
                  <div key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className={cn("flex items-center gap-1.5 text-xs font-semibold", meta.cls)}>
                      <StatusIcon className="h-3.5 w-3.5" /> {meta.label}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{t.title}</span>
                    {t.chunkCount > 0 && (
                      <span className="text-xs text-muted-foreground">{t.chunkCount} chunks</span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={rowBusy === t.id}
                        onClick={() =>
                          act(
                            () => syncFn({ data: { type: row.type, id: t.id } }),
                            t.id,
                            t.documentId ? "Reprocessed" : "Synced",
                          )
                        }
                        title={t.documentId ? "Reprocess" : "Sync"}
                      >
                        {rowBusy === t.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      {t.documentId && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={rowBusy === `r-${t.id}`}
                            onClick={() =>
                              act(
                                () => rebuildFn({ data: { documentId: t.documentId! } }),
                                `r-${t.id}`,
                                "Embeddings rebuilt",
                              )
                            }
                            title="Rebuild embeddings"
                          >
                            {rowBusy === `r-${t.id}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Cpu className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={rowBusy === `d-${t.id}`}
                            onClick={() =>
                              act(
                                () => deleteFn({ data: { documentId: t.documentId! } }),
                                `d-${t.id}`,
                                "Knowledge document deleted",
                              )
                            }
                            title="Delete knowledge document"
                          >
                            {rowBusy === `d-${t.id}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Badge({ n, tone, label }: { n: number; tone: string; label: string }) {
  if (!n) return null;
  return (
    <span className={cn("hidden rounded-full px-2 py-0.5 text-xs font-semibold sm:inline", tone)}>
      {n} {label}
    </span>
  );
}
