import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Clock,
  FileText,
  IndianRupee,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";
import { HelpfulFeedback } from "@/components/feedback/HelpfulFeedback";
import { AskAi } from "@/components/ai/AskAi";
import { OfficialActions } from "@/components/official/OfficialActions";
import { Button } from "@/components/ui/button";
import { serviceDetailQuery } from "@/lib/queries";
import { breadcrumbSchema, governmentServiceSchema, jsonLdScript } from "@/lib/structured-data";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/government-services/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(serviceDetailQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => ({
    meta: [
      { title: `${loaderData?.service.title ?? "Service"} — NyayaMate AI` },
      { name: "description", content: loaderData?.service.description ?? "Government service guide." },
      { property: "og:title", content: `${loaderData?.service.title ?? "Service"} — NyayaMate AI` },
      { property: "og:description", content: loaderData?.service.description ?? "" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: loaderData?.service
      ? [
          jsonLdScript(
            governmentServiceSchema({
              title: loaderData.service.title,
              description: loaderData.service.description ?? "",
              slug: params.slug,
              category: loaderData.service.category,
              providerName: (loaderData as any).source?.authority ?? null,
              providerUrl: (loaderData as any).source?.source_url ?? null,
            }),
          ),
          jsonLdScript(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Government Services", path: "/government-services" },
              { name: loaderData.service.title, path: `/government-services/${params.slug}` },
            ]),
          ),
        ]
      : [],
  }),
  component: ServiceDetail,
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Service not found</h1>
        <Link to="/government-services" className="mt-4 inline-block text-primary hover:underline">
          Back to services
        </Link>
      </div>
    </PublicLayout>
  ),
});

function ServiceDetail() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(serviceDetailQuery(slug));
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { service, steps, documents, portal } = data!;


  const { data: saved } = useQuery({
    queryKey: ["saved_item", user?.id, service.id],
    queryFn: async () => {
      const { data: row } = await supabase
        .from("saved_items")
        .select("id")
        .eq("service_id", service.id)
        .maybeSingle();
      return !!row;
    },
    enabled: !!user,
  });

  const toggleSave = async () => {
    if (!user) {
      toast.info("Please sign in to save services.");
      return;
    }
    if (saved) {
      await supabase.from("saved_items").delete().eq("service_id", service.id).eq("user_id", user.id);
      toast.success("Removed from saved.");
    } else {
      await supabase.from("saved_items").insert({ service_id: service.id, user_id: user.id });
      toast.success("Saved to your list.");
    }
    queryClient.invalidateQueries({ queryKey: ["saved_item", user.id, service.id] });
    queryClient.invalidateQueries({ queryKey: ["dashboard_counts", user.id] });
  };

  return (
    <PublicLayout>
      <section className="bg-navy py-14 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link
            to="/government-services"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> All Services
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-secondary">
                {service.category}
              </span>
              <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{service.title}</h1>
              <p className="mt-3 text-white/70">{service.description}</p>
            </div>
            <Button
              onClick={toggleSave}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {saved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Government Services", to: "/government-services" }, { label: service.title }]} />
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: BadgeCheck, label: "Eligibility", value: service.eligibility },
            { icon: IndianRupee, label: "Fees", value: service.fees },
            { icon: Clock, label: "Processing Time", value: service.processing_time },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <c.icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</p>
              <p className="mt-1 text-sm font-medium text-foreground">{c.value ?? "Varies"}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <ListChecks className="h-5 w-5 text-primary" /> Step-by-step Procedure
            </h2>
            <ol className="mt-6 space-y-5">
              {steps.map((step) => (
                <li key={step.id} className="relative flex gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {step.step_number}
                  </span>
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                    <p className="font-semibold text-foreground">{step.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <FileText className="h-5 w-5 text-primary" /> Required Documents
            </h2>
            <ul className="mt-6 space-y-2.5">
              {documents.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-soft"
                >
                  <BadgeCheck className="h-4 w-4 shrink-0 text-secondary" />
                  {d.document_name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10">
          <OfficialActions portal={portal} serviceSlug={service.slug} serviceTitle={service.title} />
        </div>

        <div className="mt-10">
          <AskAi
            contextType="government-service"
            contextSlug={slug}
            title={service.title}
            suggestions={[
              "What documents do I need?",
              "Am I eligible to apply?",
              "How long does it take?",
            ]}
          />
        </div>
        <HelpfulFeedback contentType="service" contentSlug={service.slug} contentTitle={service.title} />
      </section>
    </PublicLayout>
  );
}
