import { Quote, Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    city: "Bengaluru",
    initials: "PS",
    quote:
      "I applied for my passport without visiting any agent. NyayaMate explained every step so clearly!",
    color: "bg-secondary",
  },
  {
    name: "Rahul Verma",
    city: "Delhi",
    initials: "RV",
    quote:
      "Finally understood my tenant rights in plain language. This feels like having a lawyer in my pocket.",
    color: "bg-accent",
  },
  {
    name: "Anjali Reddy",
    city: "Hyderabad",
    initials: "AR",
    quote:
      "Updating my Aadhaar used to scare me. The step-by-step guidance made it effortless and safe.",
    color: "bg-primary",
  },
];

export function SocialProof() {
  return (
    <section id="testimonials" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-16 shadow-premium sm:px-12"
          style={{ background: "linear-gradient(135deg, var(--navy), var(--primary))" }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.25),transparent_45%)]" />
          <div className="relative mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-secondary">
              Social Proof
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              What Citizens Say
            </h2>
          </div>

          <div className="relative mt-12 grid gap-6 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="hover-lift rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-md"
              >
                <Quote className="h-7 w-7 text-secondary" />
                <p className="mt-4 text-[15px] leading-relaxed text-white/90">"{t.quote}"</p>
                <div className="mt-5 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <span className={`grid h-11 w-11 place-items-center rounded-full ${t.color} text-sm font-bold text-white`}>
                    {t.initials}
                  </span>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-white/60">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
