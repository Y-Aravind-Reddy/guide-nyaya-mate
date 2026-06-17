import { Bookmark, FileCheck, Landmark, Languages, ListOrdered, Scale } from "lucide-react";

const FEATURES = [
  {
    icon: Landmark,
    title: "Government Services",
    desc: "Access official procedures in one place.",
    bg: "bg-primary/10",
    tint: "text-primary",
  },
  {
    icon: Scale,
    title: "Legal Rights",
    desc: "Learn your rights in simple language.",
    bg: "bg-secondary/10",
    tint: "text-secondary",
  },
  {
    icon: FileCheck,
    title: "Document Checklists",
    desc: "Know required documents before applying.",
    bg: "bg-accent/10",
    tint: "text-accent",
  },
  {
    icon: ListOrdered,
    title: "Step-by-Step Guidance",
    desc: "Easy instructions anyone can follow.",
    bg: "bg-primary/10",
    tint: "text-primary",
  },
  {
    icon: Bookmark,
    title: "Save Important Guides",
    desc: "Bookmark pages for later.",
    bg: "bg-secondary/10",
    tint: "text-secondary",
  },
  {
    icon: Languages,
    title: "Multi-language Support",
    desc: "English, Hindi, Telugu and more.",
    bg: "bg-accent/10",
    tint: "text-accent",
  },
];

export function Features() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-secondary">
            Platform
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">
            Everything You Need In One Platform
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A complete toolkit to navigate legal rights and government services with confidence.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="hover-lift rounded-[20px] border border-border bg-card p-7 shadow-card"
            >
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${f.bg} ${f.tint}`}>
                <f.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
