import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  RefreshCw,
  Trash2,
  ChevronDown,
  FileText,
  Hash,
  Plus,
  ExternalLink,
  History,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/kb/StatusBadge";
import {
  listChunks,
  deleteChunk,
  reEmbedChunk,
  listSources,
  upsertSource,
  deleteSource,
  listVersions,
  restoreVersion,
} from "@/lib/kb.functions";
import type { DocumentRow } from "@/lib/kb.functions";

const SOURCE_TYPES = [
  { value: "official_government", label: "Official Government" },
  { value: "government_portal", label: "Government Portal" },
  { value: "legal_authority", label: "Legal Authority" },
  { value: "court", label: "Court" },
  { value: "verified_source", label: "Verified Source" },
  { value: "internal_content", label: "Internal Content" },
];

export function DocumentPreviewDialog({
  doc,
  open,
  onOpenChange,
}: {
  doc: DocumentRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const fetchChunks = useServerFn(listChunks);
  const delChunk = useServerFn(deleteChunk);
  const reembed = useServerFn(reEmbedChunk);
  const fetchSources = useServerFn(listSources);
  const saveSource = useServerFn(upsertSource);
  const delSource = useServerFn(deleteSource);
  const fetchVersions = useServerFn(listVersions);
  const restore = useServerFn(restoreVersion);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newSource, setNewSource] = useState({
    source_title: "",
    official_authority: "",
    source_url: "",
    source_type: "official_government",
  });

  const { data: chunks = [], isLoading } = useQuery({
    queryKey: ["kb_chunks", doc?.id],
    queryFn: () => fetchChunks({ data: { documentId: doc!.id } }),
    enabled: open && Boolean(doc),
  });

  const { data: sources = [] } = useQuery({
    queryKey: ["kb_sources", doc?.id],
    queryFn: () => fetchSources({ data: { documentId: doc!.id } }),
    enabled: open && Boolean(doc),
  });

  const { data: versions = [] } = useQuery({
    queryKey: ["kb_versions", doc?.id],
    queryFn: () => fetchVersions({ data: { documentId: doc!.id } }),
    enabled: open && Boolean(doc),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["kb_chunks", doc?.id] });
    qc.invalidateQueries({ queryKey: ["kb_documents"] });
  };

  const removeChunk = useMutation({
    mutationFn: (id: string) => delChunk({ data: { id, documentId: doc!.id } }),
    onSuccess: () => {
      toast.success("Chunk deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reEmbed = useMutation({
    mutationFn: (id: string) => reembed({ data: { id } }),
    onSuccess: () => {
      toast.success("Chunk re-embedded");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addSource = useMutation({
    mutationFn: () =>
      saveSource({
        data: {
          document_id: doc!.id,
          source_title: newSource.source_title,
          official_authority: newSource.official_authority || null,
          source_url: newSource.source_url || null,
          source_type: newSource.source_type as never,
          last_verified_at: new Date().toISOString(),
        },
      }),
    onSuccess: () => {
      toast.success("Source added");
      setNewSource({ source_title: "", official_authority: "", source_url: "", source_type: "official_government" });
      qc.invalidateQueries({ queryKey: ["kb_sources", doc?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeSource = useMutation({
    mutationFn: (id: string) => delSource({ data: { id } }),
    onSuccess: () => {
      toast.success("Source removed");
      qc.invalidateQueries({ queryKey: ["kb_sources", doc?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const restoreMut = useMutation({
    mutationFn: (versionId: string) => restore({ data: { versionId, documentId: doc!.id } }),
    onSuccess: () => {
      toast.success("Version restored");
      qc.invalidateQueries({ queryKey: ["kb_documents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fullText = chunks.map((c: any) => c.chunk_text).join("\n\n");
  const charCount = fullText.length;
  const tokenEstimate = chunks.reduce((sum: number, c: any) => sum + (c.token_count ?? 0), 0);

  if (!doc) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="truncate">{doc.title}</span>
            <StatusBadge status={doc.status} />
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preview" className="overflow-hidden">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="chunks">Chunks ({chunks.length})</TabsTrigger>
            <TabsTrigger value="sources">Sources ({sources.length})</TabsTrigger>
            <TabsTrigger value="versions">Versions ({versions.length})</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          {/* PREVIEW */}
          <TabsContent value="preview" className="max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Characters" value={charCount.toLocaleString()} />
              <Stat label="Token Estimate" value={tokenEstimate.toLocaleString()} />
              <Stat label="Chunks" value={String(chunks.length)} />
            </div>
            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {isLoading
                  ? "Loading extracted text…"
                  : fullText || "No extracted text yet. Reprocess this document to generate chunks."}
              </p>
            </div>
          </TabsContent>

          {/* CHUNKS */}
          <TabsContent value="chunks" className="max-h-[60vh] space-y-2 overflow-y-auto">
            {isLoading && <p className="text-sm text-muted-foreground">Loading chunks…</p>}
            {!isLoading && chunks.length === 0 && (
              <p className="text-sm text-muted-foreground">No chunks. Reprocess to generate.</p>
            )}
            {chunks.map((c: any) => (
              <div key={c.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    <Hash className="h-3 w-3" />#{c.chunk_index}
                  </span>
                  {c.source_section && (
                    <span className="truncate text-xs font-medium text-muted-foreground">
                      {c.source_section}
                    </span>
                  )}
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {c.token_count ?? 0} tok
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      c.embedding_status === "embedded"
                        ? "bg-secondary/10 text-secondary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.embedding_status}
                  </span>
                </div>
                <p
                  className={`mt-2 whitespace-pre-wrap text-sm text-foreground ${
                    expanded === c.id ? "" : "line-clamp-2"
                  }`}
                >
                  {c.chunk_text}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <ChevronDown className="h-3 w-3" />
                    {expanded === c.id ? "Collapse" : "Preview"}
                  </button>
                  <span className="text-[11px] text-muted-foreground">
                    Similarity: <span className="italic">—</span>
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto h-7 px-2 text-xs"
                    disabled={reEmbed.isPending}
                    onClick={() => reEmbed.mutate(c.id)}
                  >
                    <RefreshCw className="mr-1 h-3 w-3" /> Re-embed
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    disabled={removeChunk.isPending}
                    onClick={() => removeChunk.mutate(c.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* SOURCES */}
          <TabsContent value="sources" className="max-h-[60vh] space-y-3 overflow-y-auto">
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Add a citation source</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Source title"
                  value={newSource.source_title}
                  onChange={(e) => setNewSource((s) => ({ ...s, source_title: e.target.value }))}
                />
                <Input
                  placeholder="Official authority"
                  value={newSource.official_authority}
                  onChange={(e) => setNewSource((s) => ({ ...s, official_authority: e.target.value }))}
                />
                <Input
                  placeholder="https://source-url"
                  value={newSource.source_url}
                  onChange={(e) => setNewSource((s) => ({ ...s, source_url: e.target.value }))}
                />
                <Select
                  value={newSource.source_type}
                  onValueChange={(v) => setNewSource((s) => ({ ...s, source_type: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                className="mt-2"
                disabled={addSource.isPending || !newSource.source_title.trim()}
                onClick={() => addSource.mutate()}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Source
              </Button>
            </div>

            {sources.length === 0 && (
              <p className="text-sm text-muted-foreground">No sources yet. Add verified citations above.</p>
            )}
            {sources.map((s: any) => (
              <div key={s.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{s.source_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.official_authority || "—"} ·{" "}
                      {SOURCE_TYPES.find((t) => t.value === s.source_type)?.label ?? s.source_type}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Verified:{" "}
                      {s.last_verified_at
                        ? new Date(s.last_verified_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                  {s.source_url && (
                    <a
                      href={s.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary"
                      title="Open source"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => removeSource.mutate(s.id)}
                    className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                    title="Delete source"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* VERSIONS */}
          <TabsContent value="versions" className="max-h-[60vh] space-y-2 overflow-y-auto">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
              <p className="text-xs font-semibold text-primary">
                Current Version: {doc.version}{" "}
                {doc.is_latest && (
                  <span className="ml-1 rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-bold text-secondary">
                    LATEST
                  </span>
                )}
              </p>
            </div>
            {versions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No previous versions. Edit with a change log to create version history.
              </p>
            )}
            {versions.map((v: any) => (
              <div key={v.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-2">
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">v{v.version}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {new Date(v.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    disabled={restoreMut.isPending}
                    onClick={() => restoreMut.mutate(v.id)}
                  >
                    <RotateCcw className="mr-1 h-3 w-3" /> Restore
                  </Button>
                </div>
                {v.change_log && (
                  <p className="mt-1.5 text-xs text-muted-foreground">{v.change_log}</p>
                )}
              </div>
            ))}
          </TabsContent>

          {/* METADATA */}
          <TabsContent value="metadata" className="max-h-[60vh] overflow-y-auto">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Meta label="Category" value={doc.category} />
              <Meta label="Source" value={doc.source} />
              <Meta label="Source URL" value={doc.source_url} />
              <Meta label="Language" value={doc.language} />
              <Meta label="Jurisdiction" value={doc.jurisdiction} />
              <Meta label="Country" value={doc.country} />
              <Meta label="State" value={doc.state} />
              <Meta label="District" value={doc.district} />
              <Meta label="Trust Level" value={doc.content_trust_level} />
              <Meta label="Review Status" value={doc.review_status} />
              <Meta label="Next Review" value={doc.next_review_date} />
              <Meta label="Author" value={doc.author} />
              <Meta label="Version" value={doc.version} />
              <Meta label="Embedding Model" value={doc.embedding_model} />
              <Meta label="Model Version" value={doc.model_version} />
              <Meta label="Visibility" value={doc.visibility} />
              <Meta label="Last Verified" value={doc.last_verified_date} />
              <Meta label="File Type" value={doc.file_type} />
              <Meta
                label="File Size"
                value={doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : null}
              />
              <Meta label="Tags" value={(doc.tags ?? []).join(", ")} />
            </dl>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <p className="text-lg font-extrabold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}
