import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { RefreshCw, Trash2, ChevronDown, FileText, Hash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/kb/StatusBadge";
import { listChunks, deleteChunk, reEmbedChunk } from "@/lib/kb.functions";
import type { DocumentRow } from "@/lib/kb.functions";

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
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: chunks = [], isLoading } = useQuery({
    queryKey: ["kb_chunks", doc?.id],
    queryFn: () => fetchChunks({ data: { documentId: doc!.id } }),
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

          {/* METADATA */}
          <TabsContent value="metadata" className="max-h-[60vh] overflow-y-auto">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Meta label="Category" value={doc.category} />
              <Meta label="Source" value={doc.source} />
              <Meta label="Source URL" value={doc.source_url} />
              <Meta label="Language" value={doc.language} />
              <Meta label="Jurisdiction" value={doc.jurisdiction} />
              <Meta label="State" value={doc.state} />
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
