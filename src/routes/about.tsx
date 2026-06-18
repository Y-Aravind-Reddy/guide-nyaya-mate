import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Eye, Flag, Heart, Rocket, ShieldCheck, Target } from "lucide-react";
import { PageShell } from "@/components/layouts/PageShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — NyayaMate AI" },
      {
        name: "description",
        content:
          "NyayaMate AI is on a mission to make legal rights and government services simple, accessible and trustworthy for every Indian citizen.",
      },
      { property: "og:title", content: "About NyayaMate AI" },
      { property: "og:description", content: "Our mission, vision and values for citizen empowerment." },
    ],
  }),
  component: AboutPage,
});

const VALUES = [
  { icon: ShieldCheck, title: "Trust", desc: "Accurate, verified guidance you can rely on." },
  { icon: Heart, title: "Empathy", desc: "Built for real people facing real problems." },
  { icon: Compass, title: "Clarity", desc: "Complex processes explained in plain language." },
  { icon: Flag, title: "Access", desc: "Available to every citizen, in every language." },
];

const ROADMAP = [
  { phase: "Now", text: "Structured guides for services & legal rights, secure accounts." },
  { phase: "Next", text: "AI chat assistant and smart document checklists." },
  { phase: "Later", text: "Voice assistant, OCR uploads and case tracking." },
  { phase: "Future", text: "Direct government API integrations." },
];

function AboutPage() {
  return (
    <PageShell>
      <section className="bg-navy py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">About Us</p>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">
            Empowering citizens with <span className="text-secondary">clarity</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            NyayaMate AI turns confusing legal and government procedures into simple, guided steps — so
            every citizen can act with confidence.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[20px] border border-border bg-card p-8 shadow-card">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Target className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-2xl font-bold text-foreground">Our Mission</h2>
            <p className="mt-2 text-muted-foreground">
              To make legal rights and government services accessible, understandable and stress-free for
              every Indian — regardless of language or background.
            </p>
          </div>
          <div className="rounded-[20px] border border-border bg-card p-8 shadow-card">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/10 text-secondary">
              <Eye className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-2xl font-bold text-foreground">Our Vision</h2>
            <p className="mt-2 text-muted-foreground">
              A future where no citizen feels lost navigating bureaucracy — where trusted guidance is
              always a click away.
            </p>
          </div>
        </div>

        <h2 className="mt-16 text-center text-2xl font-bold text-foreground">Our Core Values</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-[20px] border border-border bg-card p-6 text-center shadow-card">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent">
                <v.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-bold text-foreground">{v.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-[24px] border border-border bg-card p-8 shadow-card sm:p-10">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Rocket className="h-6 w-6" />
            </span>
            <h2 className="text-2xl font-bold text-foreground">Roadmap</h2>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ROADMAP.map((r) => (
              <div key={r.phase} className="relative rounded-2xl border border-border bg-background p-5">
                <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  {r.phase}
                </span>
                <p className="mt-3 text-sm text-muted-foreground">{r.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-foreground">Ready to get started?</h2>
          <p className="mt-2 text-muted-foreground">Create a free account and explore your guides.</p>
          <Button asChild className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/signup">Get Started Free</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
