import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BadgeCheck, ExternalLink, Pencil, Plus, Search, ShieldAlert, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VerifiedBadge } from "@/components/trust/VerifiedBadge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  listOfficialSources,
  upsertOfficialSource,
  verifyOfficialSource,
  deleteOfficialSource,
} from "@/lib/content.functions";

export const Route = createFileRoute("/_authenticated/official-sources")({
  head: () => ({ meta: [{ title: "Official Sources — NyayaMate AI" }] }),
  component: OfficialSourcesPage,
});

type SourceRow = {
  id: string;
  title: string;
  authority: string;
  source_url: string;
  category: string | null;
  jurisdiction: string | null;
  status: string;
  last_verified_at: string | null;
  department: string | null;
  ministry: string | null;
  government_level: string | null;
  state: string | null;
  apply_online_url: string | null;
  update_url: string | null;
  track_status_url: string | null;
  forms_url: string | null;
  appointment_url: string | null;
  locate_office_url: string | null;
  mobile_app_url: string | null;
  complaint_url: string | null;
  help_centre_url: string | null;
  helpline: string | null;
  email: string | null;
  office_address: string | null;
  source_type: string | null;
  is_active: boolean | null;
};

const EMPTY = {
  title: "",
  authority: "",
  source_url: "",
  category: "",
  jurisdiction: "India",
  department: "",
  ministry: "",
  government_level: "Central",
  state: "",
  apply_online_url: "",
  update_url: "",
  track_status_url: "",
  forms_url: "",
  appointment_url: "",
  locate_office_url: "",
  mobile_app_url: "",
  complaint_url: "",
  help_centre_url: "",
  helpline: "",
  email: "",
  office_address: "",
  source_type: "Government Portal",
  is_active: true,
};


function OfficialSourcesPage() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const fetchFn = useServerFn(listOfficialSources);
  const saveFn = useServerFn(upsertOfficialSource);
  const verifyFn = useServerFn(verifyOfficialSource);
  const deleteFn = useServerFn(deleteOfficialSource);

  const { data, isLoading } = useQuery({
    queryKey: ["official_sources"],
    queryFn: () => fetchFn(),
    enabled: isAdmin,
  });

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SourceRow | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  if (!adminLoading && !isAdmin) {
    return (
      <DashboardLayout title="Official Sources">
        <div className="grid place-items-center rounded-[20px] border border-border bg-card p-16 text-center shadow-card">
          <ShieldAlert className="h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-bold text-foreground">Admin access required</h2>
          <Button className="mt-5" onClick={() => navigate({ to: "/dashboard" })}>
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };
  const openEdit = (s: SourceRow) => {
    setEditing(s);
    setForm({
      title: s.title,
      authority: s.authority,
      source_url: s.source_url,
      category: s.category ?? "",
      jurisdiction: s.jurisdiction ?? "India",
      department: s.department ?? "",
      ministry: s.ministry ?? "",
      government_level: s.government_level ?? "Central",
      state: s.state ?? "",
      apply_online_url: s.apply_online_url ?? "",
      update_url: s.update_url ?? "",
      track_status_url: s.track_status_url ?? "",
      forms_url: s.forms_url ?? "",
      appointment_url: s.appointment_url ?? "",
      locate_office_url: s.locate_office_url ?? "",
      mobile_app_url: s.mobile_app_url ?? "",
      complaint_url: s.complaint_url ?? "",
      help_centre_url: s.help_centre_url ?? "",
      helpline: s.helpline ?? "",
      email: s.email ?? "",
      office_address: s.office_address ?? "",
      source_type: s.source_type ?? "Government Portal",
      is_active: s.is_active ?? true,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.authority.trim() || !form.source_url.trim()) {
      toast.error("Title, authority and URL are required.");
      return;
    }
    setSaving(true);
    try {
      await saveFn({ data: { ...form, id: editing?.id } });
      toast.success(editing ? "Source updated" : "Source added");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["official_sources"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const verify = async (id: string) => {
    await verifyFn({ data: { id } });
    toast.success("Marked as verified");
    qc.invalidateQueries({ queryKey: ["official_sources"] });
  };

  const remove = async (id: string) => {
    await deleteFn({ data: { id } });
    toast.success("Source deleted");
    qc.invalidateQueries({ queryKey: ["official_sources"] });
  };

  const rows = ((data ?? []) as SourceRow[]).filter(
    (s) =>
      s.title.toLowerCase().includes(q.toLowerCase()) ||
      s.authority.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <DashboardLayout title="Official Sources">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">Official Sources</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verified government and legal references that ground AI answers.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" /> Add Source
        </Button>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 sm:max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search sources…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-[20px] border border-border bg-card shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Source</th>
              <th className="px-4 py-2.5 font-semibold">Authority</th>
              <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Last Verified</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">
                  <a
                    href={s.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary"
                  >
                    {s.title} <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                  <p className="text-xs text-muted-foreground">{s.category ?? "—"} · {s.jurisdiction}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{s.authority}</td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                  {s.last_verified_at ? new Date(s.last_verified_at).toLocaleDateString("en-IN") : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1">
                    {s.status === "verified" ? (
                      <VerifiedBadge date={s.last_verified_at} />
                    ) : (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                        {s.status}
                      </span>
                    )}
                    {s.is_active === false && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {s.status !== "verified" && (
                      <button
                        onClick={() => verify(s.id)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-secondary hover:bg-secondary/10"
                        aria-label="Verify"
                      >
                        <BadgeCheck className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(s)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remove(s.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No official sources yet. Add your first verified source.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Source" : "Add Official Source"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Source Name (e.g. PM-KISAN Official Portal)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              placeholder="Authority (e.g. Department of Agriculture)"
              value={form.authority}
              onChange={(e) => setForm({ ...form, authority: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Department"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
              <Input
                placeholder="Ministry"
                value={form.ministry}
                onChange={(e) => setForm({ ...form, ministry: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.government_level}
                onChange={(e) => setForm({ ...form, government_level: e.target.value })}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                aria-label="Government level"
              >
                <option>Central</option>
                <option>State</option>
                <option>Local</option>
              </select>
              <Input
                placeholder="State (if applicable)"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
            <Input
              placeholder="Official Website URL (https://…gov.in)"
              value={form.source_url}
              onChange={(e) => setForm({ ...form, source_url: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Apply Online URL"
                value={form.apply_online_url}
                onChange={(e) => setForm({ ...form, apply_online_url: e.target.value })}
              />
              <Input
                placeholder="Download Forms URL"
                value={form.forms_url}
                onChange={(e) => setForm({ ...form, forms_url: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Update Details URL"
                value={form.update_url}
                onChange={(e) => setForm({ ...form, update_url: e.target.value })}
              />
              <Input
                placeholder="Track Status URL"
                value={form.track_status_url}
                onChange={(e) => setForm({ ...form, track_status_url: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Book Appointment URL"
                value={form.appointment_url}
                onChange={(e) => setForm({ ...form, appointment_url: e.target.value })}
              />
              <Input
                placeholder="Locate Office URL"
                value={form.locate_office_url}
                onChange={(e) => setForm({ ...form, locate_office_url: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Help Centre URL"
                value={form.help_centre_url}
                onChange={(e) => setForm({ ...form, help_centre_url: e.target.value })}
              />
              <Input
                placeholder="Complaint Portal URL"
                value={form.complaint_url}
                onChange={(e) => setForm({ ...form, complaint_url: e.target.value })}
              />
            </div>
            <Input
              placeholder="Official Mobile App URL"
              value={form.mobile_app_url}
              onChange={(e) => setForm({ ...form, mobile_app_url: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Helpline"
                value={form.helpline}
                onChange={(e) => setForm({ ...form, helpline: e.target.value })}
              />
              <Input
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <Input
              placeholder="Office Address"
              value={form.office_address}
              onChange={(e) => setForm({ ...form, office_address: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <Input
                placeholder="Source Type (e.g. Government Portal)"
                value={form.source_type}
                onChange={(e) => setForm({ ...form, source_type: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Jurisdiction"
                value={form.jurisdiction}
                onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })}
              />
              <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4"
                />
                Active
              </label>
            </div>
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
