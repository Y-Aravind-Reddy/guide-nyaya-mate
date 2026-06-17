import { Bot, Clock, ListChecks, ShieldCheck } from "lucide-react";

const CARDS = [
  {
    icon: Bot,
    title: "AI Legal Assistant",
    desc: "Ask anything about your rights and get clear, accurate answers instantly — no jargon.",
    tint: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: ListChecks,
    title: "Step-by-Step Guidance",
    desc: "Follow simple, structured checklists for every government procedure and document.",
    tint: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: ShieldCheck,
    title: "Trusted Information",
    desc: "Guidance grounded in official sources so you always act with confidence.",
    tint: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Clock,
    title: "Save Time & Effort",
    desc: "Skip the queues and confusion. Get answers in seconds, available 24/7.",
    tint: "text-primary",
    bg: "bg-primary/10",
  },
];

export function WhyNyayaMate() {
  return (
    <section id="why" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-secondary">
            Why NyayaMate
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">
            Built for every citizen
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A smarter, friendlier way to navigate legal rights and government services.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c, i) => (
            <div
              key={c.title}
              className="hover-lift group rounded-2xl border border-border bg-card p-6 shadow-soft"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`grid h-12 w-12 place-items-center rounded-xl ${c.bg} ${c.tint} transition-transform duration-300 group-hover:scale-110`}>
                <c.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-foreground">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
