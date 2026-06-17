import { Banknote, BookOpen, Car, FileText, Home, Landmark, Plane, Scale } from "lucide-react";

const SERVICES = [
  { icon: Plane, label: "Passport & Visa" },
  { icon: FileText, label: "PAN & Aadhaar" },
  { icon: Car, label: "Driving Licence" },
  { icon: Home, label: "Property & Land" },
  { icon: Scale, label: "Legal Rights" },
  { icon: Banknote, label: "Taxes & Subsidies" },
  { icon: Landmark, label: "Govt Schemes" },
  { icon: BookOpen, label: "Education & Welfare" },
];

export function Services() {
  return (
    <section id="services" className="scroll-mt-20 bg-card py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-secondary">
            Services
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">
            Everything a citizen needs, in one place
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Explore guidance across the services people search for most.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <button
              key={s.label}
              className="hover-lift group flex items-center gap-3 rounded-xl border border-border bg-background p-4 text-left shadow-soft"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <s.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-foreground">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
