import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Database,
  Upload,
  RefreshCw,
  Search,
  Eye,
  Pencil,
  Trash2,
  Send,
  FileText,
  Layers,
  CheckCircle2,
  Clock,
  XCircle,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/kb/StatusBadge";
import { UploadDropzone, type UploadItem } from "@/components/kb/UploadDropzone";
import { MetadataDialog, type MetaForm } from "@/components/kb/MetadataDialog";
import { DocumentPreviewDialog } from "@/components/kb/DocumentPreviewDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  kbStats,
  listDocuments,
  listKbCategories,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocument,
  processDocument,
  type DocumentRow,
} from "@/lib/kb.functions";

export const Route = createFileRoute("/_authenticated/knowledge-base")({
  head: () => ({
    meta: [
      { title: "Knowledge Base — NyayaMate AI" },
      {
        name: "description",
        content: "Manage AI knowledge sources used for Retrieval-Augmented Generation (RAG).",
      },
    ],
  }),
  component: KnowledgeBasePage,
});

const PAGE_SIZE = 10;

const FOLDER: Record<string, string> = {
  "Government Services": "government-services",
  "Legal Rights": "legal-rights",
  "Government Schemes": "schemes",
  Templates: "templates",
  Glossary: "glossary",
  FAQ: "faq",
  "Official Circulars": "official-documents",
  "Court Orders": "official-documents",
};

function fileExt(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function KnowledgeBasePage() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "chunks" | "alpha">("newest");
  const [page, setPage] = useState(1);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const [metaOpen, setMetaOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<DocumentRow | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentRow | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // debounce search
  useMemo(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const statsFn = useServerFn(kbStats);
  const listFn = useServerFn(listDocuments);
  const catsFn = useServerFn(listKbCategories);
  const createFn = useServerFn(createDocument);
  const updateFn = useServerFn(updateDocument);
  const deleteFn = useServerFn(deleteDocument);
  const getFn = useServerFn(getDocument);
  const processFn = useServerFn(processDocument);

  const { data: stats } = useQuery({
    queryKey: ["kb_stats"],
    queryFn: () => statsFn(),
    enabled: isAdmin,
  });
  const { data: cats = [] } = useQuery({
    queryKey: ["kb_categories"],
    queryFn: () => catsFn(),
    enabled: isAdmin,
  });
  const { data: docData } = useQuery({
    queryKey: ["kb_documents", debounced, category, status, sort, page],
    queryFn: () =>
      listFn({
        data: {
          search: debounced || undefined,
          category: category === "all" ? undefined : category,
          status: status === "all" ? undefined : status,
          sort,
          page,
          pageSize: PAGE_SIZE,
        },
      }),
    enabled: isAdmin,
    placeholderData: keepPreviousData,
  });

  const rows = docData?.rows ?? [];
  const total = docData?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ["kb_documents"] });
    qc.invalidateQueries({ queryKey: ["kb_stats"] });
  };

  // ---- mutations
  const saveMeta = useMutation({
    mutationFn: (form: MetaForm) => {
      const payload = {
        ...form,
        slug: form.slug || null,
        source_url: form.source_url || null,
        last_verified_date: form.last_verified_date || null,
        model_version: form.model_version || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      return editDoc
        ? updateFn({ data: { id: editDoc.id, ...payload } })
        : createFn({ data: payload });
    },
    onSuccess: () => {
      toast.success(editDoc ? "Metadata updated" : "Document created");
      setMetaOpen(false);
      setEditDoc(null);
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Document deleted");
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reprocess = useMutation({
    mutationFn: (id: string) => processFn({ data: { id } }),
    onMutate: () => toast.loading("Processing…", { id: "kb-process" }),
    onSuccess: (r) => {
      toast.success(`Processed — ${r.chunks} chunks embedded`, { id: "kb-process" });
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message, { id: "kb-process" }),
  });

  const reprocessAll = useMutation({
    mutationFn: async () => {
      const { rows: all } = await listFn({ data: { pageSize: 100, page: 1, sort: "newest" } });
      for (const d of all) {
        // eslint-disable-next-line no-await-in-loop
        await processFn({ data: { id: d.id } }).catch(() => null);
      }
    },
    onMutate: () => toast.loading("Reprocessing all documents…", { id: "kb-all" }),
    onSuccess: () => {
      toast.success("All documents reprocessed", { id: "kb-all" });
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message, { id: "kb-all" }),
  });

  // ---- upload flow
  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      const ext = fileExt(file.name);
      const folder = FOLDER[category === "all" ? "" : category] ?? "custom";
      const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      setUploads((u) => [...u, { name: file.name, progress: 10, status: "uploading" }]);
      const idx = uploads.length;

      const upd = (patch: Partial<UploadItem>) =>
        setUploads((u) => u.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

      try {
        const { error: upErr } = await supabase.storage
          .from("knowledge-base")
          .upload(path, file, { upsert: false });
        if (upErr) throw new Error(upErr.message);
        upd({ progress: 50 });

        const { id } = await createFn({
          data: {
            title: file.name.replace(/\.[^.]+$/, ""),
            category: category === "all" ? "Custom" : category,
            source: "Manual Upload",
            file_path: path,
            file_type: ext,
            file_size: file.size,
          },
        });
        upd({ progress: 70, status: "processing" });

        await processFn({ data: { id } });
        upd({ progress: 100, status: "done" });
      } catch (e) {
        upd({ status: "error", progress: 100, error: (e as Error).message });
      }
    }
    refreshAll();
  };

  const openEdit = async (id: string) => {
    const doc = await getFn({ data: { id } });
    if (doc) {
      setEditDoc(doc);
      setMetaOpen(true);
    }
  };

  const openPreview = (doc: DocumentRow) => {
    setPreviewDoc(doc);
    setPreviewOpen(true);
  };

  if (!adminLoading && !isAdmin) {
    return (
      <DashboardLayout title="Knowledge Base">
        <div className="grid place-items-center rounded-[20px] border border-border bg-card p-16 text-center shadow-card">
          <Database className="h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-bold text-foreground">Admin access required</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            The Knowledge Base management module is restricted to administrators.
          </p>
          <Button className="mt-5" onClick={() => navigate({ to: "/dashboard" })}>
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    { label: "Total Documents", value: stats?.total ?? 0, icon: FileText, tint: "text-primary", bg: "bg-primary/10" },
    { label: "Total Chunks", value: stats?.chunks ?? 0, icon: Layers, tint: "text-secondary", bg: "bg-secondary/10" },
    { label: "Processed", value: stats?.processed ?? 0, icon: CheckCircle2, tint: "text-secondary", bg: "bg-secondary/10" },
    { label: "Pending", value: stats?.pending ?? 0, icon: Clock, tint: "text-muted-foreground", bg: "bg-muted" },
    { label: "Failed", value: stats?.failed ?? 0, icon: XCircle, tint: "text-destructive", bg: "bg-destructive/10" },
    {
      label: "Last Sync",
      value: stats?.lastSync
        ? new Date(stats.lastSync).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
        : "—",
      icon: History,
      tint: "text-accent",
      bg: "bg-accent/10",
    },
  ];

  return (
    <DashboardLayout title="Knowledge Base">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">Knowledge Base</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Manage AI knowledge sources used for Retrieval-Augmented Generation (RAG).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { setEditDoc(null); setMetaOpen(true); }}>
            <Upload className="mr-1.5 h-4 w-4" /> Upload Knowledge
          </Button>
          <Button variant="outline" disabled={reprocessAll.isPending} onClick={() => reprocessAll.mutate()}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${reprocessAll.isPending ? "animate-spin" : ""}`} /> Reprocess All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-[20px] border border-border bg-card p-4 shadow-card">
            <span className={`grid h-10 w-10 place-items-center rounded-2xl ${s.bg} ${s.tint}`}>
              <s.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-2xl font-extrabold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Upload */}
      <div className="mt-6">
        <UploadDropzone onFiles={handleFiles} uploads={uploads} />
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {cats.map((c: any) => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="processed">Processed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="chunks">Most Chunks</SelectItem>
              <SelectItem value="alpha">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table (desktop) */}
      <div className="mt-4 hidden overflow-hidden rounded-[20px] border border-border bg-card shadow-card lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Document</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Source</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Chunks</th>
              <th className="px-4 py-3 font-semibold">Model</th>
              <th className="px-4 py-3 font-semibold">Processed</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((d) => (
              <tr key={d.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <p className="font-semibold text-foreground">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(d.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{d.category ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{d.source}</td>
                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                <td className="px-4 py-3 text-muted-foreground">{d.chunk_count}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {d.embedding_model?.split("/").pop()}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {d.last_processed_at
                    ? new Date(d.last_processed_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <RowActions
                    onView={() => openPreview(d)}
                    onEdit={() => openEdit(d.id)}
                    onReprocess={() => reprocess.mutate(d.id)}
                    onDelete={() => remove.mutate(d.id)}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No documents yet. Upload knowledge to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cards (mobile) */}
      <div className="mt-4 space-y-3 lg:hidden">
        {rows.map((d) => (
          <div key={d.id} className="rounded-[20px] border border-border bg-card p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-foreground">{d.title}</p>
              <StatusBadge status={d.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{d.category ?? "—"}</span>
              <span>{d.chunk_count} chunks</span>
              <span>{d.source}</span>
            </div>
            <div className="mt-3">
              <RowActions
                onView={() => openPreview(d)}
                onEdit={() => openEdit(d.id)}
                onReprocess={() => reprocess.mutate(d.id)}
                onDelete={() => remove.mutate(d.id)}
              />
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="rounded-[20px] border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No documents yet.
          </p>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {pages} · {total} documents
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <MetadataDialog
        open={metaOpen}
        onOpenChange={(v) => { setMetaOpen(v); if (!v) setEditDoc(null); }}
        categories={cats}
        doc={editDoc}
        saving={saveMeta.isPending}
        onSubmit={(form) => saveMeta.mutate(form)}
      />
      <DocumentPreviewDialog doc={previewDoc} open={previewOpen} onOpenChange={setPreviewOpen} />
    </DashboardLayout>
  );
}

function RowActions({
  onView,
  onEdit,
  onReprocess,
  onDelete,
}: {
  onView: () => void;
  onEdit: () => void;
  onReprocess: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <IconBtn label="View / Preview" onClick={onView}><Eye className="h-4 w-4" /></IconBtn>
      <IconBtn label="Edit metadata" onClick={onEdit}><Pencil className="h-4 w-4" /></IconBtn>
      <IconBtn label="Reprocess / Re-embed" onClick={onReprocess}><Send className="h-4 w-4" /></IconBtn>
      <IconBtn label="Delete" onClick={onDelete} danger><Trash2 className="h-4 w-4" /></IconBtn>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-lg border border-border bg-background transition-colors hover:bg-muted ${
        danger ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
