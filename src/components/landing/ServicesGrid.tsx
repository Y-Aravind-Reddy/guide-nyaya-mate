import {
  ArrowRight,
  Baby,
  Car,
  CreditCard,
  Fingerprint,
  Gavel,
  Plane,
  Scale,
  ShieldAlert,
  ShoppingBag,
  Briefcase,
  Home,
  FileBadge,
} from "lucide-react";

const SERVICES = [
  { icon: Plane, title: "Passport", desc: "Apply, renew and track your passport.", tint: "text-primary", bg: "bg-primary/10" },
  { icon: CreditCard, title: "PAN Card", desc: "Apply and link your PAN with ease.", tint: "text-secondary", bg: "bg-secondary/10" },
  { icon: Fingerprint, title: "Aadhaar", desc: "Enrol, update and download Aadhaar.", tint: "text-accent", bg: "bg-accent/10" },
  { icon: Car, title: "Driving Licence", desc: "Learner, permanent and renewals.", tint: "text-primary", bg: "bg-primary/10" },
  { icon: Baby, title: "Birth Certificate", desc: "Register and obtain certificates.", tint: "text-secondary", bg: "bg-secondary/10" },
  { icon: FileBadge, title: "Income Certificate", desc: "Eligibility and application steps.", tint: "text-accent", bg: "bg-accent/10" },
  { icon: FileBadge, title: "Caste Certificate", desc: "Documents and process explained.", tint: "text-primary", bg: "bg-primary/10" },
  { icon: Home, title: "Property Registration", desc: "Registration and stamp duty guidance.", tint: "text-secondary", bg: "bg-secondary/10" },
  { icon: ShieldAlert, title: "Police Complaint", desc: "File FIRs and online complaints.", tint: "text-accent", bg: "bg-accent/10" },
  { icon: ShoppingBag, title: "Consumer Rights", desc: "Resolve disputes and file claims.", tint: "text-primary", bg: "bg-primary/10" },
  { icon: Briefcase, title: "Employment Rights", desc: "Know your workplace protections.", tint: "text-secondary", bg: "bg-secondary/10" },
  { icon: Gavel, title: "Cyber Crime", desc: "Report fraud and stay protected.", tint: "text-accent", bg: "bg-accent/10" },
];

export function ServicesGrid() {
  return (
    <section id="all-services" className="scroll-mt-20 bg-card py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-secondary">
            <Scale className="h-4 w-4" /> Services
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">
            Explore Citizen Services
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Clear, step-by-step guidance for the services people search for most.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="hover-lift group flex flex-col rounded-[20px] border border-border bg-background p-7 shadow-card"
            >
              <span className={`grid h-14 w-14 place-items-center rounded-2xl ${s.bg} ${s.tint}`}>
                <s.icon className="h-7 w-7" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-foreground">{s.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              <button className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all group-hover:gap-2.5">
                Explore <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
