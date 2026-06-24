import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CheckCircle2, ExternalLink, Gift, ListChecks, ShieldCheck } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getScheme } from "@/lib/content.functions";

export const Route = createFileRoute("/_authenticated/schemes/$slug")({
  head: () => ({
    meta: [{ title: "Scheme Details — NyayaMate AI" }],
  }),
  component: SchemeDetailPage,
  errorComponent: () => (
    <DashboardLayout title="Scheme">
      <p className="text-sm text-muted-foreground">Could not load this scheme. Please try again.</p>
    </DashboardLayout>
  ),
  notFoundComponent: () => (
    <DashboardLayout title="Scheme">
      <p className="text-sm text-muted-foreground">Scheme not found.</p>
    </DashboardLayout>
  ),
});

function SchemeDetailPage() {
  const { slug } = Route.useParams();
  const fetchFn = useServerFn(getScheme);
  const { data: scheme, isLoading } = useQuery({
    queryKey: ["scheme", slug],
    queryFn: () => fetchFn({ data: { slug } }),
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Scheme">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </DashboardLayout>
    );
  }

  if (!scheme) {
    return (
      <DashboardLayout title="Scheme">
        <Link to="/schemes" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to schemes
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">Scheme not found.</p>
      </DashboardLayout>
    );
  }

  const sections = [
    { icon: ShieldCheck, title: "Eligibility", body: scheme.eligibility },
    { icon: Gift, title: "Benefits", body: scheme.benefits },
    { icon: ListChecks, title: "How to Apply", body: scheme.application_process },
  ].filter((s) => s.body);

  return (
    <DashboardLayout title={scheme.title}>
      <Link to="/schemes" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to schemes
      </Link>

      <div className="mt-4 rounded-[20px] border border-border bg-card p-6 shadow-card">
        <span className="inline-flex rounded-full bg-secondary/10 px-2.5 py-0.5 text-[11px] font-semibold text-secondary">
          {scheme.category ?? "Scheme"} · {scheme.jurisdiction}
        </span>
        <h2 className="mt-3 text-2xl font-extrabold text-foreground">{scheme.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{scheme.description}</p>
      </div>

      <div className="mt-5 grid gap-4">
        {sections.map((s) => (
          <div key={s.title} className="rounded-[20px] border border-border bg-card p-5 shadow-card">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <s.icon className="h-4 w-4 text-primary" /> {s.title}
            </h3>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>

      {scheme.source && (
        <div className="mt-5 rounded-[20px] border border-secondary/30 bg-secondary/5 p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-secondary" /> Official Source
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {scheme.source.authority}
            {scheme.source.last_verified_at
              ? ` · Verified ${new Date(scheme.source.last_verified_at).toLocaleDateString("en-IN")}`
              : ""}
          </p>
          <a
            href={scheme.source.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            {scheme.source.title} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </DashboardLayout>
  );
}
