import { useState } from "react";
import { Link } from "@tanstack/react-router";
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
