import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DocumentRow } from "@/lib/kb.functions";

export type MetaForm = {
  title: string;
  slug: string;
  description: string;
  category: string;
  source: string;
  source_url: string;
  language: string;
  jurisdiction: string;
  state: string;
  author: string;
  visibility: string;
  last_verified_date: string;
  tags: string;
  version: string;
  model_version: string;
  embedding_model: string;
};

const EMPTY: MetaForm = {
  title: "",
  slug: "",
  description: "",
  category: "",
  source: "Manual Upload",
  source_url: "",
  language: "en",
  jurisdiction: "India",
  state: "",
  author: "",
  visibility: "private",
  last_verified_date: "",
  tags: "",
  version: "1.0",
  model_version: "",
  embedding_model: "google/gemini-embedding-001",
};

export function MetadataDialog({
  open,
  onOpenChange,
  categories,
  doc,
  onSubmit,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categories: { name: string }[];
  doc?: DocumentRow | null;
  onSubmit: (form: MetaForm) => void;
  saving?: boolean;
}) {
  const [form, setForm] = useState<MetaForm>(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (doc) {
      setForm({
        title: doc.title ?? "",
        slug: doc.slug ?? "",
        description: doc.description ?? "",
        category: doc.category ?? "",
        source: doc.source ?? "Manual Upload",
        source_url: doc.source_url ?? "",
        language: doc.language ?? "en",
        jurisdiction: doc.jurisdiction ?? "",
        state: doc.state ?? "",
        author: doc.author ?? "",
        visibility: doc.visibility ?? "private",
        last_verified_date: doc.last_verified_date ?? "",
        tags: (doc.tags ?? []).join(", "),
        version: doc.version ?? "1.0",
        model_version: doc.model_version ?? "",
        embedding_model: doc.embedding_model ?? "google/gemini-embedding-001",
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, doc]);

  const set = (k: keyof MetaForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{doc ? "Edit Metadata" : "Document Details"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field className="sm:col-span-2" label="Document Title">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Slug">
            <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="passport-guide" />
          </Field>
          <Field label="Category">
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field className="sm:col-span-2" label="Description">
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
          </Field>
          <Field label="Source Name">
            <Input value={form.source} onChange={(e) => set("source", e.target.value)} />
          </Field>
          <Field label="Official Source URL">
            <Input value={form.source_url} onChange={(e) => set("source_url", e.target.value)} placeholder="https://" />
          </Field>
          <Field label="Language">
            <Input value={form.language} onChange={(e) => set("language", e.target.value)} placeholder="en" />
          </Field>
          <Field label="Jurisdiction">
            <Input value={form.jurisdiction} onChange={(e) => set("jurisdiction", e.target.value)} />
          </Field>
          <Field label="State">
            <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
          </Field>
          <Field label="Author">
            <Input value={form.author} onChange={(e) => set("author", e.target.value)} />
          </Field>
          <Field label="Version">
            <Input value={form.version} onChange={(e) => set("version", e.target.value)} />
          </Field>
          <Field label="Last Verified Date">
            <Input type="date" value={form.last_verified_date} onChange={(e) => set("last_verified_date", e.target.value)} />
          </Field>
          <Field label="Visibility">
            <Select value={form.visibility} onValueChange={(v) => set("visibility", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Embedding Model">
            <Select value={form.embedding_model} onValueChange={(v) => set("embedding_model", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="google/gemini-embedding-001">Gemini Embedding 001</SelectItem>
                <SelectItem value="openai/text-embedding-3-large">Text Embedding 3 Large</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field className="sm:col-span-2" label="Tags (comma separated)">
            <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="passport, travel, psk" />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSubmit(form)} disabled={saving || !form.title.trim()}>
            {saving ? "Saving…" : doc ? "Save Changes" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
