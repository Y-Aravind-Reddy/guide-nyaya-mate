import { useState } from "react";
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  Clock,
  Compass,
  Download,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { VerifiedBadge } from "@/components/trust/VerifiedBadge";

export type AiCitation = {
  sourceName: string;
  department: string | null;
  authority: string | null;
  lastVerified: string | null;
  websiteUrl: string | null;
  applyOnlineUrl: string | null;
  formsUrl: string | null;
  relatedService: string | null;
  category: string | null;
};

export type AiEvidence = {
  index: number;
  docTitle: string;
  authority: string | null;
  url: string | null;
  trust: string;
  lastVerified: string | null;
  similarity: number;
  excerpt: string;
};

export type AiConflict = {
  topic: string;
  values: { value: string; source: string }[];
};

export type AiRecommendation = { kind: "service" | "faq"; title: string; href: string };

export type AiMessageMeta = {
  citations?: AiCitation[];
  confidence?: number | null;
  sourceCount?: number;
  documentCount?: number;
  retrievalMs?: number;
  responseTimeMs?: number;
  lastUpdated?: string | null;
  knowledgeCategory?: string | null;
  model?: string;
  conflicts?: AiConflict[];
  outdated?: boolean;
  staleSources?: string[];
  recommendations?: AiRecommendation[];
  evidence?: AiEvidence[];
};

function confidenceLabel(c?: number | null): { label: string; tone: string } {
  if (c == null) return { label: "Unrated", tone: "text-muted-foreground" };
  if (c >= 0.6) return { label: "High", tone: "text-secondary" };
  if (c >= 0.4) return { label: "Medium", tone: "text-accent" };
  return { label: "Low", tone: "text-destructive" };
}

function fmtDate(d?: string | null): string | null {
  if (!d) return null;
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return null;
  return t.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** Renders the official-source citations + answer metadata below an AI reply. */
export function AiSourceCitations({ meta }: { meta?: AiMessageMeta }) {
  const [openEvidence, setOpenEvidence] = useState(false);
  if (!meta) return null;
  const citations = meta.citations ?? [];
  const conf = confidenceLabel(meta.confidence);
  const conflicts = meta.conflicts ?? [];
  const evidence = meta.evidence ?? [];
  const recommendations = meta.recommendations ?? [];

  return (
    <div className="mt-1 space-y-2">
      {/* Answer metadata strip */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span>
          Confidence: <span className={`font-semibold ${conf.tone}`}>{conf.label}</span>
        </span>
        <span aria-hidden="true">·</span>
        <span>
          Sources: {meta.sourceCount ?? 0}
          {meta.documentCount ? ` (${meta.documentCount} documents)` : ""}
        </span>

        {meta.knowledgeCategory ? (
          <>
            <span aria-hidden="true">·</span>
            <span>Category: {meta.knowledgeCategory}</span>
          </>
        ) : null}
        {meta.lastUpdated ? (
          <>
            <span aria-hidden="true">·</span>
            <span>
              Updated:{" "}
              {new Date(meta.lastUpdated).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </>
        ) : null}
        {typeof meta.responseTimeMs === "number" ? (
          <>
            <span aria-hidden="true">·</span>
            <span>{(meta.responseTimeMs / 1000).toFixed(1)}s</span>
          </>
        ) : null}
      </div>

      {/* Conflicting information between official sources */}
      {conflicts.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs">
          <p className="flex items-center gap-1.5 font-semibold text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            This information differs between official sources
          </p>
          <ul className="mt-1.5 space-y-1 text-muted-foreground">
            {conflicts.map((c) => (
              <li key={c.topic}>
                <span className="font-medium text-foreground">{c.topic}:</span>{" "}
                {c.values.map((v) => `${v.value} (${v.source})`).join(" vs ")}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-muted-foreground">
            Please confirm the correct value on the official website before acting.
          </p>
        </div>
      )}

      {/* Outdated information warning */}
      {meta.outdated && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-muted-foreground">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
          <span>
            This information may be outdated
            {meta.staleSources?.length ? ` (${meta.staleSources.join(", ")})` : ""}. Verify
            the latest details with the official authority.
          </span>
        </div>
      )}

      {/* Recommendations when grounding is weak */}
      {recommendations.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs">
          <p className="flex items-center gap-1.5 font-semibold text-foreground">
            <Compass className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            You may find these helpful
          </p>
          <ul className="mt-1.5 space-y-1">
            {recommendations.map((r) => (
              <li key={`${r.kind}-${r.href}-${r.title}`}>
                <a href={r.href} className="text-primary hover:underline">
                  {r.title}
                </a>
                <span className="text-muted-foreground"> · {r.kind === "faq" ? "FAQ" : "Service"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable evidence: exact KB excerpts behind the answer */}
      {evidence.length > 0 && (
        <div className="rounded-xl border border-border bg-card/60 text-xs">
          <button
            onClick={() => setOpenEvidence((v) => !v)}
            aria-expanded={openEvidence}
            className="flex w-full items-center justify-between gap-2 px-3 py-2 font-semibold text-foreground"
          >
            <span>View evidence ({evidence.length} excerpts)</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${openEvidence ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
          {openEvidence && (
            <div className="space-y-2 border-t border-border p-3">
              {evidence.map((e) => (
                <div key={e.index} className="rounded-lg bg-muted/40 p-2">
                  <p className="font-medium text-foreground">
                    [{e.index}] {e.docTitle}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {e.authority ?? "Internal"} · {e.trust}
                    {fmtDate(e.lastVerified) ? ` · verified ${fmtDate(e.lastVerified)}` : ""} ·
                    match {Math.round(e.similarity * 100)}%
                  </p>
                  <p className="mt-1 text-muted-foreground">{e.excerpt}…</p>
                  {e.url ? (
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" aria-hidden="true" /> Source
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}



      {citations.length === 0 ? (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
          <span>No verified official source available.</span>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
            Official Sources
          </p>
          {citations.map((c, i) => (
            <div
              key={`${c.sourceName}-${i}`}
              className="rounded-xl border border-border bg-card/60 p-3 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Building2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {c.sourceName}
                </span>
                <VerifiedBadge date={c.lastVerified} />
              </div>
              <div className="mt-1 space-y-0.5 text-muted-foreground">
                {c.department ? <p>Department: {c.department}</p> : null}
                {c.authority ? <p>Authority: {c.authority}</p> : null}
                {c.relatedService ? <p>Related: {c.relatedService}</p> : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {c.websiteUrl ? (
                  <a
                    href={c.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 font-medium text-foreground hover:border-primary/40 hover:text-primary"
                  >
                    <ExternalLink className="h-3 w-3" aria-hidden="true" /> Official Website
                  </a>
                ) : null}
                {c.applyOnlineUrl ? (
                  <a
                    href={c.applyOnlineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 font-medium text-foreground hover:border-primary/40 hover:text-primary"
                  >
                    <ExternalLink className="h-3 w-3" aria-hidden="true" /> Apply Online
                  </a>
                ) : null}
                {c.formsUrl ? (
                  <a
                    href={c.formsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 font-medium text-foreground hover:border-primary/40 hover:text-primary"
                  >
                    <Download className="h-3 w-3" aria-hidden="true" /> Download Forms
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
