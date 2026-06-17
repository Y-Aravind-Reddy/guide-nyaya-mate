import { ClipboardList, FileSearch, FolderCheck, MousePointerClick, UserPlus } from "lucide-react";

const STEPS = [
  { icon: UserPlus, title: "Create Account", desc: "Sign up free in seconds." },
  { icon: MousePointerClick, title: "Choose Service", desc: "Pick the service you need." },
  { icon: FileSearch, title: "Read Procedure", desc: "Understand each step clearly." },
  { icon: ClipboardList, title: "Collect Documents", desc: "Gather everything required." },
  { icon: FolderCheck, title: "Complete Process", desc: "Finish the government process." },
];

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-secondary">Process</span>
          <h2 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">
            How NyayaMate Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Five simple steps from confusion to completion.
          </p>
        </div>

        <div className="relative mt-16">
          <div className="absolute left-0 right-0 top-7 hidden h-0.5 bg-gradient-to-r from-primary/20 via-secondary/30 to-accent/20 lg:block" />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative flex flex-col items-center text-center">
                <span className="relative z-10 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-premium">
                  <s.icon className="h-6 w-6" />
                </span>
                <span className="mt-4 text-xs font-bold uppercase tracking-wider text-secondary">
                  Step {i + 1}
                </span>
                <h3 className="mt-1 text-base font-bold text-foreground">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
