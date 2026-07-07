import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  FileText,
  Layers,
  Sparkles,
  AlertOctagon,
  Copy,
  Files,
  FileWarning,
  ShieldOff,
  Clock,
  RefreshCw,
  Gauge,
  Percent,
  Boxes,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { knowledgeHealthReport } from "@/lib/admin-health.functions";
import { GlassCard, MetricCard, ScoreRing, healthOf, type Health } from "@/components/admin/health-ui";

export const Route = createFileRoute("/_authenticated/admin/knowledge-health")({
  head: () => ({
    meta: [
      { title: "Knowledge Health — NyayaMate AI" },
      { name: "description", content: "Live health metrics for the NyayaMate AI knowledge base and RAG pipeline." },
    ],
  }),
  component: KnowledgeHealthPage,
});

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useIsAdmin();
  const navigate = useNavigate();
  if (!isLoading && !isAdmin) {
    return (
      <DashboardLayout title="Knowledge Health">
        <div className="grid place-items-center rounded-[20px] border border-border bg-card p-16 text-center shadow-card">
          <Gauge className="h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-bold text-foreground">Admin access required</h2>
          <Button className="mt-5" onClick={() => navigate({ to: "/dashboard" })}>
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  return <>{children}</>;
}

function KnowledgeHealthPage() {
  const { isAdmin } = useIsAdmin();
  const fetchFn = useServerFn(knowledgeHealthReport);
  const { data, isLoading } = useQuery({
    queryKey: ["admin_knowledge_health"],
    queryFn: () => fetchFn(),
    enabled: isAdmin,
    staleTime: 60_000,
  });

  const inv = (n: number, total: number, good: number, warn: number): Health => {
    // lower is better metric — invert into coverage
    if (!total) return "healthy";
    const cov = 100 - Math.round((n / total) * 100);
    return healthOf(cov, good, warn);
  };

  return (
    <AdminOnly>
      <DashboardLayout title="Knowledge Health">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">Knowledge Health</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Live health of the knowledge base and RAG pipeline powering AI answers.
          </p>
        </div>

        <GlassCard className="mt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <ScoreRing score={data?.score ?? 0} label="Knowledge Base Score" />
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" /> Last sync:{" "}
                <span className="font-semibold text-foreground">
                  {data?.lastSync
                    ? new Date(data.lastSync).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                    : "—"}
                </span>
              </span>
            </div>
          </div>
        </GlassCard>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Knowledge Documents" value={data?.totalDocs ?? 0} icon={FileText} />
          <MetricCard label="RAG Chunks" value={data?.totalChunks ?? 0} icon={Layers} />
          <MetricCard
            label="Embeddings"
            value={data?.totalEmbeddings ?? 0}
            icon={Sparkles}
            health={healthOf(data?.embedCoverage ?? 0, 95, 70)}
            hint={`${data?.embedCoverage ?? 0}% coverage`}
          />
          <MetricCard
            label="Failed Embeddings"
            value={data?.failedEmbeddings ?? 0}
            icon={AlertOctagon}
            health={(data?.failedEmbeddings ?? 0) === 0 ? "healthy" : (data?.failedEmbeddings ?? 0) < 5 ? "warning" : "critical"}
          />
          <MetricCard
            label="Duplicate Documents"
            value={data?.duplicateDocuments ?? 0}
            icon={Copy}
            health={(data?.duplicateDocuments ?? 0) === 0 ? "healthy" : "warning"}
          />
          <MetricCard
            label="Duplicate Chunks"
            value={data?.duplicateChunks ?? 0}
            icon={Files}
            health={(data?.duplicateChunks ?? 0) === 0 ? "healthy" : "warning"}
          />
          <MetricCard
            label="Missing Metadata"
            value={data?.missingMetadata ?? 0}
            icon={FileWarning}
            health={inv(data?.missingMetadata ?? 0, data?.totalDocs ?? 0, 90, 60)}
          />
          <MetricCard
            label="Missing Official Sources"
            value={data?.missingSources ?? 0}
            icon={ShieldOff}
            health={inv(data?.missingSources ?? 0, data?.totalDocs ?? 0, 90, 60)}
          />
          <MetricCard
            label="Outdated Content"
            value={data?.outdated ?? 0}
            icon={Clock}
            health={(data?.outdated ?? 0) === 0 ? "healthy" : (data?.outdated ?? 0) < 5 ? "warning" : "critical"}
          />
          <MetricCard
            label="Sync Success Rate"
            value={`${data?.syncSuccessRate ?? 0}%`}
            icon={RefreshCw}
            health={healthOf(data?.syncSuccessRate ?? 0, 90, 60)}
          />
          <MetricCard
            label="Avg Chunks / Document"
            value={data?.avgChunksPerDoc ?? 0}
            icon={Boxes}
          />
          <MetricCard
            label="AI Retrieval Success"
            value={`${data?.retrievalSuccessRate ?? 0}%`}
            icon={Percent}
            health={healthOf(data?.retrievalSuccessRate ?? 0, 80, 50)}
          />
        </div>

        {isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading live metrics…</p>
        ) : null}
      </DashboardLayout>
    </AdminOnly>
  );
}
