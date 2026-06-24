import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { HelpCircle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { listFaqs, upsertFaq, deleteFaq, listOfficialSources } from "@/lib/content.functions";

export const Route = createFileRoute("/_authenticated/faqs")({
  head: () => ({
    meta: [
      { title: "FAQs — NyayaMate AI" },
      { name: "description", content: "Frequently asked questions about Indian legal rights and government services." },
    ],
  }),
  component: FaqsPage,
});

type FaqRow = {
  id: string;
  category: string | null;
  question: string;
  answer: string;
  jurisdiction: string | null;
  source_id: string | null;
};

const EMPTY = { category: "", question: "", answer: "", jurisdiction: "India", source_id: "" };

function FaqsPage() {
  const { isAdmin } = useIsAdmin();
  const qc = useQueryClient();
  const fetchFn = useServerFn(listFaqs);
  const saveFn = useServerFn(upsertFaq);
  const deleteFn = useServerFn(deleteFaq);
  const sourcesFn = useServerFn(listOfficialSources);

  const { data, isLoading } = useQuery({ queryKey: ["faqs"], queryFn: () => fetchFn() });
  const { data: sources } = useQuery({
    queryKey: ["official_sources"],
    queryFn: () => sourcesFn(),
    enabled: isAdmin,
  });

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FaqRow | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const categories = ["All", ...Array.from(new Set(((data ?? []) as FaqRow[]).map((f) => f.category).filter(Boolean) as string[]))];
  const rows = ((data ?? []) as FaqRow[]).filter(
    (f) =>
      (cat === "All" || f.category === cat) &&
      (f.question.toLowerCase().includes(q.toLowerCase()) ||
        f.answer.toLowerCase().includes(q.toLowerCase())),
  );

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };
  const openEdit = (f: FaqRow) => {
    setEditing(f);
    setForm({
      category: f.category ?? "",
      question: f.question,
      answer: f.answer,
      jurisdiction: f.jurisdiction ?? "India",
      source_id: f.source_id ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error("Question and answer are required.");
      return;
    }
    setSaving(true);
    try {
      await saveFn({ data: { ...form, source_id: form.source_id || null, id: editing?.id } });
      toast.success(editing ? "FAQ updated" : "FAQ added");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["faqs"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await deleteFn({ data: { id } });
    toast.success("FAQ deleted");
    qc.invalidateQueries({ queryKey: ["faqs"] });
  };

  return (
    <DashboardLayout title="FAQs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">Frequently Asked Questions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Quick answers about legal rights and government services.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openNew}>
            <Plus className="mr-1 h-4 w-4" /> Add FAQ
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search FAQs…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                cat === c ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="mt-8 grid place-items-center rounded-[20px] border border-border bg-card p-12 text-center shadow-card">
          <HelpCircle className="h-9 w-9 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No FAQs yet.</p>
        </div>
      ) : (
        <div className="mt-6 rounded-[20px] border border-border bg-card px-5 shadow-card">
          <Accordion type="single" collapsible>
            {rows.map((f) => (
              <AccordionItem key={f.id} value={f.id}>
                <AccordionTrigger className="text-left text-sm font-semibold text-foreground">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{f.answer}</p>
                  <div className="mt-2 flex items-center gap-3">
                    {f.category && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {f.category}
                      </span>
                    )}
                    {isAdmin && (
                      <span className="flex gap-1">
                        <button
                          onClick={() => openEdit(f)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                          aria-label="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => remove(f.id)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-destructive hover:bg-destructive/10"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Question"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
            />
            <Textarea
              placeholder="Answer"
              rows={5}
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <Input
                placeholder="Jurisdiction"
                value={form.jurisdiction}
                onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })}
              />
            </div>
            <select
              value={form.source_id}
              onChange={(e) => setForm({ ...form, source_id: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">No linked source</option>
              {((sources ?? []) as { id: string; title: string }[]).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
