import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Bookmark, BookmarkCheck, FileText, HelpCircle, Link2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layouts/PageShell";
import { AskAi } from "@/components/ai/AskAi";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { legalTopicDetailQuery } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/legal-rights/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(legalTopicDetailQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Legal Topic"} — NyayaMate AI` },
      { name: "description", content: loaderData?.description ?? "Legal rights guide." },
      { property: "og:title", content: `${loaderData?.title ?? "Legal Topic"} — NyayaMate AI` },
      { property: "og:description", content: loaderData?.description ?? "" },
    ],
  }),
  component: TopicDetail,
  notFoundComponent: () => (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Topic not found</h1>
        <Link to="/legal-rights" className="mt-4 inline-block text-primary hover:underline">
          Back to legal rights
        </Link>
      </div>
    </PageShell>
  ),
});

function TopicDetail() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(legalTopicDetailQuery(slug));
  const topic = data!;
  const { user } = useAuth();
  const queryClient = useQueryClient();


  const { data: bookmarked } = useQuery({
    queryKey: ["bookmark", user?.id, topic.id],
    queryFn: async () => {
      const { data: row } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("topic_id", topic.id)
        .maybeSingle();
      return !!row;
    },
    enabled: !!user,
  });

  const toggle = async () => {
    if (!user) {
      toast.info("Please sign in to bookmark topics.");
      return;
    }
    if (bookmarked) {
      await supabase.from("bookmarks").delete().eq("topic_id", topic.id).eq("user_id", user.id);
      toast.success("Bookmark removed.");
    } else {
      await supabase.from("bookmarks").insert({ topic_id: topic.id, user_id: user.id });
      toast.success("Bookmarked.");
    }
    queryClient.invalidateQueries({ queryKey: ["bookmark", user.id, topic.id] });
    queryClient.invalidateQueries({ queryKey: ["dashboard_counts", user.id] });
  };

  return (
    <PageShell>
      <section className="bg-navy py-14 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link
            to="/legal-rights"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> All Legal Topics
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-secondary">
                {topic.category}
              </span>
              <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{topic.title}</h1>
              <p className="mt-3 text-white/70">{topic.description}</p>
            </div>
            <Button onClick={toggle} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              {bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {bookmarked ? "Bookmarked" : "Bookmark"}
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {topic.overview && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground">Overview</h2>
            <p className="mt-3 text-muted-foreground">{topic.overview}</p>
          </div>
        )}

        {topic.procedure && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground">Procedure</h2>
            <p className="mt-3 text-muted-foreground">{topic.procedure}</p>
          </div>
        )}

        {topic.documents?.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <FileText className="h-5 w-5 text-primary" /> Documents Needed
            </h2>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {topic.documents.map((d) => (
                <li
                  key={d}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}

        {topic.faq?.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <HelpCircle className="h-5 w-5 text-primary" /> Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="mt-3">
              {topic.faq.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-semibold">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}

        {topic.related?.length > 0 && (
          <div className="mt-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Link2 className="h-5 w-5 text-primary" /> Related Topics
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {topic.related.map((r) => (
                <span
                  key={r}
                  className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10">
          <AskAi
            contextType="legal-topic"
            contextSlug={slug}
            title={topic.title}
            suggestions={[
              "What are my rights here?",
              "What should I do first?",
              "Where can I file a complaint?",
            ]}
          />
        </div>
      </section>
    </PageShell>
  );
}
