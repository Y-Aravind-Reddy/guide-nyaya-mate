import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Check, Copy, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layouts/PageShell";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { HelpfulFeedback } from "@/components/feedback/HelpfulFeedback";
import { complaintTemplateDetailQuery } from "@/lib/queries";

export const Route = createFileRoute("/complaint-templates/$id")({
  loader: async ({ context, params }) => {
    const tpl = await context.queryClient.ensureQueryData(
      complaintTemplateDetailQuery(params.id),
    );
    if (!tpl) throw notFound();
    return tpl;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Complaint Template"} — NyayaMate AI` },
      {
        name: "description",
        content:
          loaderData?.description ??
          "Fill in your details and generate a ready-to-send complaint letter.",
      },
      { property: "og:title", content: `${loaderData?.title ?? "Complaint Template"} — NyayaMate AI` },
      {
        property: "og:description",
        content:
          loaderData?.description ?? "A ready-to-use complaint letter you can fill in and copy.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TemplateDetail,
});

function fill(body: string, values: Record<string, string>) {
  return body.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_m, key: string) => {
    const v = values[key]?.trim();
    return v ? v : `[${key.replace(/_/g, " ")}]`;
  });
}

function TemplateDetail() {
  const { id } = Route.useParams();
  const { data: tpl } = useSuspenseQuery(complaintTemplateDetailQuery(id));
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const fields = tpl?.fields ?? [];
  const letter = useMemo(() => fill(tpl?.template_body ?? "", values), [tpl, values]);

  if (!tpl) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      toast.success("Letter copied to your clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Please select the text and copy manually.");
    }
  };

  const download = () => {
    const blob = new Blob([letter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tpl.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageShell>
      <section className="bg-navy py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize">
            {tpl.type}
            {tpl.jurisdiction ? ` · ${tpl.jurisdiction}` : ""}
          </span>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold sm:text-4xl">{tpl.title}</h1>
          {tpl.description && <p className="mt-3 max-w-2xl text-white/70">{tpl.description}</p>}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Complaint Templates", to: "/complaint-templates" },
            { label: tpl.title },
          ]}
        />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <div className="rounded-[20px] border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold text-foreground">Your details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nothing you type here is saved or sent anywhere.
            </p>
            <div className="mt-5 space-y-4">
              {fields.map((f) => (
                <div key={f.key}>
                  <label
                    htmlFor={`f-${f.key}`}
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    {f.label}
                  </label>
                  {/details|issue|information_sought|relief/.test(f.key) ? (
                    <textarea
                      id={`f-${f.key}`}
                      rows={4}
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  ) : (
                    <input
                      id={`f-${f.key}`}
                      type="text"
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[20px] border border-border bg-card p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-foreground">Your letter</h2>
              <div className="flex gap-2">
                <Button onClick={copy} className="h-11 bg-primary text-primary-foreground">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy
                </Button>
                <Button onClick={download} variant="outline" className="h-11">
                  <Download className="h-4 w-4" /> Download
                </Button>
              </div>
            </div>
            <pre className="mt-5 max-h-[640px] overflow-auto whitespace-pre-wrap rounded-2xl bg-muted/60 p-5 font-sans text-sm leading-relaxed text-foreground">
              {letter}
            </pre>
            <p className="mt-4 text-xs text-muted-foreground">
              Placeholders shown in square brackets are still empty — fill them in on the left
              before you send this letter.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/complaint-templates"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <FileText className="h-4 w-4" /> Browse all templates
          </Link>
          <HelpfulFeedback
            contentType="complaint_template"
            contentSlug={tpl.id}
            contentTitle={tpl.title}
          />
        </div>
      </section>
    </PageShell>
  );
}
